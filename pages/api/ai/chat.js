const metaAdsService = require('../../../lib/metaAdsService');
const aiAnalysisService = require('../../../lib/aiAnalysisService');
const { getMetaCredentials, getAnthropicKey } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const anthropicKey = getAnthropicKey(req);
    if (!anthropicKey) return res.status(402).json({ error: 'NO_API_KEY' });
    try {
        const { messages } = req.body;
        const credentials = getMetaCredentials(req);
        const [accountStats, campaigns] = await Promise.all([
            metaAdsService.getAccountStats(credentials),
            metaAdsService.getCampaignsWithInsights(credentials)
        ]);
        const reply = await aiAnalysisService.chat(messages, accountStats, campaigns, anthropicKey);
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar pregunta' });
    }
}
