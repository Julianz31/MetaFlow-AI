const metaAdsService = require('../../../lib/metaAdsService');
const { getSupabase } = require('../../../lib/supabase');
const { getMetaCredentials } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const result = await metaAdsService.createCampaignFromCreatives(req.body, getMetaCredentials(req));
        await getSupabase().from('action_logs').insert({
            user_id: req.body.userId || 'system',
            campaign_id: result.campaign_id,
            campaign_name: req.body.name || `Campaña ${result.campaign_id}`,
            action_suggested: 'publish_campaign',
            reason: 'Campaña creada en PAUSED y lista para aprobación final',
            status: 'pending'
        });
        res.json({ success: true, message: 'Campaña creada en pausa para revisión', result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
