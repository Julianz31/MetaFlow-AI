const metaAdsService = require('../../lib/metaAdsService');
const rulesEngine = require('../../lib/rulesEngine');
const { getSupabase } = require('../../lib/supabase');
const { getMetaCredentials, getCampaignStatus, getCampaignSummary } = require('../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const { data: rules, error: rulesError } = await getSupabase()
            .from('automation_rules').select('*').eq('active', true);
        if (rulesError) throw rulesError;

        const campaigns = await metaAdsService.getCampaignsWithInsights(getMetaCredentials(req));
        const suggestions = await rulesEngine.evaluate(campaigns, rules || []);

        const campaignsWithAnalysis = campaigns.map((campaign) => {
            const campaignSuggestions = suggestions.filter(s => s.campaign_id === campaign.campaign_id);
            return {
                ...campaign,
                status: getCampaignStatus(campaign, campaignSuggestions),
                suggestions: campaignSuggestions,
                summary: getCampaignSummary(campaign, campaignSuggestions)
            };
        });

        res.json({
            campaigns: campaignsWithAnalysis,
            totalCampaigns: campaignsWithAnalysis.length,
            campaignsWithSuggestions: campaignsWithAnalysis.filter(c => c.suggestions.length > 0).length
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al analizar campañas' });
    }
}
