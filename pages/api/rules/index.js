const { getSupabase } = require('../../../lib/supabase');

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await getSupabase()
                .from('automation_rules').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            res.json({ rules: data || [] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const { name, metric, operator, value, action, active = true, requires_approval = true } = req.body;
            const { data, error } = await getSupabase()
                .from('automation_rules')
                .insert({ name, metric, operator, value, action, active, requires_approval })
                .select().single();
            if (error) throw error;
            res.status(201).json({ rule: data });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    } else {
        res.status(405).end();
    }
}
