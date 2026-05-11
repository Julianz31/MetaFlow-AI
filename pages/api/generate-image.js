import sharp from 'sharp';

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
};

const GEMINI_VISION_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const GEMINI_IMAGE_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;

const NO_PRODUCT_RULE = `CRITICAL RULE: Do NOT generate, draw, or include any product, bottle, dropper, container, package, box, or physical item in the scene. The actual product image will be composited on top separately. Only generate people, environments, text overlays, graphic design elements, and layout.`;

function formatHint(format) {
  if (format === 'vertical') return 'Format: vertical 9:16 portrait composition optimized for Stories/Reels.';
  if (format === 'horizontal') return 'Format: horizontal 16:9 landscape composition optimized for banners.';
  return 'Format: square 1:1 composition optimized for Feed.';
}

const ANGLES = {
  pain: {
    label: 'Dolor',
    buildPrompt: (ctx, format, primaryColor) => `
Create a complete, professional Facebook/Instagram advertising creative. This is a FULL AD DESIGN — not just a photo. It must include readable bold Spanish text integrated into the layout.

PRODUCT: ${ctx}

SCENE: Photorealistic lifestyle background — a person looking genuinely worried, frustrated or concerned about the problem this product solves. Warm interior lighting. Realistic setting (home, outdoors, etc.).

TEXT TO RENDER IN THE IMAGE (bold, legible, in Spanish):
1. TOP or prominent area: A large compelling QUESTION headline that hits the pain point. Example format: "¿TU [AUDIENCE] SUFRE DE [PROBLEM]?" — make it specific to this product.
2. Below headline: Short empathy subtext (1 line)
3. Right side or bottom panel: 3 short bullet points with ✓ checkmarks listing key benefits of the product
4. Bottom badge/pill: Small CTA like "¡DESCÚBRELO AQUÍ!" or "VER SOLUCIÓN"

DESIGN RULES:
- Use ${primaryColor} as the primary accent color for text backgrounds, highlight bars, badges, and decorative elements
- White bold text on colored/dark backgrounds for maximum readability
- Leave a clear centered lower-middle area (roughly 35% height) for product placement overlay
- Professional advertising typography — think top-tier agency work
- ALL TEXT IN SPANISH, specific to the product's actual benefits

${NO_PRODUCT_RULE}
${formatHint(format)}
`.trim(),
  },

  desire: {
    label: 'Deseo',
    buildPrompt: (ctx, format, primaryColor) => `
Create a complete, professional Facebook/Instagram advertising creative. This is a FULL AD DESIGN with readable bold Spanish text integrated into the layout.

PRODUCT: ${ctx}

SCENE: Bright, aspirational lifestyle background — a happy, radiant, successful person who has achieved their ideal result. Golden hour or bright natural lighting. Premium, clean environment that conveys success and wellbeing.

TEXT TO RENDER IN THE IMAGE (bold, legible, in Spanish):
1. TOP: Large aspirational headline — what their life looks like AFTER using this product. Bold, exciting, Spanish. Example: "¡EL [RESULT] QUE SIEMPRE QUISISTE!"
2. Subheadline (1 line): How the product delivers this
3. Side or bottom panel: 3 outcome bullet points with ★ or ✓ in Spanish — specific results/transformations
4. Bottom: CTA badge "¡QUIERO ESTO PARA MÍ!" or similar

DESIGN RULES:
- Use ${primaryColor} for accent bars, badges, highlight elements, and bullet icons
- Bright, warm color palette — conveys aspiration and premium quality
- Bold white or dark text with high contrast
- Leave a clear centered lower-middle area (roughly 35% height) for product placement overlay
- Professional advertising typography
- ALL TEXT IN SPANISH

${NO_PRODUCT_RULE}
${formatHint(format)}
`.trim(),
  },

  transformation: {
    label: 'Transformación',
    buildPrompt: (ctx, format, primaryColor) => `
Create a complete professional split-panel advertising image for Facebook/Instagram. This is a FULL AD DESIGN with bold readable Spanish text.

PRODUCT: ${ctx}

LAYOUT — TWO PANEL DESIGN:
LEFT HALF "ANTES": Person looking sad/frustrated/struggling with the problem. Dark, muted, desaturated tones. Background: grayish or dim.
RIGHT HALF "DESPUÉS": Same type of person, happy, glowing, thriving. Bright vibrant warm tones. Premium environment.
CENTER dividing line: Clean bold vertical separator.

TEXT TO RENDER (bold, legible, Spanish):
- LEFT panel — large bold text: Strong pain statement. Example: "ANTES: [PROBLEM IN CAPS]"
- RIGHT panel — large bold text: Positive outcome. Example: "DESPUÉS: ¡[RESULT IN CAPS]!"
- Bottom center: Product name or tagline. Example: "La solución: [PRODUCT NAME]"
- Optional: Small "ANTES" and "DESPUÉS" labels

DESIGN RULES:
- Left panel accent: gray/dark tones
- Right panel accent: ${primaryColor} as the dominant highlight color
- Bold white text on both sides with high contrast backgrounds
- Leave a clear centered bottom area for product placement overlay
- Professional agency-quality layout
- ALL TEXT IN SPANISH

${NO_PRODUCT_RULE}
${formatHint(format)}
`.trim(),
  },

  objection: {
    label: 'Objeción',
    buildPrompt: (ctx, format, primaryColor) => `
Create a complete professional Facebook/Instagram advertising creative. FULL AD DESIGN with bold readable Spanish text and social proof elements.

PRODUCT: ${ctx}

SCENE: Photorealistic lifestyle background — a thoughtful person examining or reading, expression transitioning from skeptical to convinced. Bright, trustworthy home environment.

TEXT AND SOCIAL PROOF ELEMENTS TO RENDER (bold, legible, Spanish):
1. TOP headline: Trust-building statement. Example: "MILES YA LO COMPROBARON:" or "¿DUDAS? LEE ESTO:"
2. 2-3 TESTIMONIAL SPEECH BUBBLES with rounded borders: Each bubble contains a short specific testimonial in Spanish like "¡En 2 semanas noté la diferencia! Ya no volvería a otro." — Include a small circular profile avatar placeholder in each bubble
3. Below scene: Short credibility line. Example: "+5,000 clientes satisfechos ★★★★★"
4. Bottom CTA badge: "¡PRUÉBALO SIN RIESGO!"

DESIGN RULES:
- Speech bubble borders color: ${primaryColor}
- Star ratings in ${primaryColor}
- White/light backgrounds for bubbles with dark text
- Bold, readable testimonial text
- Leave a clear centered lower area for product placement overlay
- ALL TEXT IN SPANISH, realistic testimonials specific to the product's benefits

${NO_PRODUCT_RULE}
${formatHint(format)}
`.trim(),
  },

  urgency: {
    label: 'Urgencia',
    buildPrompt: (ctx, format, primaryColor) => `
Create a high-energy, bold Facebook/Instagram advertising creative. FULL AD DESIGN with large impactful Spanish text. High urgency, action-driving layout.

PRODUCT: ${ctx}

SCENE: Dynamic energetic background or bold graphic lifestyle scene. Excited or action-oriented composition. High contrast, vibrant colors.

TEXT TO RENDER (VERY LARGE, BOLD, Spanish):
1. TOP — GIANT headline: Urgency/scarcity statement in caps. Example: "¡OFERTA POR TIEMPO LIMITADO!" or "¡ÚLTIMAS UNIDADES DISPONIBLES!" or "¡NO TE LO PIERDAS!"
2. Subheadline: What specifically they'll get or miss
3. Middle: 2 key benefit bullets ✓ in Spanish — quick and punchy
4. Bottom: Large prominent CTA button/badge — "¡COMPRA AHORA!" or "¡APROVECHA ANTES QUE SE ACABE!" in bold on ${primaryColor} background
5. Optional: Countdown badge or starburst "SOLO HOY" or "DESCUENTO ESPECIAL"

DESIGN RULES:
- ${primaryColor} as dominant background color for text panels or CTA elements
- White bold text — very high contrast
- Bold, impactful typography — maximum size and weight
- Urgency graphic elements: starbursts, timer icons, bold borders
- Leave a clear centered middle area for product placement overlay
- ALL TEXT IN SPANISH

${NO_PRODUCT_RULE}
${formatHint(format)}
`.trim(),
  },

  authority: {
    label: 'Autoridad',
    buildPrompt: (ctx, format, primaryColor) => `
Create a premium credibility-focused Facebook/Instagram advertising creative. FULL AD DESIGN with clear professional Spanish text.

PRODUCT: ${ctx}

SCENE: Clean, premium lifestyle background — confident expert or aspirational person in a professional/clinical/premium environment. Crisp lighting, clean aesthetic.

TEXT TO RENDER (bold, legible, Spanish):
1. TOP headline: Authority/credibility statement in Spanish. Example: "FÓRMULA RESPALDADA POR EXPERTOS" or "CALIDAD COMPROBADA CIENTÍFICAMENTE"
2. Subheadline: Premium/expert positioning line
3. FEATURE LIST with icon blocks (3-4 items): Each item has a small icon (✓ ★ or relevant emoji) + short Spanish benefit text in bold. Layout: clean rows or 2-column grid
4. Bottom: Social proof line. Example: "+10,000 clientes satisfechos" or "Garantía de calidad premium"
5. Optional: Trust badge or certification seal "PREMIUM QUALITY" or "GARANTIZADO"

DESIGN RULES:
- ${primaryColor} for accent bars, feature icon backgrounds, and highlight elements
- Clean neutral tones (white, light gray) as base — premium feel
- Professional bold typography
- Clean grid layout — editorial/magazine quality
- Leave a clear centered lower area for product placement overlay
- ALL TEXT IN SPANISH

${NO_PRODUCT_RULE}
${formatHint(format)}
`.trim(),
  },
};

