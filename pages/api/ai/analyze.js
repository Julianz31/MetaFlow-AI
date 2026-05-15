const metaAdsService = require('../../../lib/metaAdsService');
const aiAnalysisService = require('../../../lib/aiAnalysisService');
const { getMetaCredentials } = require('../../../lib/apiHelpers');
const { requireAuth } = require('../../../lib/auth');
const { checkCredits, deductCredits } = require('../../../lib/credits');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const user = await requireAuth(req, res);
    if (!user) return;

    const creditCheck = await checkCredits(user.email, 'analyze');
    if (!creditCheck.ok) {
        return res.status(creditCheck.status).json({ error: creditCheck.error, balance: creditCheck.balance });
    }

    try {
        const credentials = getMetaCredentials(req);
        const [accountStats, campaigns] = await Promise.all([
            metaAdsService.getAccountStats(credentials),
            metaAdsService.getCampaignsWithInsights(credentials)
        ]);
        const analysis = await aiAnalysisService.analyzeAccount(accountStats, campaigns);

        await deductCredits(user.email, 'analyze', { model: 'claude-sonnet-4-6' });

        res.json({ analysis });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar análisis' });
    }
}
