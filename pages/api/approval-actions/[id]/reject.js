const { getSupabase } = require('../../../../lib/supabase');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { error } = await getSupabase()
            .from('action_logs').update({ status: 'rejected' }).eq('id', req.query.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
