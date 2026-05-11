const { getSupabase } = require('../../../lib/supabase');

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { userId } = req.query;
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ products: data });
  }

  if (req.method === 'POST') {
    const { name, description, price, currency, image_url, product_url, category, tags, userId } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del producto es requerido' });

    const { data, error } = await supabase
      .from('products')
      .insert([{ name, description, price, currency: currency || 'COP', image_url, product_url, category, tags, user_id: userId || null }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ product: data });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
