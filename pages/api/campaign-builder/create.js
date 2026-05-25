const metaAdsService = require('../../../lib/metaAdsService');
const { getSupabase } = require('../../../lib/supabase');
const { getMetaCredentials } = require('../../../lib/apiHelpers');
const { requireAuth } = require('../../../lib/auth');
const { requireActiveAccount } = require('../../../lib/accountGuard');

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const user = await requireAuth(req, res);
    if (!user) return;
    const account = await requireActiveAccount(req, res, user.email);
    if (!account) return;

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
        const metaErr = error.response?.data?.error;
        const errMsg = metaErr
            ? `${metaErr.error_user_title ? `${metaErr.error_user_title}: ` : ''}${metaErr.error_user_msg || metaErr.message}${metaErr.code || metaErr.error_subcode ? ` (Código: ${metaErr.code || ''}, Subcódigo: ${metaErr.error_subcode || ''})` : ''}`
            : error.message;
        res.status(500).json({ success: false, error: errMsg });
    }
}
