import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';
import Busboy from 'busboy';

export const config = {
  api: { bodyParser: false },
};

const ALLOWED_MIME = new Set([
  'audio/mpeg', 'audio/mp3',
  'audio/ogg', 'audio/vorbis',
  'audio/aac',
  'audio/mp4', 'audio/x-m4a', 'audio/m4a',
]);
const MAX_BYTES = 16 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  return new Promise((resolve) => {
    let responded = false;
    function reply(status, body) {
      if (!responded) {
        responded = true;
        res.status(status).json(body);
        resolve();
      }
    }

    const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_BYTES, files: 1 } });

    let fileBuffer = null;
    let originalName = 'audio';
    let mimeType = '';
    let limitHit = false;

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType: mime } = info;
      originalName = filename || 'audio';
      mimeType = mime;

      if (!ALLOWED_MIME.has(mime)) {
        file.resume();
        return reply(400, { error: 'Formato no permitido. Use mp3, ogg, aac o m4a.' });
      }

      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('limit', () => { limitHit = true; file.resume(); });
      file.on('close', () => {
        if (!limitHit) fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', async () => {
      if (limitHit) return reply(400, { error: 'El archivo supera el límite de 16 MB.' });
      if (!fileBuffer) return reply(400, { error: 'No se recibió ningún archivo.' });

      try {
        const supabase = getSupabase();
        const ext = originalName.split('.').pop()?.toLowerCase() || 'mp3';
        const storagePath = `${user.id}/welcome-audio-${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('whatsapp-assets')
          .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

        if (uploadErr) {
          console.error('[upload-audio] Storage error:', uploadErr.message);
          return reply(500, { error: uploadErr.message });
        }

        const { data: urlData } = supabase.storage
          .from('whatsapp-assets')
          .getPublicUrl(storagePath);

        const audioUrl = urlData.publicUrl;

        const { error: dbErr } = await supabase
          .from('whatsapp_config')
          .update({ welcome_audio_url: audioUrl, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (dbErr) {
          console.error('[upload-audio] DB error:', dbErr.message);
          return reply(500, { error: dbErr.message });
        }

        return reply(200, { audio_url: audioUrl, filename: originalName });
      } catch (err) {
        console.error('[upload-audio] Unexpected error:', err.message);
        return reply(500, { error: err.message });
      }
    });

    busboy.on('error', (err) => reply(500, { error: err.message }));
    req.pipe(busboy);
  });
}
