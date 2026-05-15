import metaAdsService from '../../../lib/metaAdsService';
import { getMetaCredentials } from '../../../lib/apiHelpers';
import { requireAuth } from '../../../lib/auth';
import { getUserCredits } from '../../../lib/credits';
import { syncAccounts } from '../../../lib/accountGuard';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const connection = await metaAdsService.testSystemUserConnection(getMetaCredentials(req));

    // Sync all ad accounts returned by Meta into the DB
    if (connection.adAccounts?.length > 0) {
      const credits = await getUserCredits(user.email);
      const plan = credits.plan || 'pro';
      await syncAccounts(user.email, user.id, connection.adAccounts, plan).catch((err) => {
        console.error('syncAccounts error (non-fatal):', err.message);
      });
    }

    res.json(connection);
  } catch (error) {
    const metaError = error.response?.data?.error;
    const detail = metaError
      ? `[${metaError.code}] ${metaError.message}`
      : error.message;
    console.error('connection error:', detail);
    res.status(500).json({ ok: false, error: 'No se pudo validar la conexión con Meta Ads', detail });
  }
}
