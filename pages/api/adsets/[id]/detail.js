const metaAdsService = require('../../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const detail = await metaAdsService.getAdSetDetail(req.query.id, getMetaCredentials(req));
        res.json(detail);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener detalle del conjunto' });
    }
}
