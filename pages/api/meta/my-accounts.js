import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('connected_ad_accounts')
    .select('id, ad_account_id, ad_account_name, currency, timezone, is_active, connected_at, last_switched_at, plan')
    .eq('user_email', user.email)
    .order('connected_at', { ascending: true });

  if (error) {
    console.error('my-accounts error:', error.message);
    return res.status(500).json({ error: 'Error al obtener cuentas' });
  }

  return res.json({ accounts: data || [] });
}
