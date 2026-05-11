const { getSupabase } = require('../../../lib/supabase');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ products: data });
  }

  if (req.method === 'POST') {
    const { name, description, price, currency, image_url, product_url, category, tags, userEmail } = req.body;

    if (userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Solo el administrador puede crear productos' });
    }

    if (!name) return res.status(400).json({ error: 'El nombre del producto es requerido' });

    const { data, error } = await supabase
      .from('products')
      .insert([{ name, description, price, currency: currency || 'COP', image_url, product_url, category, tags }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ product: data });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
