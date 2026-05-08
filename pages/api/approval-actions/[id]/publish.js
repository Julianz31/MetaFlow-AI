const metaAdsService = require('../../../../lib/metaAdsService');
const { getSupabase } = require('../../../../lib/supabase');
const { getMetaCredentials } = require('../../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { data: action, error: fetchError } = await getSupabase()
            .from('action_logs').select('*').eq('id', req.query.id).single();
        if (fetchError) throw fetchError;

        const result = await metaAdsService.publishCampaign(action.campaign_id, getMetaCredentials(req));
        const { error: updateError } = await getSupabase()
            .from('action_logs').update({ status: 'executed' }).eq('id', req.query.id);
        if (updateError) throw updateError;

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
