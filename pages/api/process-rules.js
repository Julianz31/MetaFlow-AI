const metaAdsService = require('../../lib/metaAdsService');
const rulesEngine = require('../../lib/rulesEngine');
const { getSupabase } = require('../../lib/supabase');
const { getMetaCredentials } = require('../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { userId } = req.body;
    try {
        const { data: rules, error: rulesError } = await getSupabase()
            .from('automation_rules').select('*').eq('active', true);
        if (rulesError) throw rulesError;

        const campaignData = await metaAdsService.getCampaignsWithInsights(getMetaCredentials(req));
        const suggestions = await rulesEngine.evaluate(campaignData, rules);

        if (suggestions.length > 0) {
            const logsToInsert = suggestions.map(s => ({
                user_id: userId || 'system',
                campaign_id: s.campaign_id,
                campaign_name: s.campaign_name,
                action_suggested: s.action,
                reason: s.reason,
                status: 'pending'
            }));
            const { error: insertError } = await getSupabase().from('action_logs').insert(logsToInsert);
            if (insertError) throw insertError;
        }

        res.json({ success: true, message: 'Análisis completado', actionsFound: suggestions.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
