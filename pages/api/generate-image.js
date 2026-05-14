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
  pain:           'Golpea el dolor exacto que siente el cliente. Nómbralo sin rodeos. Hazlos sentir vistos y comprendidos — luego posiciona el producto como el alivio que llevaban buscando. Usa frases como "¿Ya estás harto de...?", "Deja de sufrir con...", "El problema no eres tú...".',
  desire:         'Pinta la vida ideal que el cliente quiere vivir. Hazlo tan vívido que puedan sentirlo. El producto es el puente. Usa lenguaje aspiracional intenso: "Imagina despertar con...", "Por fin puedes...", "Tu versión ideal de...".',
  transformation: 'Contrasta con brutalidad el ANTES (sufrimiento real) vs el DESPUÉS (resultado concreto). El producto es el catalizador. Usa números si es posible: "En 30 días", "Más de 10.000 personas ya lo lograron". Hazlo cinematográfico.',
  objection:      'Anticipa la objeción exacta que frena la compra ("¿Esto realmente funciona?", "¿Vale la pena el precio?"). Desmóntala con prueba social, garantía, o lógica irrefutable. Convierte el escepticismo en confianza.',
  urgency:        'Crea FOMO real — tiempo limitado, stock limitado, precio que sube. El cliente DEBE actuar AHORA o perderlo. Usa lenguaje de escasez genuina: "Solo quedan X unidades", "Oferta termina hoy", "No esperes más y arrepentirte".',
  authority:      'Establece credibilidad aplastante — cifras reales, avales científicos, años de experiencia, premios, certificaciones. El cliente debe sentir que está comprando al mejor en el mercado. Habla con seguridad, no con humildad.',
  comparison:     'Haz el contraste ELLOS vs NOSOTROS tan obvio que la elección sea automática. Usa diferenciadores específicos, no genéricos. "Mientras otros... nosotros...". El cliente debe sentirse tonto si elige la competencia.',
  guarantee:      'Elimina el 100% del riesgo percibido. La garantía debe sonar tan buena que comprar sea la decisión obvia. Usa números concretos: "30 días o te devolvemos cada centavo". Haz que no comprar sea el verdadero riesgo.',
  social_proof:   'Usa el poder del rebaño — miles de personas ya tomaron la decisión. Testimonios específicos con resultados concretos ("Perdí 8kg en 6 semanas"). Números grandes. Hazlos sentir que son los últimos en enterarse.',
  curiosity:      'Crea un gancho irresistible con una pregunta o secreto que no puedan ignorar. "El ingrediente que tu veterinario no te menciona...", "La razón por la que el 90% falla con...". La curiosidad debe doler si no la satisfacen.',
  price:          'Haz que el precio parezca ridículamente bajo comparado con el valor. Usa el valor stack: muestra todo lo que obtienen. Escasez + urgencia + valor = decisión inmediata. "Por menos de lo que gastas en un café...".',
};

const COPY_POWER_WORDS = {
  pain:           'Harto, sufres, cansado, frustrante, duele, deja de, por fin, solución',
  desire:         'Imagina, por fin, transforma, mereces, sueña, logra, vibra, brilla',
  transformation: 'Antes vs ahora, cambió todo, resultado real, en solo X días, comprobado',
  objection:      'La verdad es, funciona porque, miles lo confirman, sin riesgo, garantizado',
  urgency:        'Últimas horas, solo hoy, se acaba, no esperes, ahora o nunca, quedan pocas',
  authority:      'Clínicamente probado, expertos recomiendan, años de experiencia, certificado',
  comparison:     'A diferencia de, mientras otros, nosotros sí, la diferencia real, sin comparación',
  guarantee:      'Sin riesgo, te devolvemos, 100% garantizado, cero pérdida, seguro',
  social_proof:   '+10.000 clientes, 5 estrellas, testimonios reales, ya lo lograron',
  curiosity:      '¿Sabías que...?, el secreto que, lo que nadie te dice, descubre por qué',
  price:          'Mejor precio, oferta única, valor increíble, invierte menos de, hoy gratis',
};

