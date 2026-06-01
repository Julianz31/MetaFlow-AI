const metaAdsService = require('../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');
const { requireAuth } = require('../../../lib/auth');
const { requireActiveAccount } = require('../../../lib/accountGuard');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const user = await requireAuth(req, res);
    if (!user) return;
    const account = await requireActiveAccount(req, res, user.email);
    if (!account) return;

    try {
        const credentials = getMetaCredentials(req);
        const options = {
            ...credentials,
            date_preset: req.query.date_preset || 'last_7d'
        };
        const campaigns = await metaAdsService.getCampaignsWithInsights(options);
        res.json({ campaigns });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener campañas' });
    }
}
