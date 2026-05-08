const metaAdsService = require('../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const campaigns = await metaAdsService.getCampaignsWithInsights(getMetaCredentials(req));
        res.json({ campaigns });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener campañas' });
    }
}
