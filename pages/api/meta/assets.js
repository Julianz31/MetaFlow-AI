const metaAdsService = require('../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const assets = await metaAdsService.getBusinessAssets(getMetaCredentials(req));
        res.json(assets);
    } catch (error) {
        res.status(500).json({ pages: [], defaults: {}, error: 'No se pudieron cargar los assets' });
    }
}
