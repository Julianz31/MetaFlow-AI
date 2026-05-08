const { getSupabase } = require('../../../lib/supabase');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    try {
        const { data, error } = await getSupabase()
            .from('action_logs').select('*').eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ actions: data || [] });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener acciones pendientes' });
    }
}
