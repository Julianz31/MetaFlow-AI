const { getSupabase } = require('../../../lib/supabase');

export default async function handler(req, res) {
  const supabase = getSupabase();
  const { id } = req.query;

  if (req.method === 'DELETE') {
    // Fetch first to get storage_path
    const { data: creative, error: fetchError } = await supabase
      .from('creatives')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) return res.status(404).json({ error: 'Creativo no encontrado' });

    // Delete from storage
    if (creative?.storage_path) {
      await supabase.storage.from('creatives').remove([creative.storage_path]);
    }

    const { error } = await supabase.from('creatives').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
