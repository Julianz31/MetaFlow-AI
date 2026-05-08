const metaAdsService = require('../../../lib/metaAdsService');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const copy = await metaAdsService.generateCampaignCopy(req.body);
        res.json({ success: true, copy });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
