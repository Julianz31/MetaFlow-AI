import sharp from 'sharp';
const { buildSvgTemplate, DIMS } = require('../../lib/adTemplates');

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
};

const GEMINI_VISION_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const GEMINI_IMAGE_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;

// Gemini now generates BACKGROUND SCENES ONLY — no text, no logos, no product.
// All design/text is handled by our SVG templates composited on top.
const NO_TEXT_RULE = `CRITICAL: Do NOT add any text, words, letters, logos, watermarks, or graphic design elements to the image. Generate ONLY a clean photorealistic background scene with people and/or environment. No product objects of any kind. The design layer will be added separately.`;

function formatHint(format) {
  if (format === 'vertical') return 'Vertical 9:16 portrait framing, optimized for Stories/Reels.';
  if (format === 'horizontal') return 'Horizontal 16:9 landscape framing, optimized for banners.';
  return 'Square 1:1 framing, optimized for Feed.';
}

// ─── BACKGROUND SCENE PROMPTS (angle-specific mood, NO text, NO product) ────

const ANGLE_SCENES = {
  pain: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A real person looking genuinely frustrated, stressed, or worried about the exact problem this product solves. Warm interior setting — home, bathroom, living room. Slightly dark, moody emotional tone. Authentic, relatable expression.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  desire: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A radiant, happy, successful-looking person who has achieved their ideal result. Golden hour or soft natural light. Premium clean environment — beautiful home, outdoors, wellness space. Warm aspirational feel. Genuine smile.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  transformation: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A person in a bright, warm, energizing environment — conveying positive change and growth. Vibrant lighting, premium space. The person looks confident and thriving.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  objection: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A thoughtful, intelligent-looking person in a clean trustworthy home environment. Bright, calm, believable setting. Person's expression: moving from skeptical to reassured. Warm credible atmosphere.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  urgency: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: High-energy, dynamic scene. An excited, action-oriented person in a vibrant, colorful environment. Fast-paced feel, vivid contrasts, electric atmosphere.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  authority: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Clean, premium, clinical or high-end environment. A confident professional-looking person. Crisp lighting, minimal modern aesthetic. Conveys expertise, trust, and quality. Think editorial/magazine look.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  comparison: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A split-mood scene — one side feeling dull/gray/uninspiring, the other side bright/warm/premium. A person in a transitional or contrasting setting. Natural lighting with strong visual contrast.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  guarantee: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Calm, peaceful, reassuring environment. A completely relaxed and satisfied person — zero-stress expression, content smile. Soft warm lighting. Conveys total safety, trust, and peace of mind.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  social_proof: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Warm, community-feel environment. A happy, glowing, relatable person — the kind others aspire to be like. Natural warm lighting, welcoming and friendly space.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  curiosity: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Intriguing, slightly dramatic, atmospheric. A person with a genuinely surprised or mind-blown expression. Slightly moody cinematic lighting — dark edges, focused center. A sense that something unexpected is being revealed.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),

  price: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Energetic, celebratory, exciting. A happy person reacting with excitement to great news (a deal). Vibrant bright colors, dynamic movement feel, festive atmosphere.
${NO_TEXT_RULE}
${formatHint(format)}`.trim(),
};

// ─── ANGLE LABELS ────────────────────────────────────────────────────────────

const ANGLE_LABELS = {
  pain: 'Dolor', desire: 'Deseo', transformation: 'Transformación',
  objection: 'Objeción', urgency: 'Urgencia', authority: 'Autoridad',
  comparison: 'Comparativa', guarantee: 'Garantía', social_proof: 'Prueba Social',
  curiosity: 'Curiosidad', price: 'Precio/Oferta',
};

// ─── COPY GENERATION ─────────────────────────────────────────────────────────

const COPY_ANGLE_INSTRUCTIONS = {
  pain:           'Connect with the frustration and position the product as the relief they need.',
  desire:         'Paint the aspirational life the audience wants and show how the product gets them there.',
  transformation: 'Contrast the before (struggle) vs after (success) with the product as the catalyst.',
  objection:      'Acknowledge skepticism, use social proof and reassurance to remove all doubt.',
  urgency:        'Create FOMO and scarcity — they must act right now or miss out.',
  authority:      'Establish expert credibility, science-backed results, and premium positioning.',
  comparison:     'Show clear superiority over alternatives — us vs them.',
  guarantee:      'Remove all purchase risk — emphasize guarantee and zero downside.',
  social_proof:   'Leverage numbers, reviews, and testimonials for herd effect.',
  curiosity:      'Create an irresistible hook with a surprising question or secret.',
  price:          'Highlight the deal, discount, or value stack — make the price feel like a steal.',
};

async function generateCopy(productContext, angleKey, angleLabel, apiKey) {
  const instruction = COPY_ANGLE_INSTRUCTIONS[angleKey] || COPY_ANGLE_INSTRUCTIONS.desire;
  const prompt = `Generate Facebook/Instagram ad copy in Spanish for a "${angleLabel}" angle ad.

Product: ${productContext}

Angle goal: ${instruction}

Return ONLY a valid JSON object — no markdown, no explanation, no code block:
{
  "headline": "Max 40 chars. Punchy headline that fits the ${angleLabel} angle.",
  "primaryText": "2-3 sentences. Emotional and persuasive body copy. Specific to this product.",
  "description": "Max 30 chars. Short benefit or offer description.",
  "cta": "One of: Comprar ahora | Ver más | Obtener oferta | Saber más | Aprovechar oferta | Lo quiero"
}`;

  const res = await fetch(GEMINI_VISION_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 },
    }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── PRODUCT ANALYSIS ────────────────────────────────────────────────────────

async function analyzeProduct(imageBase64, apiKey) {
  const res = await fetch(GEMINI_VISION_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `Analyze this product image for advertising. Return a concise marketing brief (max 80 words):
- Product name and type
- The main problem it solves (emotional perspective)
- Top 3 specific benefits
- Target audience
- Key selling proposition
Be specific and factual based on what you see.`,
          },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        ],
      }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Error analizando producto');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── BACKGROUND GENERATION ───────────────────────────────────────────────────

async function generateBackground(scenePrompt, apiKey) {
  const res = await fetch(GEMINI_IMAGE_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: scenePrompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Error generando imagen');
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imgPart) throw new Error('Gemini no devolvió imagen. Verifica tu API key de Google AI Studio.');
  return { data: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType };
}

// ─── COMPOSITE: background + SVG template + product ──────────────────────────

async function compositeAll({ backgroundBase64, svgTemplate, productBase64, format }) {
  const { w, h } = DIMS[format] || DIMS.square;

  // 1. Resize background to exact ad dimensions
  const bgBuffer = await sharp(Buffer.from(backgroundBase64, 'base64'))
    .resize(w, h, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 95 })
    .toBuffer();

  // 2. Render SVG template to a transparent PNG
  const templatePng = await sharp(Buffer.from(svgTemplate))
    .resize(w, h)
    .png()
    .toBuffer();

  const layers = [{ input: templatePng, blend: 'over' }];

  // 3. Optionally composite product photo
  if (productBase64) {
    const targetH = Math.round(h * 0.38);
    const resizedProduct = await sharp(Buffer.from(productBase64, 'base64'))
      .resize({ height: targetH, fit: 'inside', withoutEnlargement: false })
      .png()
      .toBuffer();

    const { width: pw } = await sharp(resizedProduct).metadata();
    const left = Math.round((w - pw) / 2);
    const top = Math.round(h * 0.52);

    layers.push({ input: resizedProduct, left, top, blend: 'over' });
  }

  const result = await sharp(bgBuffer)
    .composite(layers)
    .jpeg({ quality: 92 })
    .toBuffer();

  return result.toString('base64');
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = req.headers['x-google-ai-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Se requiere tu Google AI Studio API Key.' });
  }

  const {
    productName,
    description,
    angles,
    angle = 'desire',
    format = 'square',
    primaryColor = '#6366f1',
    productImageBase64,
  } = req.body;

  if (!productName && !productImageBase64) {
    return res.status(400).json({ error: 'Se requiere nombre del producto o imagen.' });
  }

  const selectedAngles = Array.isArray(angles) && angles.length > 0 ? angles : [angle];

  try {
    let productContext = '';
    if (productImageBase64) {
      productContext = await analyzeProduct(productImageBase64, apiKey);
    } else {
      productContext = `Product: ${productName}. ${description || ''}`;
    }

    const results = await Promise.allSettled(
      selectedAngles.map(async (a) => {
        const label = ANGLE_LABELS[a] || a;
        const scenePromptFn = ANGLE_SCENES[a] || ANGLE_SCENES.desire;
        const scenePrompt = scenePromptFn(productContext, format);

        // Background + copy generate in parallel
        const [background, copy] = await Promise.all([
          generateBackground(scenePrompt, apiKey),
          generateCopy(productContext, a, label, apiKey),
        ]);

        // Inject product name into copy for templates that use it
        const enrichedCopy = { ...(copy || {}), productName: productName || '' };

        // Build SVG template with real typography
        const svgTemplate = buildSvgTemplate(a, enrichedCopy, primaryColor, format);

        // Composite everything together
        const composited = await compositeAll({
          backgroundBase64: background.data,
          svgTemplate,
          productBase64: productImageBase64 || null,
          format,
        });

        return { imageUrl: `data:image/jpeg;base64,${composited}`, angle: a, label, copy };
      })
    );

    const images = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);

    if (images.length === 0) {
      return res.status(500).json({ error: errors[0] || 'Error generando imágenes' });
    }

    return res.status(200).json({ images, ...(errors.length && { errors }) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error generando imágenes' });
  }
}
