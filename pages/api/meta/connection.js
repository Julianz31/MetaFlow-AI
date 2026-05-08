const metaAdsService = require('../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const connection = await metaAdsService.testSystemUserConnection(getMetaCredentials(req));
        res.json(connection);
    } catch (error) {
        res.status(500).json({ ok: false, error: 'No se pudo validar la conexión con Meta Ads' });
    }
}
