const { getSupabase } = require('../../../lib/supabase');

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ error: 'userEmail requerido' });

    const { data, error } = await supabase
      .from('creatives')
      .select('id, angle, label, image_url, headline, primary_text, description, cta, product_name, created_at')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ creatives: data });
  }

  if (req.method === 'POST') {
    const { userEmail, angle, label, imageBase64, headline, primaryText, description, cta, productName } = req.body;
    if (!userEmail || !imageBase64) return res.status(400).json({ error: 'userEmail e imageBase64 requeridos' });

    // Upload image to Supabase Storage
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const fileName = `${userEmail.replace('@', '_')}/${Date.now()}-${angle}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('creatives')
      .upload(fileName, imageBuffer, { contentType: 'image/jpeg', upsert: false });

    if (uploadError) return res.status(500).json({ error: `Error subiendo imagen: ${uploadError.message}` });

    const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('creatives')
      .insert([{
        user_email: userEmail,
        angle,
        label,
        image_url: publicUrl,
        storage_path: fileName,
        headline,
        primary_text: primaryText,
        description,
        cta,
        product_name: productName,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ creative: data });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
