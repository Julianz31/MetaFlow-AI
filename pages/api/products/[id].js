const { getSupabase } = require('../../../lib/supabase');

export default async function handler(req, res) {
  const supabase = getSupabase();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { name, description, price, currency, image_url, product_url, category, tags } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({ name, description, price, currency, image_url, product_url, category, tags, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ product: data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
