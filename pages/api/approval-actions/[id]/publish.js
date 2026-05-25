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
        const metaErr = error.response?.data?.error;
        const errMsg = metaErr
            ? `${metaErr.error_user_title ? `${metaErr.error_user_title}: ` : ''}${metaErr.error_user_msg || metaErr.message}${metaErr.code || metaErr.error_subcode ? ` (Código: ${metaErr.code || ''}, Subcódigo: ${metaErr.error_subcode || ''})` : ''}`
            : error.message;
        res.status(500).json({ success: false, error: errMsg });
    }
}