async function analyzeProduct(imageBase64, apiKey) {
  const res = await fetch(GEMINI_VISION_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `Analyze this product image for advertising. Return a concise marketing brief (max 80 words) covering:
- Product name and type
- The main problem it solves (from the customer's emotional perspective)
- Top 3 specific benefits
- Target audience (who buys this)
- One key selling proposition
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

async function generateScene(prompt, apiKey) {
  const res = await fetch(GEMINI_IMAGE_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Error generando imagen');
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imgPart) throw new Error('Gemini no devolvió imagen. Verifica tu API key de Google AI Studio.');
  return { data: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType };
}

async function compositeProductOnScene(sceneBase64, productBase64) {
  const sceneBuffer = Buffer.from(sceneBase64, 'base64');
  const productBuffer = Buffer.from(productBase64, 'base64');

  const { width: sw, height: sh } = await sharp(sceneBuffer).metadata();

  const targetH = Math.round(sh * 0.40);
  const resizedProduct = await sharp(productBuffer)
    .resize({ height: targetH, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: pw } = await sharp(resizedProduct).metadata();
  const left = Math.round((sw - pw) / 2);
  const top = Math.round(sh - targetH - sh * 0.04);

  const result = await sharp(sceneBuffer)
    .composite([{ input: resizedProduct, left, top, blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return result.toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = req.headers['x-google-ai-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Se requiere tu Google AI Studio API Key. Ingrésala en el generador.' });
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
        const angleConfig = ANGLES[a] || ANGLES.desire;
        const scenePrompt = angleConfig.buildPrompt(productContext, format, primaryColor);
        const scene = await generateScene(scenePrompt, apiKey);

        let imageUrl;
        if (productImageBase64) {
          const composited = await compositeProductOnScene(scene.data, productImageBase64);
          imageUrl = `data:image/jpeg;base64,${composited}`;
        } else {
          imageUrl = `data:${scene.mimeType};base64,${scene.data}`;
        }

        return { imageUrl, angle: a, label: angleConfig.label };
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
