import { requireAuth } from '../../../lib/auth';
import { getUserCredits } from '../../../lib/credits';
import { toggleAccount } from '../../../lib/accountGuard';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const { adAccountId, activate } = req.body;
  if (!adAccountId || typeof activate !== 'boolean') {
    return res.status(400).json({ error: 'Se requieren adAccountId (string) y activate (boolean)' });
  }

  const credits = await getUserCredits(user.email);
  const plan = credits.plan || 'pro';

  const result = await toggleAccount(user.email, adAccountId, activate, plan);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error, code: result.code, daysLeft: result.daysLeft, limit: result.limit });
  }

  return res.json({ ok: true });
}
