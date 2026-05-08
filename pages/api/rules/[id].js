const { getSupabase } = require('../../../lib/supabase');

export default async function handler(req, res) {
    const { id } = req.query;
    if (req.method === 'PUT') {
        try {
            const { name, metric, operator, value, action, active, requires_approval } = req.body;
            const { data, error } = await getSupabase()
                .from('automation_rules')
                .update({ name, metric, operator, value, action, active, requires_approval, updated_at: new Date().toISOString() })
                .eq('id', id).select().single();
            if (error) throw error;
            res.json({ rule: data });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { error } = await getSupabase().from('automation_rules').delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    } else {
        res.status(405).end();
    }
}
