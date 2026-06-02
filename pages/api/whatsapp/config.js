import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';
import { encrypt, decrypt } from '../../../lib/encrypt';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('id, phone_number_id, access_token, verify_token, agent_name, agent_prompt, is_active, meta_verified, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      config: data
        ? { ...data, has_access_token: !!data.access_token }
        : null,
    });
  }

  if (req.method === 'POST') {
    const { agent_name, agent_prompt, phone_number_id, access_token, is_active } = req.body;

    const updates = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (agent_name !== undefined) updates.agent_name = agent_name;
    if (agent_prompt !== undefined) updates.agent_prompt = agent_prompt;
    if (phone_number_id !== undefined) updates.phone_number_id = phone_number_id;
    if (is_active !== undefined) updates.is_active = is_active;
    if (access_token && access_token !== '••••••••') {
      updates.access_token = encrypt(access_token);
    }

    const { data, error } = await supabase
      .from('whatsapp_config')
      .upsert(updates, { onConflict: 'user_id' })
      .select('id, phone_number_id, verify_token, agent_name, agent_prompt, is_active, meta_verified, updated_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ config: data });
  }

  return res.status(405).end();
}
