const metaAdsService = require('../../../lib/metaAdsService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const connection = await metaAdsService.testSystemUserConnection(getMetaCredentials(req));
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
