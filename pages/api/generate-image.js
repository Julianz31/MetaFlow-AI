// Generador de anuncios — MOTOR NUEVO (HTML/CSS + Chromium, 11 ángulos).
// Reemplaza el motor viejo (Gemini dibujaba todo el diseño/texto). El código
// viejo permanece en el historial de git. Mismo contrato de request/response.

const { generateBatch, analyzeProduct, pickAngles } = require('../../lib/adEngine');
const { requireAuth } = require('../../lib/auth');
const { checkCredits, deductCredits, CREDIT_COSTS } = require('../../lib/credits');

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
  maxDuration: 60, // Hobby (Pro permite 300s para lotes grandes)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const {
    productName,
    description,
    angles,
    angle = 'desire',
    format = 'vertical',
    primaryColor = '#7C3AED',
    secondaryColor,
    productImageBase64,
    adjustmentInstruction,
    variationsCount = 1,
    existingCopy,
    cleanLabel = true,
    autoAngles = false,
    angleCount = 2,
    skin,
  } = req.body || {};

  if (!productName && !productImageBase64) {
    return res.status(400).json({ error: 'Se requiere nombre del producto o imagen.' });
  }

  const numVariations = Math.min(Math.max(1, variationsCount), 3);

  const creditCheck = await checkCredits(user.email, 'generate_image');
  if (!creditCheck.ok) {
    return res.status(creditCheck.status).json({ error: creditCheck.error, balance: creditCheck.balance });
  }

  try {
    // Contexto de producto (grounding del copy + escena)
    let productContext;
    const strip = productImageBase64 ? productImageBase64.replace(/^data:image\/\w+;base64,/, '') : null;
    if (strip) {
      const visual = await analyzeProduct(strip);
      productContext = `[VISUAL ANALYSIS OF PRODUCT PACKAGING]:
${visual}

[REAL SELLER DESCRIPTION - MUST BE THE PRIMARY SOURCE OF BENEFITS AND CLAIMS]:
${description || 'No description provided.'}`;
    } else {
      productContext = `[REAL SELLER DESCRIPTION - MUST BE THE PRIMARY SOURCE OF BENEFITS AND CLAIMS]:
Product Name: ${productName}
Description: ${description || ''}`;
    }

    // Ángulos: explícitos > automáticos (la IA elige los mejores para el producto)
    const explicitAngles = Array.isArray(angles) && angles.length > 0 ? angles : null;
    const selectedAngles = explicitAngles
      || (autoAngles ? await pickAngles(productContext, angleCount) : [angle]);

    // existingCopy solo aplica en ajuste de un único ángulo
    const useExistingCopy = existingCopy && selectedAngles.length === 1;

    const jobs = selectedAngles.flatMap((a, ai) =>
      Array.from({ length: numVariations }, (_, v) => ({
        angle: a,
        productContext,
        primaryColor,
        secondaryColor,
        productImageBase64,
        format,
        variation: v,
        // Cada creativo del lote sale con un skin (diseño) distinto; en ajustes
        // se respeta el skin original para no cambiarle el look al usuario.
        skinId: skin || undefined,
        skinIndex: ai * 2 + v,
        existingCopy: useExistingCopy ? existingCopy : undefined,
        adjustmentInstruction,
        cleanLabel,
      }))
    );

    const { images, errors } = await generateBatch(jobs);

    if (!images.length) {
      return res.status(500).json({ error: errors[0] || 'Error generando imágenes' });
    }

    const creditsCharged = CREDIT_COSTS.generate_image * images.length;
    await deductCredits(user.email, 'generate_image', {
      model: 'gemini-2.5-flash-image + chromium',
      output_format: format,
      number_of_images: images.length,
      estimated_cost_usd: parseFloat((images.length * 0.08).toFixed(4)),
      credits_charged: creditsCharged,
      user_id: user.id,
      quality_tier: 'premium_html_chromium',
      metadata: {
        angles: selectedAngles,
        num_angles: selectedAngles.length,
        auto_angles: !explicitAngles && !!autoAngles,
        variations_per_angle: numVariations,
        errors_count: errors.length,
        engine: 'adEngine_v2',
      },
    });

    return res.status(200).json({ images, ...(errors.length && { errors }) });
  } catch (err) {
    console.error('generate-image error:', err);
    return res.status(500).json({ error: err.message || 'Error generando imágenes' });
  }
}
