const { generateSuggestNotifications } = require('../../lib/autoOptimizeService');
const { getSupabase } = require('../../lib/supabase');
const { getMetaCredentials } = require('../../lib/apiHelpers');
const { requireAuth } = require('../../lib/auth');
const { requireActiveAccount } = require('../../lib/accountGuard');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const user = await requireAuth(req, res);
    if (!user) return;
    const account = await requireActiveAccount(req, res, user.email);
    if (!account) return;

    try {
        const result = await generateSuggestNotifications({
            userId: req.body.userId || 'system',
            options: getMetaCredentials(req),
            supabase: getSupabase()
        });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
