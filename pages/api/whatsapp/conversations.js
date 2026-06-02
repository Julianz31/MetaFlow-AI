import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select(`
      id,
      status,
      last_message,
      last_message_at,
      unread_count,
      created_at,
      whatsapp_contacts (
        id,
        wa_id,
        name,
        phone
      )
    `)
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ conversations: data || [] });
}
