import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const { conversation_id, action } = req.body;

  if (!conversation_id || !['take', 'release'].includes(action)) {
    return res.status(400).json({ error: 'conversation_id y action (take|release) son requeridos' });
  }

  const supabase = getSupabase();

  const newStatus = action === 'take' ? 'human' : 'bot';

  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .update({ status: newStatus })
    .eq('id', conversation_id)
    .eq('user_id', user.id)
    .select('id, status')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Conversación no encontrada' });

  return res.json({ conversation: data });
}
