const metaAdsService = require('../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');
const { requireAuth } = require('../../../lib/auth');
const { requireActiveAccount } = require('../../../lib/accountGuard');

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const user = await requireAuth(req, res);
    if (!user) return;
    const account = await requireActiveAccount(req, res, user.email);
    if (!account) return;

    try {
        const { campaignId, adsetId, ...payload } = req.body;
        if (!campaignId || !adsetId) {
            return res.status(400).json({ success: false, error: 'campaignId y adsetId son requeridos' });
        }
        const ads = await metaAdsService.addAdsBatch(payload, campaignId, adsetId, getMetaCredentials(req));
        res.json({ success: true, ads });
    } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message;
        res.status(500).json({ success: false, error: errMsg });
    }
}
