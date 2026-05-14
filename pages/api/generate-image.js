import sharp from 'sharp';
const { buildTemplate, DIMS } = require('../../lib/adTemplates');

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
const QUALITY_RULE = `QUALITY: Cinematic, professional photography. 8K ultra-sharp detail. Dramatic, well-composed lighting. Rich colors with intentional highlights. Magazine-quality shot.`;

function formatHint(format) {
  if (format === 'vertical') return 'Vertical 9:16 portrait framing, optimized for Stories/Reels.';
  if (format === 'horizontal') return 'Horizontal 16:9 landscape framing, optimized for banners.';
  return 'Square 1:1 framing, optimized for Feed.';
}

// ─── BACKGROUND SCENE PROMPTS (angle-specific mood, NO text, NO product) ────

const ANGLE_SCENES = {
  pain: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A real person who is the target customer looking genuinely frustrated, stressed, or worried about the exact problem this product solves. The environment, setting, and lifestyle elements must match the product category (beauty → bathroom/vanity, fitness → gym/home, pet → living room with pet, food → kitchen, etc.). Dark, dramatic, moody emotional tone with cinematic contrast. Authentic, relatable expression.
COMPOSITION: The person (and any relevant lifestyle elements) must be positioned on the LEFT 55% of the frame. The RIGHT side must be naturally darker, relatively empty, and free of busy objects — a product image will be composited there.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  desire: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A radiant, happy target customer who has achieved their ideal result from using this product. The setting must match the product category (beauty → bright bathroom or vanity, fitness → gym or outdoor, pet → living room with happy pet, food → modern kitchen, etc.). Golden hour or warm cinematic light. Aspirational feel. Genuine smile. Vibrant, rich colors.
COMPOSITION: Person and any lifestyle elements must be on the RIGHT 55% of the frame. The LEFT side should be lighter, airy, and uncluttered — no furniture or busy objects on the left. This open space is reserved for product placement.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  transformation: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A target customer in a bright, energizing environment conveying positive change and growth. The setting must match the product category. Vibrant lighting, premium space. Person looks confident and thriving.
COMPOSITION: Balanced framing. The bottom-center 35% of the image should be darker and less cluttered — subject positioned upper-center.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  objection: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A thoughtful, intelligent-looking target customer in a clean, trustworthy environment matching the product category. Expression moving from skeptical to reassured. Warm, credible atmosphere.
COMPOSITION: Person on the LEFT side of the frame. RIGHT side relatively open with a clean wall or soft bokeh background — reserved for product overlay.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  urgency: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: High-energy, dynamic scene. Excited, action-oriented target customer in a vibrant environment matching the product category. Fast-paced feel, vivid contrasts.
COMPOSITION: Subject centered or slightly left. Lower-center area (bottom 35%) darker and less busy for product and text overlay.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  authority: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Clean, premium, bright environment. A confident expert or professional relevant to the product category (beauty → esthetician/dermatologist, fitness → trainer, pet → veterinarian, food → nutritionist, etc.). Crisp natural lighting, minimal modern aesthetic. Conveys expertise, trust, and quality.
COMPOSITION: Person positioned CENTER-LEFT of the frame. RIGHT side of the image should have an open clean wall or minimal soft background — no busy objects on the right, reserved for product placement.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  comparison: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Strong visual split — LEFT half dark, gloomy, desaturated (the BEFORE state without the product). RIGHT half bright, warm, vibrant (the AFTER state with the product). Each side has the target customer — left person looks sad/struggling, right person looks happy/thriving. Environment matches product category.
COMPOSITION: Keep the CENTER strip (middle 15% of width) relatively clear and dark — a VS badge and product image will be placed there. No people or busy objects in the center strip.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  guarantee: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Calm, peaceful, reassuring environment matching the product category. Completely relaxed and satisfied target customer. Zero-stress expression, content smile. Soft warm lighting.
COMPOSITION: Person and any lifestyle elements on the LEFT side of the frame. RIGHT side should be lighter, open, and uncluttered — clean wall or soft bokeh, reserved for product placement.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  social_proof: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Warm, community-feel environment matching the product category. Happy, glowing, relatable target customer. Natural warm lighting, welcoming and friendly space.
COMPOSITION: Subject in the upper-center area. Lower 40% of the image should be darker and less busy — reserved for testimonial cards and product overlay.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  curiosity: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Intriguing, slightly dramatic, atmospheric. Target customer with a genuinely surprised or mind-blown expression. Cinematic lighting — dark edges, bright center. Environment matches product category. Something unexpected being revealed.
COMPOSITION: Person on the LEFT side of the frame. RIGHT side darker and atmospheric with minimal clutter — open space reserved for product placement.
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  price: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Energetic, celebratory. Happy target customer reacting with excitement. Vibrant bright colors, festive atmosphere. Environment matches product category.
COMPOSITION: Balanced composition. Lower-center area (bottom 35%) should be darker and less busy — reserved for product and pricing text overlay.
${NO_TEXT_RULE}
${QUALITY_RULE}
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

const ANGLE_EXTRA_FIELDS = {
  pain:           `"b1": "Pain/problem bullet 1, max 32 chars, specific to product",\n  "b2": "Pain/problem bullet 2, max 32 chars",\n  "b3": "Pain/problem bullet 3, max 32 chars",\n  "f1": "Key product benefit label, 2-3 words max, short",\n  "f2": "Key product benefit label, 2-3 words max, short",\n  "f3": "Key product benefit label, 2-3 words max, short",\n  "f4": "Key product benefit label, 2-3 words max, short"`,
  desire:         `"b1": "Key benefit 1, max 32 chars, specific to product",\n  "b2": "Key benefit 2, max 32 chars",\n  "b3": "Key benefit 3, max 32 chars"`,
  transformation: `"b1": "Before state in 1 line, max 32 chars",\n  "a1": "After state in 1 line, max 32 chars"`,
  objection:      `"p1": "Problem/doubt 1, max 28 chars",\n  "p2": "Problem/doubt 2, max 28 chars",\n  "p3": "Problem/doubt 3, max 28 chars",\n  "s1": "Solution 1, max 28 chars",\n  "s2": "Solution 2, max 28 chars",\n  "s3": "Solution 3, max 28 chars"`,
  urgency:        `"f1": "Feature label, 2 words max",\n  "f2": "Feature label, 2 words max",\n  "f3": "Feature label, 2 words max",\n  "f4": "Feature label, 2 words max"`,
  authority:      `"f1": "Credential or quality feature, max 36 chars",\n  "f2": "Credential or quality feature, max 36 chars",\n  "f3": "Credential or quality feature, max 36 chars",\n  "f4": "Credential or quality feature, max 36 chars"`,
  comparison:     `"b1": "Before/without product state 1, max 26 chars",\n  "b2": "Before/without product state 2, max 26 chars",\n  "a1": "After/with product result 1, max 26 chars",\n  "a2": "After/with product result 2, max 26 chars"`,
  guarantee:      `"b1": "Guarantee point 1, max 32 chars",\n  "b2": "Guarantee point 2, max 32 chars",\n  "b3": "Guarantee point 3, max 32 chars"`,
  social_proof:   `"r1": "Short customer testimonial 1, max 52 chars",\n  "r2": "Short customer testimonial 2, max 52 chars"`,
  curiosity:      `"h1": "Mystery/curiosity hint 1, max 38 chars",\n  "h2": "Mystery/curiosity hint 2, max 38 chars",\n  "h3": "Mystery/curiosity hint 3, max 38 chars"`,
  price:          `"b1": "Scarcity or urgency line, max 44 chars"`,
};

async function generateCopy(productContext, angleKey, angleLabel, apiKey) {
  const instruction = COPY_ANGLE_INSTRUCTIONS[angleKey] || COPY_ANGLE_INSTRUCTIONS.desire;
  const extraFields = ANGLE_EXTRA_FIELDS[angleKey] ? `,\n  ${ANGLE_EXTRA_FIELDS[angleKey]}` : '';
  const prompt = `Generate Facebook/Instagram ad copy in Spanish for a "${angleLabel}" angle ad.

Product: ${productContext}

Angle goal: ${instruction}

Return ONLY a valid JSON object — no markdown, no explanation, no code block:
{
  "headline": "Max 40 chars. Punchy headline that fits the ${angleLabel} angle.",
  "primaryText": "2-3 sentences. Emotional and persuasive body copy. Specific to this product.",
  "description": "Max 30 chars. Short benefit or offer description.",
  "cta": "One of: Comprar ahora | Ver más | Obtener oferta | Saber más | Aprovechar oferta | Lo quiero"${extraFields}
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

// ─── FULL DESIGN ANGLES (Gemini generates COMPLETE ad — no canvas template) ───

// For these angles, Gemini renders the entire design (background + text + graphics).
// Only the product photo is composited on top afterward.
const FULL_DESIGN_ANGLES = new Set(['pain']);

function buildFullDesignPrompt(angle, productContext, copy, primaryColor, format) {
  if (angle === 'pain') {
    const rawHeadline = (copy?.headline || 'SUPERA TUS LÍMITES').toUpperCase();
    const words = rawHeadline.split(' ');
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ') || line1;
    const subText = copy?.description || (copy?.primaryText || '').split('.')[0] || 'El secreto para una vida más activa y sana';
    const hex = primaryColor || '#d946ef';

    return `Design a COMPLETE, professional Facebook ad image at 1080x1080 pixels. Include ALL design elements: photorealistic background, typography, decorative graphics. This is the final production-ready ad image.

PRODUCT CONTEXT: ${productContext}

BACKGROUND SCENE:
Warm cinematic interior — a modern, bright veterinary clinic or upscale pet care space. RIGHT 55% of the frame: a confident, smiling veterinarian in a white coat with a large healthy Labrador or Golden Retriever, warm amber-golden bokeh lighting, sharp 8K detail. LEFT LOWER quadrant (roughly x:0-40%, y:55-100%): a clean wooden table or sleek pedestal surface — keep this area CLEAN and relatively desaturated, a product will be placed here later.

TYPOGRAPHY (place exactly):
1. TOP AREA — Headline spanning the full width, two stacked lines, centered:
   • Line 1: "${line1}" — ultra-bold Anton/Impact font, pure WHITE (#ffffff), font size fills ~80% canvas width, strong dark drop shadow for readability
   • Line 2: "${line2}" — same massive font, color: ${hex} (bright magenta/pink), same size, dark drop shadow
2. LOWER CENTER (above the table) — Semi-transparent dark rounded rectangle (pill card) with white body text: "${subText}" — clean modern sans-serif, ~22px equivalent

DECORATIVE ELEMENTS:
• Upper-right corner: 3-4 small floating pet icons (paw print, bone, fish silhouette) in white at ~55% opacity, scattered naturally
• Subtle dark gradient vignette at the very top edge and very bottom edge

STYLE: Premium commercial Facebook ad. Cinematic warm lighting. Conversion-optimized visual hierarchy (eye travels: headline → product zone lower-left → vet+dog right). DO NOT include prices, URLs, CTA buttons, or any product/supplement objects.

${formatHint(format)}`.trim();
  }
  return null;
}

// ─── ICON PANEL GENERATION (AI hyperrealistic icons for feature strip) ────────

// Angles that use the bottom feature strip with AI icons (pain excluded — uses full design)
const ICON_STRIP_ANGLES = new Set(['urgency', 'authority']);

async function generateIconPanel(features, apiKey) {
  const list = features.map((f, i) => `${i + 1}. ${f}`).join(' | ');
  const prompt = `Create a horizontal row of exactly 4 individual icon illustrations on a pure white (#ffffff) background. Each icon is a clean, modern, hyperrealistic flat illustration with a magenta-pink color (#d946ef). The 4 icons must represent these product benefits in order from left to right: ${list}. Style: modern icon set, slight 3D depth, clean drop shadow, vibrant magenta/pink tones, no gradients in icons. White background only. Each icon occupies exactly 1/4 of the image width. No text, no labels, no borders between icons. Professional quality, sharp and detailed.`;

  try {
    const res = await fetch(GEMINI_IMAGE_URL(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    });
    const data = await res.json();
    const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    return imgPart ? imgPart.inlineData.data : null;
  } catch {
    return null;
  }
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

// ─── PRODUCT PLACEMENT (angle-aware, avoids text zones) ─────────────────────

// Templates that reserve the left half for text and keep the right clear for product
const RIGHT_SIDE_ANGLES = new Set(['pain', 'authority', 'guarantee', 'curiosity', 'objection']);

function getProductPlacement(angle, w, h, pw) {
  // desire: background has scene on RIGHT — product composited on LEFT
  if (angle === 'desire') {
    const leftCenter = Math.round(w * 0.22);
    const left = Math.max(20, leftCenter - Math.round(pw / 2));
    return { left, top: Math.round(h * 0.36) };
  }
  if (RIGHT_SIDE_ANGLES.has(angle)) {
    const rightHalfCenter = Math.round(w * 0.73);
    const left = Math.max(
      Math.round(w * 0.52),
      Math.min(rightHalfCenter - Math.round(pw / 2), w - pw - 20)
    );
    // objection has 3 bullets above (ends ~y=450) — push product lower
    const top = angle === 'objection' ? Math.round(h * 0.53) : Math.round(h * 0.43);
    return { left, top };
  }
  if (angle === 'comparison') {
    // Centered between the side cards, upper area
    return { left: Math.max(0, Math.round((w - pw) / 2)), top: Math.round(h * 0.32) };
  }
  return { left: Math.max(0, Math.round((w - pw) / 2)), top: Math.round(h * 0.41) };
}

// ─── COMPOSITE: background + template + product ───────────────────────────────

async function compositeAll({ backgroundBase64, templatePng, productBase64, iconPanelBase64, format, angle, fullDesign }) {
  const { w, h } = DIMS[format] || DIMS.square;

  // 1. Resize background/full-design image to exact ad dimensions
  const bgBuffer = await sharp(Buffer.from(backgroundBase64, 'base64'))
    .resize(w, h, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 95 })
    .toBuffer();

  const layers = [];

  // 2. Canvas template layer — skipped for full-design angles (Gemini drew everything)
  if (templatePng) {
    layers.push({ input: templatePng, blend: 'over' });
  }

  // 3. Composite product photo with angle-aware placement
  if (productBase64) {
    const targetH = Math.round(h * 0.48);
    const targetW = Math.round(w * 0.32);
    const resizedProduct = await sharp(Buffer.from(productBase64, 'base64'))
      .resize({ height: targetH, width: targetW, fit: 'inside', withoutEnlargement: false })
      .png()
      .toBuffer();

    const { width: pw } = await sharp(resizedProduct).metadata();

    let placement;
    if (fullDesign && angle === 'pain') {
      // Full design Pain: product lower-left, matching the table zone in Gemini's scene
      const cx = Math.round(w * 0.22);
      placement = { left: Math.max(20, cx - Math.round(pw / 2)), top: Math.round(h * 0.54) };
    } else {
      placement = getProductPlacement(angle || 'desire', w, h, pw);
    }

    layers.push({ input: resizedProduct, ...placement, blend: 'over' });
  }

  // 4. AI icon panel (canvas-template angles only)
  if (iconPanelBase64) {
    try {
      const stripH = Math.round(h * 0.205);
      const iconAreaH = Math.round(stripH * 0.68);
      const iconTop = h - stripH + Math.round((stripH - iconAreaH) / 2) - 8;
      const resizedIcons = await sharp(Buffer.from(iconPanelBase64, 'base64'))
        .resize(w, iconAreaH, { fit: 'fill' })
        .png()
        .toBuffer();
      layers.push({ input: resizedIcons, left: 0, top: iconTop, blend: 'over' });
    } catch {
      // icon panel composite failed — canvas fallback icons remain visible
    }
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

        // ── FULL DESIGN PATH (Gemini generates complete ad image) ─────────────
        if (FULL_DESIGN_ANGLES.has(a)) {
          // Must be sequential: copy first → build design prompt → generate image
          const copy = await generateCopy(productContext, a, label, apiKey);
          const enrichedCopy = { ...(copy || {}), productName: productName || '' };
          const designPrompt = buildFullDesignPrompt(a, productContext, enrichedCopy, primaryColor, format);
          const fullImage = await generateBackground(designPrompt, apiKey);

          const composited = await compositeAll({
            backgroundBase64: fullImage.data,
            templatePng: null,       // no canvas template — Gemini drew everything
            productBase64: productImageBase64 || null,
            iconPanelBase64: null,
            format,
            angle: a,
            fullDesign: true,
          });

          return { imageUrl: `data:image/jpeg;base64,${composited}`, angle: a, label, copy };
        }

        // ── STANDARD PATH (Gemini background + canvas template) ──────────────
        const scenePromptFn = ANGLE_SCENES[a] || ANGLE_SCENES.desire;
        const scenePrompt = scenePromptFn(productContext, format);

        // Background + copy generate in parallel
        const [background, copy] = await Promise.all([
          generateBackground(scenePrompt, apiKey),
          generateCopy(productContext, a, label, apiKey),
        ]);

        const enrichedCopy = { ...(copy || {}), productName: productName || '' };

        // Generate AI icon panel in parallel with template building (feature-strip angles)
        const iconFeatures = ICON_STRIP_ANGLES.has(a) ? [
          enrichedCopy.f1 || enrichedCopy.b1 || 'Beneficio principal',
          enrichedCopy.f2 || enrichedCopy.b2 || 'Calidad premium',
          enrichedCopy.f3 || enrichedCopy.b3 || 'Uso seguro diario',
          enrichedCopy.f4 || enrichedCopy.cta || 'Resultados garantizados',
        ] : null;

        const hasProduct = !!productImageBase64;
        const variation = Math.floor(Math.random() * 2);

        const [templatePng, iconPanelBase64] = await Promise.all([
          Promise.resolve(buildTemplate(a, enrichedCopy, primaryColor, format, hasProduct, variation)),
          iconFeatures ? generateIconPanel(iconFeatures, apiKey) : Promise.resolve(null),
        ]);

        const composited = await compositeAll({
          backgroundBase64: background.data,
          templatePng,
          productBase64: productImageBase64 || null,
          iconPanelBase64,
          format,
          angle: a,
          fullDesign: false,
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
