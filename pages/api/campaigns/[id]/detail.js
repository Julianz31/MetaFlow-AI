const metaAdsService = require('../../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const credentials = getMetaCredentials(req);
        const options = {
            ...credentials,
            date_preset: req.query.date_preset || 'last_7d'
        };
        const detail = await metaAdsService.getCampaignDetail(req.query.id, options);
        res.json(detail);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener detalle de campaña' });
    }
}
