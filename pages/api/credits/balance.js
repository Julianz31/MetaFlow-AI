const { requireAuth } = require('../../../lib/auth');
const { getBalance, CREDIT_COSTS } = require('../../../lib/credits');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const balance = await getBalance(user.email);
  return res.json({ balance, costs: CREDIT_COSTS });
}
