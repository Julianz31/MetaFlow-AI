import { getSupabase } from '../../../lib/supabase';

const GRACE_DAYS = 5;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email requerido' });

  const supabase = getSupabase();
  const { data: rows } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  const sub = rows?.[0] ?? null;

  if (!sub) {
    return res.json({ status: 'inactive', isActive: false, gracePeriod: false });
  }

  const now = new Date();
  const periodEnd = new Date(sub.current_period_end);
  const graceEnd = new Date(sub.grace_period_end);

  let status = sub.status;
  let isActive = false;
  let gracePeriod = false;
  let daysLeft = 0;

  if (status === 'active' && periodEnd >= now) {
    isActive = true;
    daysLeft = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
  } else if (periodEnd < now && graceEnd >= now) {
    // Período de gracia
    gracePeriod = true;
    isActive = true; // Acceso permitido durante gracia
    daysLeft = Math.ceil((graceEnd - now) / (1000 * 60 * 60 * 24));
    status = 'grace';
    // Actualizar estado en DB si aún dice 'active'
    if (sub.status === 'active') {
      await supabase
        .from('subscriptions')
        .update({ status: 'grace', updated_at: now.toISOString() })
        .eq('user_email', email);
    }
  } else if (graceEnd < now) {
    isActive = false;
    status = 'inactive';
    if (sub.status !== 'inactive') {
      await supabase
        .from('subscriptions')
        .update({ status: 'inactive', updated_at: now.toISOString() })
        .eq('user_email', email);
    }
  }

  return res.json({
    status,
    isActive,
    gracePeriod,
    daysLeft,
    plan: sub.plan,
    currentPeriodEnd: sub.current_period_end,
  });
}
