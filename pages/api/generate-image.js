import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const apiKey = req.headers['x-openai-key'] || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(401).json({ error: 'Se requiere OPENAI_API_KEY' });

  const { productName, description, style, colors, format, customPrompt } = req.body;

  if (!productName && !customPrompt) {
    return res.status(400).json({ error: 'Se requiere nombre del producto o prompt personalizado' });
  }

  const styleMap = {
    'fotorrealista': 'photorealistic product photography, studio lighting, white background, high-end commercial photography',
    'minimalista': 'minimalist clean design, flat lay photography, pastel background, modern aesthetic',
    'lifestyle': 'lifestyle photography, natural lighting, real environment, aspirational and warm mood',
    'lujo': 'luxury brand photography, dramatic lighting, dark elegant background, premium feel, high contrast',
    'social-media': 'vibrant social media ready, bold colors, trendy composition, Instagram-worthy'
  };

  const colorHint = colors ? `Color palette: ${colors}.` : '';
  const formatHint = format === 'square' ? 'Square 1:1 composition' : format === 'vertical' ? 'Vertical 9:16 composition for Stories' : 'Horizontal 16:9 composition';

  const prompt = customPrompt || `
Professional e-commerce advertisement image for "${productName}".
${description ? `Product description: ${description}.` : ''}
Style: ${styleMap[style] || styleMap['fotorrealista']}.
${colorHint}
${formatHint}.
No text overlays. Ultra high quality, 4K detail. Perfect for digital advertising.
`.trim();

  try {
    const openai = new OpenAI({ apiKey });

    const size = format === 'vertical' ? '1024x1792' : format === 'square' ? '1024x1024' : '1792x1024';

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'hd',
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    return res.status(200).json({ imageUrl, revisedPrompt });
  } catch (error) {
    const msg = error?.error?.message || error.message || 'Error generando imagen';
    return res.status(500).json({ error: msg });
  }
}
