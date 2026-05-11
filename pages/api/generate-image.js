import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const apiKey = req.headers['x-openai-key'];
  if (!apiKey) return res.status(401).json({ error: 'Se requiere tu API Key de OpenAI. Ingrésala en la sección de Crear Imagen.' });

  const { productName, description, style, primaryColor, secondaryColor, format, customPrompt, productImageBase64 } = req.body;

  if (!productName && !customPrompt && !productImageBase64) {
    return res.status(400).json({ error: 'Se requiere nombre del producto, imagen o prompt personalizado' });
  }

  const styleMap = {
    fotorrealista: 'photorealistic product photography, professional studio lighting, clean background, high-end commercial photography',
    minimalista: 'minimalist clean design, flat lay photography, pastel tones, modern and elegant aesthetic',
    lifestyle: 'lifestyle photography, natural golden-hour lighting, real aspirational environment, warm mood',
    lujo: 'luxury brand photography, dramatic cinematic lighting, dark rich background, premium feel, high contrast, editorial',
    'social-media': 'vibrant social-media ready creative, bold saturated colors, trendy composition, Instagram-worthy, eye-catching'
  };

  const openai = new OpenAI({ apiKey });

  try {
    let productDescription = description || '';

    // If a product image was uploaded, analyze it with GPT-4o Vision first
    if (productImageBase64) {
      const vision = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this product image in detail for use in a DALL-E 3 prompt. Focus on: shape, materials, colors, textures, distinctive design features. Be concise (max 150 words). Do not mention brand names.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${productImageBase64}`, detail: 'low' }
            }
          ]
        }]
      });
      productDescription = vision.choices[0]?.message?.content || productDescription;
    }

    const colorBlock = (primaryColor || secondaryColor)
      ? `Brand color palette: primary color ${primaryColor || '#6366f1'}, secondary color ${secondaryColor || '#ffffff'}. Incorporate these colors naturally into the composition.`
      : '';

    const formatHint = format === 'square'
      ? 'Square 1:1 composition optimized for Instagram and Facebook Feed'
      : format === 'vertical'
        ? 'Vertical 9:16 composition optimized for Stories and Reels'
        : 'Horizontal 16:9 composition optimized for banners and YouTube';

    const prompt = customPrompt || `
Professional e-commerce advertising image for the product "${productName || 'the product shown'}".
${productDescription ? `Product details: ${productDescription}.` : ''}
Visual style: ${styleMap[style] || styleMap.fotorrealista}.
${colorBlock}
${formatHint}.
No text, no logos, no watermarks. Ultra high quality, 4K detail. Ready for paid digital advertising.
`.trim();

    const size = format === 'vertical' ? '1024x1792' : format === 'square' ? '1024x1024' : '1792x1024';

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'hd',
    });

    return res.status(200).json({
      imageUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    });

  } catch (error) {
    const msg = error?.error?.message || error.message || 'Error generando imagen';
    return res.status(500).json({ error: msg });
  }
}
