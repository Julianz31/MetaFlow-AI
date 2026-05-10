const metaAdsService = require('./metaAdsService');

const SCALE_PCT = 25;
const COOLDOWN_HOURS = 4;
const ROAS_NOTIFY_THRESHOLD = 3.0;
const MIN_SPEND = 5;

const hoursSince = (isoTimestamp) =>
    (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60);

const getLastAutoScale = async (campaignId, supabase) => {
    const { data } = await supabase
        .from('action_logs')
        .select('created_at')
        .eq('campaign_id', campaignId)
        .eq('action_suggested', 'scale_budget_auto')
        .eq('status', 'executed')
        .order('created_at', { ascending: false })
        .limit(1);
    return data?.[0] || null;
};

const hasRecentNotification = async (campaignId, supabase) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
        .from('action_logs')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('action_suggested', 'suggest_new_campaign')
        .in('status', ['pending', 'executed'])
        .gte('created_at', since)
        .limit(1);
    return (data?.length || 0) > 0;
};

// Called from process-rules when a scale_budget rule has requires_approval: false
const executeAutoScale = async ({ suggestion, userId, options, supabase }) => {
    const last = await getLastAutoScale(suggestion.campaign_id, supabase);
    if (last && hoursSince(last.created_at) < COOLDOWN_HOURS) {
        return { skipped: true, reason: `Cooldown activo — último escalado hace ${hoursSince(last.created_at).toFixed(1)}h` };
    }

    const results = await metaAdsService.scaleCampaignBudget(suggestion.campaign_id, SCALE_PCT, options);
    if (results.length === 0) {
        return { skipped: true, reason: 'No se encontraron adsets con presupuesto diario' };
    }

    const detail = results
        .map(r => `${r.adset_name}: ${r.old_budget} → ${r.new_budget}`)
        .join(' | ');

    await supabase.from('action_logs').insert({
        user_id: userId || 'system',
        campaign_id: suggestion.campaign_id,
        campaign_name: suggestion.campaign_name,
        action_suggested: 'scale_budget_auto',
        reason: `${suggestion.reason} — presupuesto subido ${SCALE_PCT}% automáticamente (${detail})`,
        status: 'executed'
    });

    return { executed: true, detail };
};

// Generates suggest_new_campaign notifications for top-performing campaigns
const generateSuggestNotifications = async ({ userId, options, supabase }) => {
    const campaigns = await metaAdsService.getCampaignsWithInsights(options);
    const notified = [];

    for (const campaign of campaigns) {
        if (campaign.effective_status !== 'ACTIVE') continue;
        if (campaign.spend < MIN_SPEND) continue;
        if (campaign.roas < ROAS_NOTIFY_THRESHOLD) continue;

        const alreadyNotified = await hasRecentNotification(campaign.campaign_id, supabase);
        if (!alreadyNotified) {
            await supabase.from('action_logs').insert({
                user_id: userId || 'system',
                campaign_id: campaign.campaign_id,
                campaign_name: campaign.campaign_name,
                action_suggested: 'suggest_new_campaign',
                reason: `ROAS ${campaign.roas}x con $${campaign.spend} invertidos — considera lanzar otra campaña con creativos similares`,
                status: 'pending'
            });
            notified.push(campaign.campaign_name);
        }
    }

    return { notified };
};

module.exports = { executeAutoScale, generateSuggestNotifications };
