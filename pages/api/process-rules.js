const metaAdsService = require('../../lib/metaAdsService');
const rulesEngine = require('../../lib/rulesEngine');
const { executeAutoScale } = require('../../lib/autoOptimizeService');
const { getSupabase } = require('../../lib/supabase');
const { getMetaCredentials } = require('../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { userId } = req.body;
    const options = getMetaCredentials(req);
    const supabase = getSupabase();

    try {
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules').select('*').eq('active', true);
        if (rulesError) throw rulesError;

        const campaignData = await metaAdsService.getCampaignsWithInsights(options);
        const suggestions = await rulesEngine.evaluate(campaignData, rules);

        const autoScaled = [];
        const pending = [];

        for (const s of suggestions) {
            if (s.action === 'scale_budget' && s.requires_approval === false) {
                const result = await executeAutoScale({ suggestion: s, userId, options, supabase });
                if (result.executed) autoScaled.push(s.campaign_name);
            } else {
                pending.push(s);
            }
        }

        if (pending.length > 0) {
            const logsToInsert = pending.map(s => ({
                user_id: userId || 'system',
                campaign_id: s.campaign_id,
                campaign_name: s.campaign_name,
                action_suggested: s.action,
                reason: s.reason,
                status: 'pending'
            }));
            const { error: insertError } = await supabase.from('action_logs').insert(logsToInsert);
            if (insertError) throw insertError;
        }

        res.json({
            success: true,
            message: 'Análisis completado',
            autoScaled: autoScaled.length,
            actionsFound: pending.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