const ANGLE_EXTRA_FIELDS = {
  pain:           `"b1": "Dolor específico 1 — máx 32 chars, muy concreto al producto",\n  "b2": "Dolor específico 2 — máx 32 chars",\n  "b3": "Consecuencia del dolor — máx 32 chars",\n  "f1": "Beneficio clave 1 — 2-3 palabras",\n  "f2": "Beneficio clave 2 — 2-3 palabras",\n  "f3": "Beneficio clave 3 — 2-3 palabras",\n  "f4": "Beneficio clave 4 — 2-3 palabras"`,
  desire:         `"b1": "Resultado aspiracional 1 — máx 32 chars, específico y emocionante",\n  "b2": "Resultado aspiracional 2 — máx 32 chars",\n  "b3": "Resultado aspiracional 3 — máx 32 chars"`,
  transformation: `"b1": "Estado ANTES — sufrimiento real en 1 línea, máx 32 chars",\n  "a1": "Estado DESPUÉS — resultado concreto en 1 línea, máx 32 chars"`,
  objection:      `"p1": "Duda/objeción 1 — máx 28 chars, real y específica",\n  "p2": "Duda/objeción 2 — máx 28 chars",\n  "p3": "Duda/objeción 3 — máx 28 chars",\n  "s1": "Respuesta contundente 1 — máx 28 chars",\n  "s2": "Respuesta contundente 2 — máx 28 chars",\n  "s3": "Respuesta contundente 3 — máx 28 chars"`,
  urgency:        `"f1": "Urgencia/escasez 1 — 2 palabras max",\n  "f2": "Urgencia/escasez 2 — 2 palabras max",\n  "f3": "Beneficio inmediato — 2 palabras max",\n  "f4": "CTA implícito — 2 palabras max"`,
  authority:      `"f1": "Credencial o aval concreto — máx 36 chars",\n  "f2": "Número o estadística impactante — máx 36 chars",\n  "f3": "Certificación o premio — máx 36 chars",\n  "f4": "Diferenciador técnico — máx 36 chars"`,
  comparison:     `"b1": "Consecuencia de NO tener el producto — máx 26 chars",\n  "b2": "Otro problema sin el producto — máx 26 chars",\n  "a1": "Resultado con el producto — máx 26 chars, concreto",\n  "a2": "Beneficio adicional con el producto — máx 26 chars"`,
  guarantee:      `"b1": "Garantía específica con número — máx 32 chars",\n  "b2": "Qué pasa si no funciona — máx 32 chars",\n  "b3": "Ventaja adicional sin riesgo — máx 32 chars"`,
  social_proof:   `"r1": "Testimonio REAL con resultado concreto — máx 52 chars, ej: 'Mejoró en 2 semanas'",\n  "r2": "Testimonio REAL diferente — máx 52 chars, resultado específico"`,
  curiosity:      `"h1": "Pista misteriosa 1 que genera intriga — máx 38 chars",\n  "h2": "Dato sorprendente o pregunta — máx 38 chars",\n  "h3": "Revelación parcial del secreto — máx 38 chars"`,
  price:          `"b1": "Escasez o urgencia con número — máx 44 chars, ej: 'Solo 47 unidades disponibles'"`,
};

