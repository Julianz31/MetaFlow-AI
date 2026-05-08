const metaAdsService = require('../../lib/metaAdsService');
const { getSupabase } = require('../../lib/supabase');
const { getMetaCredentials } = require('../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const stats = await metaAdsService.getAccountStats(getMetaCredentials(req));
        const { count } = await getSupabase()
            .from('action_logs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        res.json({ ...stats, acciones: count || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error al conectar con Meta Ads' });
    }
}
