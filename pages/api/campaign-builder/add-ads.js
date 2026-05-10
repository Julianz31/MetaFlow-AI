const metaAdsService = require('../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { campaignId, adsetId, ...payload } = req.body;
        if (!campaignId || !adsetId) {
            return res.status(400).json({ success: false, error: 'campaignId y adsetId son requeridos' });
        }
        const ads = await metaAdsService.addAdsBatch(payload, campaignId, adsetId, getMetaCredentials(req));
        res.json({ success: true, ads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