async function generateCopy(productContext, angleKey, angleLabel, apiKey) {
  const instruction = COPY_ANGLE_INSTRUCTIONS[angleKey] || COPY_ANGLE_INSTRUCTIONS.desire;
  const powerWords = COPY_POWER_WORDS[angleKey] || '';
  const extraFields = ANGLE_EXTRA_FIELDS[angleKey] ? `,\n  ${ANGLE_EXTRA_FIELDS[angleKey]}` : '';
  const prompt = `Eres el mejor copywriter de respuesta directa de Latinoamérica. Genera copy de alto impacto para un anuncio pagado de Facebook/Instagram en español.

Producto: ${productContext}

Ángulo publicitario: ${angleLabel}
Objetivo: ${instruction}
Palabras de poder para este ángulo: ${powerWords}

REGLAS DE COPY:
• El headline debe PARAR el scroll en 0.3 segundos — debe provocar emoción inmediata (dolor reconocido, curiosidad urgente, deseo intenso)
• Usa segunda persona (tú/tu), voz activa, verbos de acción
• Sé ESPECÍFICO: números reales, problemas concretos, resultados tangibles — nada genérico
• El primaryText: gancho emocional + prueba/razón para creer + cierre con urgencia o beneficio
• Prohibido: frases genéricas como "el mejor producto", "alta calidad", "excelente para ti"

Retorna ÚNICAMENTE un objeto JSON válido — sin markdown, sin explicaciones:
{
  "headline": "Máx 45 chars. IMPACTO inmediato. Provoca emoción en 2 segundos.",
  "primaryText": "3 oraciones cortas. Gancho emocional + prueba concreta + cierre urgente. Directo al corazón.",
  "description": "Máx 32 chars. Beneficio concreto o cifra impactante.",
  "cta": "Uno de: Comprar ahora | Ver más | Obtener oferta | Saber más | Aprovechar oferta | Lo quiero | Quiero esto"${extraFields}
}`;

  const res = await fetch(GEMINI_VISION_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.92 },
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

// ─── FULL DESIGN (Gemini generates COMPLETE ad for every angle) ───────────────

// All angles: Gemini renders the entire design (background + text + graphics).
// Only the product photo is composited on top afterward.
const FULL_DESIGN_ANGLES = new Set([
  'pain','desire','transformation','objection','urgency',
  'authority','comparison','guarantee','social_proof','curiosity','price',
]);

function _splitHeadline(headline) {
  const w = (headline || '').toUpperCase().split(' ');
  const m = Math.ceil(w.length / 2);
  return [w.slice(0, m).join(' '), w.slice(m).join(' ') || w.slice(0, m).join(' ')];
}

const NO_LABEL_RULE = `CRITICAL RENDERING RULES:
• NEVER write instruction labels in the image such as "Text 1:", "Text 2:", "Line 1:", "Typography:", or any other descriptor. Render ONLY the actual text content.
• NEVER include placeholder text like "[headline]" or "[subtext]" — only the real text provided.
• Every text element must be rendered sharp, anti-aliased, and fully legible.
• NO drop shadows on any text. All text is rendered clean and flat — no shadow, no glow, no blur behind letters.
• SPELL ALL SPANISH WORDS CORRECTLY — proofread every word. Never write: "NOSOUTROS" (correct: NOSOTROS), "SECERTO" (correct: SECRETO), "AVANAZDA" (correct: AVANZADA), "APROVEEVA" (correct: APROVECHA), "BIENESEAR" (correct: BIENESTAR), "REALMENT" (correct: REALMENTE), "COMPANEO" (correct: COMPAÑERO), "SANO" is correct, "AGOTE" is correct. Double-check all accents and spelling before rendering any word.`;

function buildFullDesignPrompt(angle, productContext, copy, primaryColor, format, hasProduct = false) {
  const prompt = _buildPromptBody(angle, productContext, copy, primaryColor, format, hasProduct);
  if (!prompt) return null;
  const dims = format === 'vertical' ? '1080x1920' : format === 'horizontal' ? '1920x1080' : '1080x1080';
  const aspectLabel = format === 'vertical' ? '9:16 portrait' : format === 'horizontal' ? '16:9 landscape' : '1:1 square';

  const prefix = `⚠️ MANDATORY CANVAS RULES — APPLY BEFORE ANY OTHER INSTRUCTION:
1. Canvas size: ${dims} pixels (${aspectLabel}). Fill completely — no letterbox, no pillarbox.
2. TOP SAFE ZONE: The first 9% of canvas height from the top edge is FORBIDDEN for any content. No text, no band, no badge, no overlay may have ANY pixel above y=9%. Any layout element described as "TOP" or "UPPER" must be shifted so its topmost edge sits at y=9%, not y=0.
3. ALL text characters (including ascenders/descenders) must start at or below y=9% and end at or above y=94%. No letter may be clipped by the frame.
4. Left and right margins: no element within 5% of left or right edge.

`;

  const suffix = `\n\nFINAL CHECK: Scan every element. If any text, band, or graphic has even one pixel above y=9% of canvas height — move it down. The top 9% must be visually empty.`;

  return prefix + prompt + suffix;
}

function _buildPromptBody(angle, productContext, copy, primaryColor, format, hasProduct) {
  const [h1, h2] = _splitHeadline(copy?.headline || '');
  const sub    = copy?.description || (copy?.primaryText || '').split('.')[0] || '';
  const hex    = primaryColor || '#6366f1';
  const fmt    = formatHint(format);
  const dims   = format === 'vertical' ? '1080x1920' : format === 'horizontal' ? '1920x1080' : '1080x1080';
  const ctx    = productContext;
  const b1 = copy?.b1 || ''; const b2 = copy?.b2 || ''; const b3 = copy?.b3 || '';
  const a1 = copy?.a1 || ''; const a2 = copy?.a2 || '';
  const f1 = copy?.f1 || ''; const f2 = copy?.f2 || '';
  const f3 = copy?.f3 || ''; const f4 = copy?.f4 || '';
  const p1 = copy?.p1 || ''; const p2 = copy?.p2 || ''; const p3 = copy?.p3 || '';
  const s1 = copy?.s1 || ''; const s2 = copy?.s2 || ''; const s3 = copy?.s3 || '';
  const r1 = copy?.r1 || ''; const r2 = copy?.r2 || '';

  const productRule = hasProduct
    ? `\nPRODUCT INTEGRATION: The product image provided as the first input must be placed in the designated product zone. Integrate it naturally: match the scene lighting, correct perspective. The product label/packaging must remain clearly readable. Do NOT distort or stylize the product — keep it photorealistic.`
    : `\nPRODUCT ZONE: Leave the designated product zone as a clean, neutral surface (table, pedestal, or empty space) — a product photo will be composited there later.`;

  // Universal rule for every angle — paid ad visual impact
  const IMPACT_RULE = `
AD PERFORMANCE RULES — This is a paid Facebook/Instagram ad competing in a noisy feed:
• SCROLL-STOPPER: The image must visually arrest a scrolling thumb in under 0.5 seconds. Use one dominant, impossible-to-ignore element (massive bold headline, extreme emotional expression, high-contrast graphic, or dramatic scene).
• CONTRAST: Text-to-background contrast must be extreme — white text on dark, or dark text on white/light. Never gray on gray or low-contrast combinations. Headlines need at least 8:1 contrast ratio.
• TYPOGRAPHY SIZE: Make headlines MASSIVE — err toward too large, never too small. The headline should feel like it's shouting off the screen.
• EMOTIONAL ATMOSPHERE: The mood must be felt INSTANTLY before reading any text. The scene, lighting, and color palette must reinforce the emotional hook (pain → dark + tense, desire → warm + radiant, urgency → high-energy + bold, authority → clean + premium).
• VISUAL HIERARCHY: Eye flows top → center → bottom in exactly 3 steps. No visual noise or competing elements. Every element either supports the headline or supports the product.
• COLOR PSYCHOLOGY: Use ${hex} as the signature brand color for key accents, badges, and CTA elements. Make it pop against the background.
• NO BLAND DESIGN: Avoid flat, corporate, stock-photo aesthetics. The image must feel like it was designed by a top creative agency for a multi-million dollar ad campaign.`;

  // Shared scene adaptation rule — used by all angles
  const SCENE_ADAPT = `SCENE RULE: Derive ALL visual elements (setting, person demographics, props, environment, wardrobe) EXCLUSIVELY from the PRODUCT context above. Auto-detect the product category and use the appropriate setting: beauty/skincare → bright vanity, bathroom, mirror, glowing skin; pet products → home with owner and pet; fitness/supplements → gym or outdoor, active person; food/nutrition → kitchen or dining table; fashion/apparel → lifestyle setting; health/pharma → clinical or home wellness space. The scene must make it immediately obvious what type of product this ad is for. Match the gender, age, and demographic of the target audience from the product description.`;

  // ── PAIN ─────────────────────────────────────────────────────────────────────
  if (angle === 'pain') return `
Design a COMPLETE ${dims} professional Facebook ad. Every design element must be included — background scene, typography, overlays, decorative graphics. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE (photorealistic, 8K):
${SCENE_ADAPT}
MOOD: The target customer on the RIGHT 60% of the frame showing genuine frustration, worry, or pain about the exact problem this product solves — moody amber lighting, cinematic depth-of-field bokeh. LEFT LOWER quadrant (x 0–38%, y 58–100%): a clean surface (table, shelf, or counter appropriate to the product category) — keep this area NEUTRAL AND CLEAR.

TYPOGRAPHY (render all text sharply):
1. TOP BAND — Full-width near-black overlay (y=9%–47% of canvas, h≈38%). Inside this band:
   • Line 1: "${h1}" — ultra-bold Impact/Anton font, pure WHITE, font size fills ~82% canvas width, no shadow
   • Line 2: "${h2}" — same ultra-bold font, color ${hex}, same massive size, no shadow
2. CENTER-LEFT — Semi-transparent dark pill/card, white text inside: "${sub}"
3. LOWER-LEFT panel (x 2–42%, y 58–82%) — Three white bullet lines on a dark translucent strip:
   • "${b1}"
   • "${b2}"
   • "${b3}"

DECORATIVE: 3–4 small floating thematic icons relevant to the product category in white ~50% opacity in upper-right corner. Dark vignette top & bottom edges.

STYLE: Premium emotional Facebook ad. Cinematic 8K. Dramatic moody tone. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── DESIRE ───────────────────────────────────────────────────────────────────
  if (angle === 'desire') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE (photorealistic, 8K):
${SCENE_ADAPT}
MOOD: The target customer on the RIGHT 58% of the frame, radiant and happy after experiencing the product's results — warm golden sunlight, bokeh, vibrant colors. LEFT area: a bright clean surface appropriate to the product category (x 0–38%, y 40–85%) — keep this zone NEUTRAL AND CLEAN.

TYPOGRAPHY:
1. TOP BAND — Gradient dark-to-transparent overlay (y=9%–45% of canvas, h≈36%). Inside this band:
   • Line 1: "${h1}" — ultra-bold white Anton/Impact, fills ~82% canvas width, no shadow
   • Line 2: "${h2}" — same font, color ${hex}, no shadow
2. CENTER — Small floating white rounded badge: "✓ ${sub}"
3. LOWER-LEFT (x 2–42%, y 62–80%) — Three benefit lines in clean white semi-transparent card:
   • "✓ ${b1}"
   • "✓ ${b2}"
   • "✓ ${b3}"

DECORATIVE: Warm golden bokeh circles floating upper area. Thin ${hex} accent line below headline band. Soft warm vignette edges.

STYLE: Aspirational, warm, magazine-quality Facebook ad. Cinematic golden-hour lighting. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── TRANSFORMATION ───────────────────────────────────────────────────────────
  if (angle === 'transformation') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

${SCENE_ADAPT}

LAYOUT — SPLIT BEFORE/AFTER:
LEFT HALF (x 0–50%): Desaturated, slightly dark, moody atmosphere. Target customer in the BEFORE state — struggling with the problem this product solves. Derive the specific struggle and setting from the product context. Subtle dark blue-grey tone.
RIGHT HALF (x 50–100%): Vibrant, warm, bright, full color. Same target customer in the AFTER state — thriving after using this product, in the same setting now transformed. Warm golden light.
CENTER DIVIDER: Thin vertical accent line in ${hex}.

TYPOGRAPHY:
1. TOP SPANNING BANNER (full width, y=9%–31% of canvas, h≈22%, dark semi-transparent):
   • Left of center: "${h1}" — ultra-bold white, large
   • Right of center: "${h2}" — ultra-bold ${hex}, same size
2. LEFT PANEL LABEL (x 5%, y 34%): "ANTES" — bold white, small caps
3. RIGHT PANEL LABEL (x 55%, y 34%): "DESPUÉS" — bold ${hex}, small caps
4. LEFT lower card: "${b1}"
5. RIGHT lower card: "${a1}"
6. Bottom center — small sub-text pill: "${sub}"

DECORATIVE: Arrow pointing right in ${hex} at the center divider. Sparkle/star elements on the right side. Dark vignette.

STYLE: Dramatic transformation contrast. Premium commercial quality. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── OBJECTION ────────────────────────────────────────────────────────────────
  if (angle === 'objection') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: CENTER-RIGHT: a thoughtful, intelligent-looking target customer for this product, expression moving from skeptical to reassured. Crisp natural lighting, white and warm tones. Minimal, premium aesthetic.

TYPOGRAPHY:
1. TOP BAND (full width, white background, y=9%–29% of canvas, h≈20%):
   • "${h1} ${h2}" — bold dark (#111) sans-serif, centered, large
2. LOWER HALF split panel:
   LEFT panel (x 2–48%, dark background): "¿DUDAS?" header in ${hex}, then:
   • "✗ ${p1}"
   • "✗ ${p2}"
   • "✗ ${p3}"
   RIGHT panel (x 52–98%, ${hex} background): "LA VERDAD" header in white, then:
   • "✓ ${s1}"
   • "✓ ${s2}"
   • "✓ ${s3}"
3. Bottom center: "${sub}" — small italic white text on dark strip

DECORATIVE: Clean divider line center. Trust badge icon (shield) bottom-right. Clean, sharp text panels.

STYLE: Professional, trustworthy, reassuring. Clean advertising design. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── URGENCY ──────────────────────────────────────────────────────────────────
  if (angle === 'urgency') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: High-energy, dynamic scene. The target customer in an active, excited state — vivid colors, dramatic lighting, motion feel. Dark dramatic gradient overlay covering 65% of the image for text readability.

TYPOGRAPHY:
1. TOP AREA (y=9%–18%): Bold urgency badge: "OFERTA LIMITADA" — rounded pill, ${hex} background, white bold text
2. CENTER — Main headline:
   • "${h1}" — ultra-bold white, massive Impact/Anton font, fills ~85% width, no shadow
   • "${h2}" — ultra-bold ${hex}, same massive size
3. BELOW HEADLINE — White sub-text: "${sub}"
4. LOWER BAND (dark strip, full width): 4 feature labels in white, separated by vertical dividers:
   "${f1}"  |  "${f2}"  |  "${f3}"  |  "${f4}"

DECORATIVE: Timer/hourglass icon beside the urgency badge. Red/orange accent glow on bottom strip. Diagonal energy lines in background overlay.

STYLE: High-energy, urgent, conversion-driven. Bold, loud, dynamic. Product zone: lower-right (x 55–95%, y 55–90%). NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── AUTHORITY ────────────────────────────────────────────────────────────────
  if (angle === 'authority') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Premium, minimal, bright professional setting. LEFT-CENTER: a confident expert professional relevant to the product category (beauty product → dermatologist or esthetician; pet product → veterinarian; fitness product → personal trainer or nutritionist; food product → chef or nutritionist; health product → doctor or pharmacist) in a clean white or professional coat. Warm natural lighting, slight bokeh. Credible, premium, trustworthy.

TYPOGRAPHY:
1. TOP BAND (white or very light, y=9%–33% of canvas, h≈24%):
   • "${h1}" — bold dark heavy sans-serif, large, centered
   • "${h2}" — bold ${hex}, same size, on second line
2. RIGHT SIDE (x 52–98%, stacked credential cards):
   • Card 1: shield icon + "${f1}"
   • Card 2: medal icon + "${f2}"
   • Card 3: star icon + "${f3}"
   • Card 4: checkmark icon + "${f4}"
   Each card: white background, ${hex} left border accent, dark bold text
3. Bottom left: "${sub}" — small white text on ${hex} band

DECORATIVE: Premium ${hex} accent lines. Certification seal graphic bottom-right. Clean, sharp elements.

STYLE: Expert, premium, minimal, trust-building. Clinical precision meets premium branding. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── COMPARISON ───────────────────────────────────────────────────────────────
  if (angle === 'comparison') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

${SCENE_ADAPT}

LAYOUT — COMPARISON SPLIT:
TOP BANNER (full width, y=9%–27% of canvas, h≈18%, ${hex} background): "${h1} ${h2}" — ultra-bold white, centered, large

UPPER PHOTO STRIP (h≈40%, split):
LEFT PHOTO (x 0–50%): Moody, desaturated — the target customer in the BEFORE/WITHOUT-PRODUCT state, struggling, dark cool tones. Derive the specific scene from the product context.
RIGHT PHOTO (x 50–100%): Bright, vibrant — the same target customer in the AFTER/WITH-PRODUCT state, thriving, warm golden tones. Derive the specific scene from the product context.

LOWER COMPARISON PANEL (h≈42%, split):
LEFT (x 0–50%, dark background #1a1a2e):
   • "OTROS" header — bold white, large
   • "✗ ${b1}"
   • "✗ ${b2}"
RIGHT (x 50–100%, ${hex} background):
   • "NOSOTROS" header — bold white, large
   • "✓ ${a1}"
   • "✓ ${a2}"

CENTER COLUMN (x 44–56%): Vertical white divider with "VS" badge. Product zone: bottom-center (x 40–60%, y 55–100%) — KEEP CLEAR.

STYLE: Clean, professional, high-contrast split. Clear winner layout. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── GUARANTEE ────────────────────────────────────────────────────────────────
  if (angle === 'guarantee') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Calm, warm, peaceful. Completely relaxed and satisfied target customer in a setting appropriate for the product category — gentle warm light, soft bokeh, serene atmosphere. RIGHT 55% of frame. LEFT lower area (x 0–40%, y 50–95%): clean neutral surface — keep CLEAR.

TYPOGRAPHY:
1. TOP-CENTER (y=9%–22%): Large guarantee seal/badge (hexagonal or shield shape, ${hex} color): "GARANTÍA 30 DÍAS" in white bold text inside the badge
2. BELOW BADGE — Headline:
   • "${h1}" — ultra-bold white, large Anton/Impact font
   • "${h2}" — ultra-bold ${hex}, same size
3. CENTER — White sub-text pill: "${sub}"
4. LOWER-LEFT (dark card): three guarantee points:
   • "✓ ${b1}"
   • "✓ ${b2}"
   • "✓ ${b3}"

DECORATIVE: Soft golden glow around guarantee badge. Checkmark icons. Trust-building palette (greens, golds, ${hex} accents).

STYLE: Safe, reassuring, zero-risk feel. Warm, premium, trust-driven. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── SOCIAL PROOF ─────────────────────────────────────────────────────────────
  if (angle === 'social_proof') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Warm, community-feel. TOP HALF: happy, glowing target customer who has benefited from this product — natural warm lighting, genuine smile, relatable setting. LOWER HALF: slightly blurred or darkened to accommodate text panels.

TYPOGRAPHY:
1. TOP BANNER (${hex} background, y=9%–25% of canvas, h≈16%): "★★★★★  +10.000 clientes satisfechos" — bold white, centered
2. BELOW PHOTO (left aligned): "${h1}" — ultra-bold white, large
   "${h2}" — ${hex}, same style
3. TWO TESTIMONIAL CARDS side by side (lower half):
   LEFT card (white background, rounded corners):
   • Circular avatar placeholder
   • "${r1}"
   • "★★★★★" in ${hex}
   RIGHT card (white background, rounded corners):
   • Circular avatar placeholder
   • "${r2}"
   • "★★★★★" in ${hex}
4. Bottom strip (${hex}): "${sub}" white bold centered

DECORATIVE: Star icons scattered subtly. Social proof number badge top. Warm vignette.

STYLE: Warm, community, validated. Trust through real testimonials. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── CURIOSITY ────────────────────────────────────────────────────────────────
  if (angle === 'curiosity') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Dark, atmospheric, cinematic. The target customer leaning in to discover something surprising about the product — dramatic single-light spotlight effect, deep shadows, rich dark tones. The scene should feel like a revelation is about to happen.

TYPOGRAPHY:
1. CENTER — Giant question mark "?" as a design element (very large, ${hex}, semi-transparent, behind the main text)
2. TOP-LEFT area (y=9%–32%): Main headline:
   • "${h1}" — ultra-bold white, large Anton/Impact
   • "${h2}" — ultra-bold ${hex}, same size, line below
3. CENTER — Three mystery/hint pills (dark background, ${hex} border, white text):
   • "◆ ${copy?.h1 || sub}"
   • "◆ ${copy?.h2 || b1}"
   • "◆ ${copy?.h3 || b2}"
4. BOTTOM — "${sub}" — white italic on dark strip
Product zone: RIGHT LOWER (x 52–92%, y 55–92%) — keep CLEAR.

DECORATIVE: Dramatic vignette. Spotlight beam effect. Floating particles. Cinematic letterbox bands.

STYLE: Intriguing, mysterious, irresistible. Dark cinematic drama. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  // ── PRICE ────────────────────────────────────────────────────────────────────
  if (angle === 'price') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Energetic, celebratory. The target customer excited and celebrating — vibrant bright colors, festive confetti-like atmosphere, dynamic lighting. Upper 50%.

TYPOGRAPHY:
1. TOP-LEFT (y=9%–17%): Small ${hex} pill badge: "🏷 OFERTA ESPECIAL"
2. UPPER CENTER (y=17%–36%): Headline:
   • "${h1}" — ultra-bold white, large, no shadow
   • "${h2}" — ultra-bold ${hex}, same size
3. CENTER — Large value display box (white background, rounded, shadow):
   • Sub-text small: "${sub}"
   • Scarcity line bold: "${b1 || '¡Solo por tiempo limitado!'}"
   All text dark, clean, premium.
4. LOWER-LEFT to CENTER (product zone, x 5–55%, y 58–95%): KEEP COMPLETELY CLEAR — product composited here.
5. LOWER-RIGHT (x 58–98%, y 65–95%): Value stack in ${hex} background card:
   • "✓ Envío gratis"
   • "✓ Garantía incluida"
   • "✓ Pago seguro"

DECORATIVE: Confetti or geometric celebration shapes. Diagonal ${hex} accent stripe. Festive energy burst behind price box.

STYLE: Celebratory, value-forward, high-energy. Clear price emphasis. Premium feel despite the deal angle. NO prices with numbers, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${NO_LABEL_RULE}`.trim();

  return null;
}

// Wrap every angle return so NO_LABEL_RULE and productRule are always appended.
// (The angle branches above already include them inline for safety; this is the fallback.)


// ICON_STRIP_ANGLES is now unused — all angles use full Gemini design
const ICON_STRIP_ANGLES = new Set([]);

// ─── BACKGROUND / FULL-DESIGN GENERATION ─────────────────────────────────────

// productBase64: when provided, Gemini integrates the product into the scene directly.
async function generateBackground(scenePrompt, apiKey, productBase64 = null) {
  const parts = [];
  if (productBase64) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: productBase64 } });
  }
  parts.push({ text: scenePrompt });

  const res = await fetch(GEMINI_IMAGE_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
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

    // Full-design product zones match what each prompt tells Gemini to leave clear
    const FULL_DESIGN_ZONES = {
      pain:         (cw, ch, p) => ({ left: Math.max(20, Math.round(cw*0.22) - Math.round(p/2)), top: Math.round(ch*0.54) }),
      desire:       (cw, ch, p) => ({ left: Math.max(20, Math.round(cw*0.19) - Math.round(p/2)), top: Math.round(ch*0.38) }),
      transformation:(cw,ch, p) => ({ left: Math.max(0, Math.round((cw-p)/2)),                   top: Math.round(ch*0.55) }),
      objection:    (cw, ch, p) => ({ left: Math.max(Math.round(cw*0.52), Math.round(cw*0.73)-Math.round(p/2)), top: Math.round(ch*0.55) }),
      urgency:      (cw, ch, p) => ({ left: Math.max(Math.round(cw*0.54), Math.round(cw*0.73)-Math.round(p/2)), top: Math.round(ch*0.44) }),
      authority:    (cw, ch, p) => ({ left: Math.max(Math.round(cw*0.52), Math.round(cw*0.73)-Math.round(p/2)), top: Math.round(ch*0.43) }),
      comparison:   (cw, ch, p) => ({ left: Math.max(0, Math.round((cw-p)/2)),                   top: Math.round(ch*0.56) }),
      guarantee:    (cw, ch, p) => ({ left: Math.max(20, Math.round(cw*0.19) - Math.round(p/2)), top: Math.round(ch*0.50) }),
      social_proof: (cw, ch, p) => ({ left: Math.max(Math.round(cw*0.54), Math.round(cw*0.73)-Math.round(p/2)), top: Math.round(ch*0.45) }),
      curiosity:    (cw, ch, p) => ({ left: Math.max(Math.round(cw*0.52), Math.round(cw*0.73)-Math.round(p/2)), top: Math.round(ch*0.50) }),
      price:        (cw, ch, p) => ({ left: Math.max(20, Math.round(cw*0.22) - Math.round(p/2)), top: Math.round(ch*0.55) }),
    };

    let placement;
    if (fullDesign && FULL_DESIGN_ZONES[angle]) {
      placement = FULL_DESIGN_ZONES[angle](w, h, pw);
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
    adjustmentInstruction,
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

        // Sequential: copy first → build complete design prompt → generate full ad
        const copy = await generateCopy(productContext, a, label, apiKey);
        const enrichedCopy = { ...(copy || {}), productName: productName || '' };
        const hasProduct = !!productImageBase64;
        const designPrompt = buildFullDesignPrompt(a, productContext, enrichedCopy, primaryColor, format, hasProduct);
        const finalPrompt = adjustmentInstruction
          ? `${designPrompt}\n\nUSER ADJUSTMENT REQUEST: ${adjustmentInstruction}. Apply this specific change while keeping all other design elements the same.`
          : designPrompt;

        // Pass product image to Gemini so it integrates it naturally into the scene.
        // When Gemini handles product placement, skip the Sharp compositing step.
        const fullImage = await generateBackground(finalPrompt, apiKey, productImageBase64 || null);

        const composited = await compositeAll({
          backgroundBase64: fullImage.data,
          templatePng: null,
          productBase64: null,       // Gemini placed the product — no manual compositing
          iconPanelBase64: null,
          format,
          angle: a,
          fullDesign: true,
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
