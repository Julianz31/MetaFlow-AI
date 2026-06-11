// Endpoint NUEVO (beta) — generador product-hero con motor HTML/CSS + Chromium.
// Aislado del generador en producción (/api/generate-image). Devuelve el mismo
// shape { images: [{ imageUrl, angle, label, copy }] } para encajar con la UI.

const { generateHeroCreative } = require('../../lib/heroRenderer');
const { requireAuth } = require('../../lib/auth');
const { checkCredits, deductCredits, CREDIT_COSTS } = require('../../lib/credits');

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
  maxDuration: 300, // Chromium + 2 llamadas a Gemini; requiere plan Vercel con 300s
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const {
    productName,
    description,
    primaryColor = '#A855F7',
    productImageBase64,
    cleanLabel = false,
  } = req.body || {};

  if (!productImageBase64) {
    return res.status(400).json({ error: 'Se requiere la imagen del producto.' });
  }

  const creditCheck = await checkCredits(user.email, 'generate_image');
  if (!creditCheck.ok) {
    return res.status(creditCheck.status).json({ error: creditCheck.error, balance: creditCheck.balance });
  }

  try {
    const { imageUrl, copy } = await generateHeroCreative({
      productName, description, primaryColor, productImageBase64, cleanLabel,
    });

    await deductCredits(user.email, 'generate_image', {
      model: 'gemini-2.5-flash-image + chromium',
      output_format: 'vertical',
      final_width: 1080,
      final_height: 1350,
      jpeg_quality: 90,
      number_of_images: 1,
      estimated_cost_usd: 0.08,
      credits_charged: CREDIT_COSTS.generate_image || 0,
      user_id: user.id,
      quality_tier: 'premium_product_hero',
      metadata: { engine: 'hero_html_chromium', clean_label: !!cleanLabel },
    });

    return res.status(200).json({
      images: [{ imageUrl, angle: 'product_hero', label: 'Product Hero', copy }],
    });
  } catch (err) {
    console.error('generate-hero error:', err);
    return res.status(500).json({ error: err.message || 'Error generando el creativo' });
  }
}
