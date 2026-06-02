import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';
import { decrypt } from '../../../lib/encrypt';

const WA_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { conversation_id } = req.query;
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id requerido' });

    // Verify the conversation belongs to this user
    const { data: conv } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('id, direction, sender, content, wa_message_id, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Reset unread count
    await supabase
      .from('whatsapp_conversations')
      .update({ unread_count: 0 })
      .eq('id', conversation_id);

    return res.json({ messages: data || [] });
  }

  if (req.method === 'POST') {
    const { conversation_id, content } = req.body;
    if (!conversation_id || !content?.trim()) {
      return res.status(400).json({ error: 'conversation_id y content son requeridos' });
    }

    // Verify conversation and get contact info
    const { data: conv } = await supabase
      .from('whatsapp_conversations')
      .select('id, contact_id, whatsapp_contacts(wa_id)')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single();

    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    // Get WhatsApp config for this user
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('phone_number_id, access_token')
      .eq('user_id', user.id)
      .single();

    if (!config?.phone_number_id || !config?.access_token) {
      return res.status(400).json({ error: 'WhatsApp no configurado' });
    }

    const waId = conv.whatsapp_contacts?.wa_id;
    if (!waId) return res.status(400).json({ error: 'Contacto sin wa_id' });

    // Save message first
    const { data: msg, error: msgErr } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id,
        user_id: user.id,
        direction: 'outbound',
        sender: 'human',
        content: content.trim(),
      })
      .select()
      .single();

    if (msgErr) return res.status(500).json({ error: msgErr.message });

    // Update conversation
    await supabase
      .from('whatsapp_conversations')
      .update({ last_message: content.trim(), last_message_at: new Date().toISOString() })
      .eq('id', conversation_id);

    // Send via Meta Graph API
    const rawToken = decrypt(config.access_token);
    const waRes = await fetch(
      `https://graph.facebook.com/${WA_API_VERSION}/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rawToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: waId,
          type: 'text',
          text: { body: content.trim() },
        }),
      }
    );

    const waResult = await waRes.json();
    if (!waRes.ok) {
      console.error('[WhatsApp] Send error:', waResult);
    }

    return res.json({ message: msg });
  }

  return res.status(405).end();
}
