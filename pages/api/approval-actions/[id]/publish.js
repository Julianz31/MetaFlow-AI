const metaAdsService = require('../../../../lib/metaAdsService');
const { getSupabase } = require('../../../../lib/supabase');
const { getMetaCredentials } = require('../../../../lib/apiHelpers');
const { requireAuth } = require('../../../../lib/auth');
const { requireActiveAccount } = require('../../../../lib/accountGuard');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const user = await requireAuth(req, res);
    if (!user) return;
    const account = await requireActiveAccount(req, res, user.email);
    if (!account) return;

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
        const errMsg = error.response?.data?.error?.message || error.message;
        res.status(500).json({ success: false, error: errMsg });
    }
}
