import sharp from 'sharp';
const { buildTemplate, DIMS } = require('../../lib/adTemplates');
const { requireAuth } = require('../../lib/auth');
const { checkCredits, deductCredits, CREDIT_COSTS } = require('../../lib/credits');

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
};

const getGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY no configurada en el servidor');
  return key;
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
MOOD: A real person — the target customer — looking genuinely frustrated, stressed, or worried about the exact problem this product solves. The environment and setting must match the product category (beauty → bathroom/vanity, fitness → gym, pet → living room with pet, food → kitchen). Dark, dramatic, moody emotional tone. Authentic, relatable expression. Cinematic contrast.
COMPOSITION ZONES (strictly follow):
- PERSON: positioned LEFT 50% of the frame, upper half — expressive face clearly visible
- RIGHT 35%: naturally lighter, slightly brighter backdrop (soft bokeh, bright wall, or window light) — clean and uncluttered, this zone is reserved for a product photo overlay
- TOP 8%: very dark vignette — deep shadow at top edge for headline text contrast
- BOTTOM 21%: the bottom strip of the image must be naturally bright or light-toned (cream, light gray, near-white) — avoid placing dark elements, shadows, or people here; this zone will be covered by a white design strip
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  desire: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A radiant, happy target customer who has achieved their ideal result. The setting matches the product category (beauty → bright bathroom/vanity, fitness → gym/outdoor, pet → living room with happy pet, food → modern kitchen). Golden hour or warm cinematic light. Aspirational. Genuine smile. Vibrant rich colors.
COMPOSITION ZONES (strictly follow):
- PERSON: positioned RIGHT 55% of the frame — joyful, glowing expression
- LEFT 40%: lighter, airy, and uncluttered (no furniture or busy objects) — clean space reserved for product photo overlay
- TOP 8%: dark gradient vignette at very top edge for headline contrast
- BOTTOM 21%: naturally bright and light-toned (cream or near-white) — no dark elements here; reserved for white design strip overlay
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  transformation: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Strong visual split — LEFT half dark, gloomy, desaturated (the BEFORE state). RIGHT half bright, warm, vibrant (the AFTER state). Each side shows the target customer — left: sad/struggling, right: happy/thriving. Setting matches product category.
COMPOSITION ZONES (strictly follow):
- CENTER STRIP (middle 14% of width): keep relatively clear and dark — a VS badge and product will overlay here
- TOP 8%: dark at very top edge for text contrast
- BOTTOM 21%: both sides should be lighter/brighter at the very bottom — no dark subjects in this bottom strip; white design strip will overlay
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  objection: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: A thoughtful, intelligent-looking target customer in a clean, trustworthy environment. Expression moving from skeptical to reassured. Warm, credible, professional atmosphere. Soft lighting.
COMPOSITION ZONES (strictly follow):
- PERSON: positioned LEFT 50% of frame, upper portion
- RIGHT 38%: clean, relatively open — bright wall or soft bokeh, free of busy objects — product photo will overlay here
- TOP 8%: dark vignette for text contrast
- BOTTOM 21%: naturally lighter/brighter at very bottom — no dark objects here; white design strip will overlay
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  urgency: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: High-energy, dynamic scene. Excited, action-oriented target customer in a vibrant environment matching the product category. Vivid contrasts. Sense of motion and immediacy.
COMPOSITION ZONES (strictly follow):
- SUBJECT: centered or slightly left, upper portion of frame
- RIGHT 35%: cleaner, slightly brighter — open for product photo overlay
- TOP 8%: very dark top edge for headline contrast
- BOTTOM 21%: naturally light-toned at very bottom — avoid dark subjects here; white design strip overlays this zone
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  authority: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Clean, premium, bright environment. A confident expert or professional relevant to the product category (beauty → esthetician/dermatologist, fitness → trainer, pet → veterinarian, food → nutritionist). Crisp natural lighting, minimal modern aesthetic. Conveys expertise, trust, and quality.
COMPOSITION ZONES (strictly follow):
- PERSON: positioned CENTER-LEFT of frame — confident, professional expression
- RIGHT 36%: open clean wall or minimal soft background — no busy objects on the right; product photo overlays here
- TOP 8%: dark vignette for text contrast
- BOTTOM 21%: naturally bright/light at very bottom — no dark scene elements; white design strip overlays this zone
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  comparison: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Strong visual split — LEFT half dark, gloomy, desaturated (the BEFORE state without the product). RIGHT half bright, warm, vibrant (the AFTER state with the product). LEFT person looks sad/struggling, RIGHT person looks happy/thriving. Environment matches product category.
COMPOSITION ZONES (strictly follow):
- CENTER STRIP (middle 14% of width): keep relatively clear and dark — VS badge and product will overlay here
- TOP 8%: very dark vignette at top edge for text contrast
- BOTTOM 21%: both halves should be lighter/brighter at the very bottom — white design strip overlays this zone
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  guarantee: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Calm, peaceful, reassuring environment matching the product category. A completely relaxed, satisfied target customer. Zero-stress expression, content smile. Soft warm lighting.
COMPOSITION ZONES (strictly follow):
- PERSON: positioned LEFT 50% of frame, upper portion
- RIGHT 38%: lighter, open, and uncluttered — clean wall or soft bokeh; product photo overlays here
- TOP 8%: dark vignette for text contrast
- BOTTOM 21%: naturally bright/light-toned at very bottom — no dark elements; white design strip overlays
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  social_proof: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Warm, community-feel environment. Happy, glowing, relatable target customer. Natural warm lighting, welcoming and friendly space matching the product category.
COMPOSITION ZONES (strictly follow):
- SUBJECT: upper-center area of frame, expressive and warm
- LOWER 40%: darker and less busy — testimonial cards and product will overlay here
- TOP 8%: dark vignette for text contrast
- BOTTOM 21%: allow this zone to be darker (testimonials overlay here on dark background)
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  curiosity: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Intriguing, slightly dramatic, atmospheric. Target customer with a genuinely surprised or mind-blown expression. Cinematic lighting — dark edges, bright center. Environment matches product category. Something unexpected being revealed.
COMPOSITION ZONES (strictly follow):
- PERSON: LEFT side of frame, upper portion — expressive, wide-eyed
- RIGHT 36%: darker atmospheric with minimal clutter — open space for product photo overlay
- TOP 8%: very dark vignette for text contrast
- BOTTOM 21%: naturally lighter/brighter at very bottom — no dark elements; white design strip overlays
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),

  price: (ctx, format) => `
Photorealistic lifestyle background scene for a Facebook ad about: ${ctx}
MOOD: Energetic, celebratory. Happy target customer reacting with excitement. Vibrant bright colors, festive atmosphere. Environment matches product category.
COMPOSITION ZONES (strictly follow):
- SUBJECT: centered or slightly left, upper portion
- RIGHT 35%: cleaner zone for product overlay
- TOP 8%: dark vignette for text contrast
- BOTTOM 21%: naturally lighter/brighter at very bottom — no dark subjects here; white design strip overlays
${NO_TEXT_RULE}
${QUALITY_RULE}
${formatHint(format)}`.trim(),
}

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
  pain:           `"b1": "Dolor específico 1 — máx 32 chars, muy concreto al producto",\n  "b2": "Dolor específico 2 — máx 32 chars",\n  "b3": "Consecuencia del dolor — máx 32 chars",\n  "f1": "Beneficio concreto 1 — 3-5 palabras descriptivas del resultado, NO el nombre del producto",\n  "f2": "Beneficio concreto 2 — 3-5 palabras descriptivas del resultado, diferente a f1",\n  "f3": "Beneficio concreto 3 — 3-5 palabras descriptivas del resultado, diferente a f1 y f2",\n  "f4": "Beneficio concreto 4 — 3-5 palabras descriptivas del resultado, diferente a los anteriores"`,
  desire:         `"b1": "Resultado aspiracional 1 — máx 32 chars, específico y emocionante",\n  "b2": "Resultado aspiracional 2 — máx 32 chars",\n  "b3": "Resultado aspiracional 3 — máx 32 chars"`,
  transformation: `"b1": "Estado ANTES — sufrimiento real en 1 línea, máx 32 chars",\n  "a1": "Estado DESPUÉS — resultado concreto en 1 línea, máx 32 chars"`,
  objection:      `"p1": "Duda/objeción 1 — máx 28 chars, real y específica",\n  "p2": "Duda/objeción 2 — máx 28 chars",\n  "p3": "Duda/objeción 3 — máx 28 chars",\n  "s1": "Respuesta contundente 1 — máx 28 chars",\n  "s2": "Respuesta contundente 2 — máx 28 chars",\n  "s3": "Respuesta contundente 3 — máx 28 chars"`,
  urgency:        `"f1": "Urgencia/escasez 1 — 3-4 palabras concretas",\n  "f2": "Urgencia/escasez 2 — 3-4 palabras concretas, diferente a f1",\n  "f3": "Beneficio inmediato del producto — 3-5 palabras",\n  "f4": "CTA urgente — 2-3 palabras"`,
  authority:      `"f1": "Credencial o aval concreto — máx 36 chars",\n  "f2": "Número o estadística impactante — máx 36 chars",\n  "f3": "Certificación o premio — máx 36 chars",\n  "f4": "Diferenciador técnico — máx 36 chars"`,
  comparison:     `"b1": "Consecuencia de NO tener el producto — máx 26 chars",\n  "b2": "Otro problema sin el producto — máx 26 chars",\n  "a1": "Resultado con el producto — máx 26 chars, concreto",\n  "a2": "Beneficio adicional con el producto — máx 26 chars"`,
  guarantee:      `"b1": "Garantía específica con número — máx 32 chars",\n  "b2": "Qué pasa si no funciona — máx 32 chars",\n  "b3": "Ventaja adicional sin riesgo — máx 32 chars"`,
  social_proof:   `"r1": "Testimonio REAL con resultado concreto — máx 52 chars, ej: 'Mejoró en 2 semanas'",\n  "r2": "Testimonio REAL diferente — máx 52 chars, resultado específico"`,
  curiosity:      `"h1": "Pista misteriosa 1 que genera intriga — máx 38 chars",\n  "h2": "Dato sorprendente o pregunta — máx 38 chars",\n  "h3": "Revelación parcial del secreto — máx 38 chars"`,
  price:          `"b1": "Escasez o urgencia con número — máx 44 chars, ej: 'Solo 47 unidades disponibles'"`,
};

async function generateCopy(productContext, angleKey, angleLabel) {
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

  const res = await fetch(GEMINI_VISION_URL(getGeminiKey()), {
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

async function analyzeProduct(imageBase64) {
  const res = await fetch(GEMINI_VISION_URL(getGeminiKey()), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `Analyze this product image for high-impact advertising. Return a concise marketing brief (max 100 words):
- Product name and exact type
- The core emotional problem it solves for the customer
- Top 4 specific, concrete benefits (measurable when possible)
- Target customer profile (who buys this)
- Key differentiator from competitors
- Product category (pet, beauty, fitness, food, supplement, etc.)
Be specific and factual. Use marketing language that creates desire.`,
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
• SPELL ALL SPANISH WORDS CORRECTLY — this is non-negotiable. Proofread EVERY single word before rendering. Common errors to avoid:
  - "movesre" → CORRECT: "moverse" | "garantizzada" → CORRECT: "garantizada" | "amingo" → CORRECT: "amigo"
  - "PREOCUACIONES" → CORRECT: "PREOCUPACIONES" | "PREOCUPACION" → CORRECT: "PREOCUPACIÓN"
  - "NOSOUTROS" → CORRECT: "NOSOTROS" | "SECERTO" → CORRECT: "SECRETO" | "COMPANEO" → CORRECT: "COMPAÑERO"
  - "VITATIDAD" → CORRECT: "VITALIDAD" | "picazzon" → CORRECT: "picazón" | "apagada" is correct
  - "AVANAZDA" → CORRECT: "AVANZADA" | "APROVEEVA" → CORRECT: "APROVECHA" | "BIENESEAR" → CORRECT: "BIENESTAR"
  - "PERDER" alone is wrong in sentences like "tu perro PERDER" → use "PIERDE" | "SUFRE" is correct
  - Always add accent marks: "más", "también", "después", "además", "último", "cómo", "qué", "día", "solución"
  - Double-check every word ending in "-ción", "-ción", "-mente", "-ado", "-ido" for correct spelling
• TEXT DENSITY: A professional Facebook ad must have MINIMUM 5 distinct text elements. Sparse text = low-converting ad. Fill the design with copy — headlines, subheadlines, bullets, badges, callouts, CTA.`;

const COPY_DENSITY_RULE = `TEXT QUALITY RULE — High-converting ads are BOLD and CLEAN, not cluttered:
• LESS IS MORE: Include only (1) one MASSIVE headline (2 lines), (2) one supporting subheadline or benefit sentence, (3) 3 benefit bullets with ✓ or ✗ icons, (4) one strong full-width CTA strip, (5) one small brand/product badge.
• Headline font size: ~13-15% of canvas height — it must dominate the image. Bullets: ~3%. CTA: ~4%.
• DO NOT stack multiple dark panels or cards on top of each other. Use ONE clean overlay per section.
• Product must be clearly visible — never cover more than 40% of the product zone with text elements.
• Background scene must be partially visible — no more than 60% of the image covered with overlays.
• All text on high-contrast backgrounds: dark overlay behind white text, or white/light panel behind dark text.`;

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
5. MINIMUM TEXT DENSITY: Every ad must contain at least 6 distinct text elements (headline × 2 lines, subheadline, body sentence, 3+ bullets or feature points, badge, CTA). Fewer than 6 text layers = INCOMPLETE design.
6. SPANISH ACCURACY: All Spanish text must be spelled correctly with proper accent marks. Proofread every word before rendering.

`;

  const suffix = `\n\nFINAL CHECK: Scan every element. If any text, band, or graphic has even one pixel above y=9% of canvas height — move it down. The top 9% must be visually empty.`;

  return prefix + prompt + suffix;
}

function _buildPromptBody(angle, productContext, copy, primaryColor, format, hasProduct) {
  const [h1, h2] = _splitHeadline(copy?.headline || '');
  const sub    = copy?.description || (copy?.primaryText || '').split('.')[0] || '';
  const pt     = (copy?.primaryText || '').split('.').slice(0, 2).join('. ').trim() + (copy?.primaryText ? '.' : '');
  const ptShort = (copy?.primaryText || '').split('.')[0].trim() || sub;
  const cta    = copy?.cta || 'Ver más';
  const pname  = copy?.productName || '';
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
Design a COMPLETE ${dims} premium Facebook ad. Clean, bold, product-forward. Agency quality.

PRODUCT: ${ctx}

BACKGROUND SCENE (photorealistic, cinematic 8K):
${SCENE_ADAPT}
MOOD: RIGHT 55% of frame — target customer showing genuine frustration or pain related to the product. Moody dramatic lighting, soft bokeh. LEFT side (x 0–42%, y 48%–92%): COMPLETELY CLEAR neutral surface — this zone is reserved for the product photo overlay. Do NOT place person, objects, or decoration here.

TEXT LAYERS — 5 ELEMENTS, BOLD AND CLEAN:

1. TOP BAND (full-width semi-dark overlay, y=9%–46%):
   • "${h1}" — ultra-bold white Anton/Impact, font size ~14% of canvas height, fills 80% width
   • "${h2}" — same ultra-bold, color ${hex}, same size

2. SUBHEADLINE PILL (y=47%–54%, x 2%–98%): semi-transparent dark rounded bar, white italic text: "${ptShort}"

3. LEFT PAIN BULLETS (x 3%–42%, y 56%–84%): single dark card, ${hex} left-side accent bar, bold white text:
   ✗  ${b1}
   ✗  ${b2}
   ✗  ${b3}
   (Each line ~28px bold, well-spaced. No header label — bullets only.)

4. BOTTOM CTA STRIP (full-width, y=86%–95%, solid ${hex} background): "${cta}" — ultra-bold uppercase white, centered, ~34px

5. TOP-RIGHT BADGE (x 66%–97%, y 10%–20%): small HORIZONTAL RECTANGULAR pill (wide, short), ${hex} background, white bold: "${pname || 'Solución Comprobada'}". Must be a flat wide rectangle — NOT a circle.

PRODUCT ZONE: x 3%–42%, y 48%–85% — KEEP COMPLETELY CLEAR. No text, no overlays here.

STYLE: Premium cinematic ad. Clean design — background scene clearly visible. One dominant headline, clean bullet card, bold CTA. NO prices, NO URLs, NO extra decorative elements.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── DESIRE ───────────────────────────────────────────────────────────────────
  if (angle === 'desire') return `
Design a COMPLETE ${dims} premium Facebook ad. Clean, aspirational, product-forward. Agency quality.

PRODUCT: ${ctx}

BACKGROUND SCENE (photorealistic, cinematic 8K):
${SCENE_ADAPT}
MOOD: RIGHT 58% of frame — target customer glowing, radiant, happy — they've achieved the ideal result this product delivers. Warm golden sunlight, cinematic bokeh, rich warm colors. LEFT side (x 0%–40%, y 42%–90%): COMPLETELY CLEAR bright neutral surface — product photo zone. No person or objects here.

TEXT LAYERS — 5 ELEMENTS, BOLD AND ASPIRATIONAL:

1. TOP BAND (semi-dark gradient overlay, y=9%–45%):
   • "${h1}" — ultra-bold white Anton/Impact, ~14% canvas height, fills 80% width
   • "${h2}" — same ultra-bold, color ${hex}, same size

2. SUBHEADLINE (y=46%–53%, x 2%–98%): white rounded pill with ${hex} left-accent bar: "✓ ${ptShort}"

3. LEFT RESULTS BULLETS (x 3%–41%, y 55%–83%): single white semi-transparent card, dark bold text:
   ✓  ${b1}
   ✓  ${b2}
   ✓  ${b3}
   (Each line ~27px bold dark text on white card. Well-spaced. No header label.)

4. BOTTOM CTA STRIP (full-width, y=85%–94%, solid ${hex} background): "${cta}" — ultra-bold uppercase white centered, ~34px

5. TOP-RIGHT BADGE (x 66%–97%, y 10%–20%): small HORIZONTAL RECTANGULAR pill (wide, short), ${hex} background, white bold: "${pname || 'Resultado Garantizado'}". Must be a flat wide rectangle — NOT a circle.

PRODUCT ZONE: x 3%–40%, y 43%–84% — KEEP COMPLETELY CLEAR. No text, no overlays here.

STYLE: Warm, aspirational, magazine-quality ad. Background scene clearly visible. Bright palette. One dominant headline, clean result bullets, bold CTA. NO prices, NO URLs, NO extra decorative elements.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── TRANSFORMATION ───────────────────────────────────────────────────────────
  if (angle === 'transformation') return `
Design a COMPLETE ${dims} premium Facebook ad. Dramatic before/after split. Agency quality.

PRODUCT: ${ctx}

${SCENE_ADAPT}

LAYOUT — BOLD BEFORE/AFTER SPLIT:

LEFT HALF (x 0%–49%): Desaturated, dark, cold atmosphere. Target customer in the BEFORE state — genuinely struggling with the exact problem this product solves. Dark blue-grey desaturated tones. Specific to product context.

RIGHT HALF (x 51%–100%): Vibrant, warm, full color. Same target customer in the AFTER state — thriving and happy. Warm golden light. Same environment transformed.

CENTER: Thin vertical ${hex} divider line with a bold "→" arrow at y=52%.

TEXT LAYERS — 5 ELEMENTS:

1. TOP HEADLINE BAND (full-width, solid dark background #111, y=9%–28%):
   • "${h1}" — ultra-bold white Anton/Impact, ~12% canvas height, left side
   • "${h2}" — same ultra-bold ${hex}, right side, same size

2. BEFORE LABEL (x 4%–44%, y 30%–37%): pill with dark #222 background, bold white uppercase: "ANTES"

3. AFTER LABEL (x 56%–96%, y 30%–37%): pill with solid ${hex} background, bold white uppercase: "DESPUÉS"

4. BEFORE card (x 3%–47%, y 72%–84%): dark semi-transparent card: "${b1}" — white bold text, 2 lines max

5. AFTER card + CTA (x 53%–97%):
   • y=72%–82%: ${hex} card: "${a1}" — white bold text, 2 lines max
   • y=83%–92%: dark pill: "${cta}" — white ultra-bold centered

BOTTOM STRIP (full-width, y=86%–94%, dark overlay): "${ptShort}" — white italic centered small

STYLE: Dramatic, cinematic contrast. Left cold+dark vs right warm+vibrant. Clean split with clear labels. NO prices, NO URLs, NO extra decoration.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── OBJECTION ────────────────────────────────────────────────────────────────
  if (angle === 'objection') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: CENTER-RIGHT: a thoughtful, intelligent-looking target customer, expression moving from skeptical to reassured. Crisp natural lighting, white and warm tones. Minimal, premium aesthetic.

TYPOGRAPHY — 7 REQUIRED TEXT LAYERS:
1. TOP BAND (full width, white background with dark border, y=9%–30% of canvas, h≈21%):
   • "${h1}" — bold dark (#111) ultra-heavy sans-serif, large, left-aligned
   • "${h2}" — bold ${hex}, same size, second line
2. BELOW HEADLINE (y=31%–38%): full-width dark strip with white italic: "${ptShort}"
3. LOWER SPLIT PANEL (y=39%–84%):
   LEFT panel (x 2%–47%, dark #1a1a2e background): bold ${hex} header "¿LO DUDAS?", then:
   • "✗ ${p1}"
   • "✗ ${p2}"
   • "✗ ${p3}"
   RIGHT panel (x 53%–98%, ${hex} background): bold white header "LA REALIDAD:", then:
   • "✓ ${s1}"
   • "✓ ${s2}"
   • "✓ ${s3}"
4. CENTER DIVIDER vertical line with "VS" pill badge
5. BOTTOM STRIP (y=85%–94%, ${hex} background): "${cta}" — bold white centered button
6. UPPER-RIGHT corner (x 68%–97%, y 10%–20%): small white rounded badge: "${pname || 'Garantizado'}"

DECORATIVE: Shield icon bottom-right. Clean ${hex} accent lines. Trust-building design.

STYLE: Professional, trustworthy, reassuring. Clean advertising design. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── URGENCY ──────────────────────────────────────────────────────────────────
  if (angle === 'urgency') return `
Design a COMPLETE ${dims} premium Facebook ad. High-energy, bold, urgent. Agency quality.

PRODUCT: ${ctx}

BACKGROUND SCENE (photorealistic, cinematic 8K):
${SCENE_ADAPT}
MOOD: High-energy, dynamic scene. Target customer in an excited, action-ready state — vivid colors, dramatic lighting. RIGHT 40% (x 58%–98%, y 45%–92%): COMPLETELY CLEAR — product photo zone. Do NOT place subjects or decorations here.

TEXT LAYERS — 5 ELEMENTS, BOLD AND URGENT:

1. URGENCY BADGE (y=9%–18%, x 3%–55%): HORIZONTAL RECTANGULAR pill (wide, short height ~8% canvas), solid ${hex} background, white ultra-bold text: "⏱ OFERTA LIMITADA — HOY". This must be a wide flat rectangle — NOT a circle, NOT a square.

2. HEADLINE BAND (semi-dark overlay, y=19%–48%):
   • "${h1}" — ultra-bold white Anton/Impact, ~13% canvas height, fills 82% width
   • "${h2}" — same ultra-bold, solid ${hex} color, same size

3. SUBHEADLINE (y=49%–56%, x 2%–56%): white semi-transparent pill, bold dark text: "${ptShort}"

4. FEATURE PILLS ROW (y=58%–68%, x 2%–56%): 4 RECTANGULAR dark rounded pills arranged in a 2×2 grid. Each pill = dark background + white bold text ONLY. NO circles, NO icons, NO circular elements, NO icon placeholders before the text:
   [ ${f1} ]  [ ${f2} ]
   [ ${f3} ]  [ ${f4} ]
   (Pure text inside rectangular dark pills. Nothing else.)

5. BOTTOM CTA STRIP (full-width, y=87%–96%, solid ${hex} background): "${cta}" — ultra-bold uppercase white centered, ~36px. NO icons in the CTA strip. Text only.

PRODUCT ZONE: x 58%–97%, y 44%–86% — KEEP COMPLETELY CLEAR.

STYLE: Bold, loud, high-energy ad. Background partially visible. Urgency badge dominates top. Headline massive. Features as clean rectangular text pills. Strong CTA. NO circular elements anywhere. NO icon placeholders. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── AUTHORITY ────────────────────────────────────────────────────────────────
  if (angle === 'authority') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Premium, minimal, bright professional setting. LEFT-CENTER: a confident expert relevant to the product category (beauty → dermatologist; pet → veterinarian; fitness → trainer; food → nutritionist; health → doctor) in professional attire. Warm natural lighting, slight bokeh. Credible, premium, trustworthy.

TYPOGRAPHY — 7 REQUIRED TEXT LAYERS:
1. TOP BAND (white or very light background, y=9%–32% of canvas, h≈23%):
   • "${h1}" — ultra-bold dark (#111) heavy sans-serif, large, left-aligned
   • "${h2}" — bold ${hex}, same large size, second line
2. BELOW HEADLINE (y=33%–40%): full-width dark strip, white italic sentence: "${ptShort}"
3. RIGHT SIDE CREDENTIAL CARDS (x 52%–98%, y 41%–86%, stacked with gap):
   • Card 1: 🛡 icon + "${f1}" — white background, ${hex} left border, dark bold text
   • Card 2: 🏅 icon + "${f2}" — white background, ${hex} left border, dark bold text
   • Card 3: ⭐ icon + "${f3}" — white background, ${hex} left border, dark bold text
   • Card 4: ✔ icon + "${f4}" — white background, ${hex} left border, dark bold text
4. BOTTOM STRIP (y=87%–95%, ${hex} background): "${cta}" — bold white centered
5. TOP-RIGHT corner (x 68%–97%, y 10%–21%): small white rounded badge: "${pname || 'Certificado'}"
6. BOTTOM-LEFT (x 2%–46%, y 87%–94%): "${sub}" — small white italic on dark card

DECORATIVE: Certification seal graphic lower-right. Premium ${hex} accent lines. Clean precision design.

STYLE: Expert, premium, minimal, trust-building. Clinical precision meets premium branding. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── COMPARISON ───────────────────────────────────────────────────────────────
  if (angle === 'comparison') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

${SCENE_ADAPT}

LAYOUT — COMPARISON SPLIT (7 TEXT LAYERS):
TOP BANNER (full width, y=9%–27% of canvas, h≈18%, ${hex} background):
• "${h1}" — ultra-bold white, left half of banner, massive Impact/Anton
• "${h2}" — ultra-bold white, right half of banner, same size

BODY STRIP (full width, y=27%–34%, dark background): "${ptShort}" — white italic centered

UPPER PHOTO STRIP (y=34%–58%, split):
LEFT PHOTO (x 0%–50%): Moody, desaturated — target customer WITHOUT the product, struggling. Dark cool tones. Specific to product context.
RIGHT PHOTO (x 50%–100%): Bright, vibrant — same customer WITH the product, thriving. Warm golden tones. Specific to product context.

LOWER COMPARISON PANEL (y=59%–86%, split):
LEFT (x 0%–48%, dark background #1a1a2e):
   • "OTROS" header — bold white uppercase, large
   • "✗ ${b1}"
   • "✗ ${b2}"
RIGHT (x 52%–100%, ${hex} background):
   • "NOSOTROS" header — bold white uppercase, large
   • "✓ ${a1}"
   • "✓ ${a2}"

CENTER COLUMN (x 45%–55%): Bold vertical white line with "VS" circular badge at midpoint. Product zone: bottom-center (x 38%–62%, y 57%–86%) — KEEP CLEAR.

BOTTOM STRIP (y=87%–95%, dark background): "${cta}" — bold white ${hex} pill button centered + "${sub}" small italic beside it.

STYLE: Clean, professional, high-contrast split. Clear winner layout. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── GUARANTEE ────────────────────────────────────────────────────────────────
  if (angle === 'guarantee') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Calm, warm, peaceful. Completely relaxed and satisfied target customer appropriate to the product category — gentle warm light, soft bokeh. RIGHT 55% of frame. LEFT lower area (x 0%–40%, y 50%–95%): clean neutral surface — keep CLEAR.

TYPOGRAPHY — 7 REQUIRED TEXT LAYERS:
1. TOP-CENTER (y=9%–24%): Large guarantee seal/badge (hexagonal or shield shape, ${hex} fill, white border): bold white text inside: "GARANTÍA 30 DÍAS ✓"
2. BELOW BADGE (y=25%–44%): Headline:
   • "${h1}" — ultra-bold white Impact/Anton font, large, centered
   • "${h2}" — ultra-bold ${hex}, same large size, line below
3. MID CENTER (y=45%–53%): Full-width dark pill, white italic sentence: "${ptShort}"
4. MID CENTER (y=54%–60%): Small ${hex} italic text: "${sub}"
5. LOWER-LEFT GUARANTEE CARD (x 2%–44%, y 62%–83%): dark card, bold white header "SIN RIESGO:", then:
   • "✓ ${b1}"
   • "✓ ${b2}"
   • "✓ ${b3}"
6. LOWER-LEFT BOTTOM (x 2%–44%, y 84%–93%): ${hex} rounded pill: "${cta}" — bold white centered
7. TOP-RIGHT badge (x 68%–97%, y 10%–22%): white rounded badge: "${pname || 'Riesgo Cero'}"

DECORATIVE: Soft golden glow around guarantee badge. Green checkmark icons. Trust palette (gold, green, ${hex}).

STYLE: Safe, reassuring, zero-risk feel. Warm, premium, trust-driven. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── SOCIAL PROOF ─────────────────────────────────────────────────────────────
  if (angle === 'social_proof') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Warm, community-feel. TOP 50%: happy, glowing target customer who has benefited from this product — natural warm lighting, genuine smile, relatable setting for the product category. LOWER 50%: slightly darkened to accommodate text panels.

TYPOGRAPHY — 7 REQUIRED TEXT LAYERS:
1. TOP BANNER (${hex} background, y=9%–23% of canvas, h≈14%): "★★★★★  +10.000 clientes satisfechos" — bold white centered, star icons ${hex}
2. UPPER TEXT (y=24%–42%):
   • "${h1}" — ultra-bold white Anton/Impact, large, left-aligned
   • "${h2}" — ultra-bold ${hex}, same size, second line
3. BODY TEXT (y=43%–50%): dark semi-transparent strip, white italic: "${ptShort}"
4. TWO TESTIMONIAL CARDS side by side (y=51%–82%):
   LEFT card (white background, rounded corners, dark shadow):
   • Circular avatar (silhouette icon)
   • "${r1}"
   • "★★★★★" in ${hex}
   RIGHT card (white background, rounded corners, dark shadow):
   • Circular avatar (silhouette icon)
   • "${r2}"
   • "★★★★★" in ${hex}
5. BOTTOM STRIP (${hex} background, y=83%–91%): "${cta}" — bold white centered
6. BELOW BOTTOM (y=92%–97%): "${sub}" — small white italic centered on dark strip
7. TOP-RIGHT corner badge (x 68%–97%, y 10%–20%): white rounded badge: "${pname || 'Ya Probado'}"

DECORATIVE: Star ★ icons scattered subtly in background. Rating badge top. Warm golden vignette.

STYLE: Warm, community, validated. Trust through real testimonials. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── CURIOSITY ────────────────────────────────────────────────────────────────
  if (angle === 'curiosity') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Dark, atmospheric, cinematic. The target customer leaning in to discover something surprising — dramatic single-light spotlight, deep shadows, rich dark tones. The scene feels like a revelation is about to happen. LEFT side of frame.

TYPOGRAPHY — 7 REQUIRED TEXT LAYERS:
1. GIANT "?" DESIGN ELEMENT — very large, ${hex}, semi-transparent (30% opacity), behind main text, centered
2. TOP-LEFT HEADLINE area (y=9%–34%):
   • "${h1}" — ultra-bold white Anton/Impact, large, left-aligned
   • "${h2}" — ultra-bold ${hex}, same large size, line below
3. MID-LEFT BODY (y=35%–43%): dark pill, white italic: "${ptShort}"
4. CENTER MYSTERY PILLS (y=44%–72%, x 2%–52%):
   • Dark card with ${hex} left border: "◆ ${copy?.h1 || sub}"
   • Dark card with ${hex} left border: "◆ ${copy?.h2 || b1}"
   • Dark card with ${hex} left border: "◆ ${copy?.h3 || b2}"
5. BOTTOM STRIP (full width, y=85%–93%, ${hex} background): "${cta}" — bold white centered
6. BELOW BOTTOM (y=94%–98%): "${sub}" — small white italic centered
7. UPPER-RIGHT corner badge (x 66%–96%, y 10%–20%): small rounded badge: "${pname || 'Descubre'}" — dark bg, ${hex} text

PRODUCT ZONE: RIGHT LOWER (x 54%–94%, y 50%–84%) — KEEP COMPLETELY CLEAR.
DECORATIVE: Dramatic dark vignette. Spotlight beam effect. Floating light particles. Cinematic atmosphere.

STYLE: Intriguing, mysterious, irresistible. Dark cinematic drama. NO prices, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  // ── PRICE ────────────────────────────────────────────────────────────────────
  if (angle === 'price') return `
Design a COMPLETE ${dims} professional Facebook ad. World-class advertising quality.

PRODUCT: ${ctx}

BACKGROUND SCENE:
${SCENE_ADAPT}
MOOD: Energetic, celebratory. The target customer excited and celebrating — vibrant bright colors, festive confetti-like atmosphere, dynamic lighting. TOP 55% of frame.

TYPOGRAPHY — 7 REQUIRED TEXT LAYERS:
1. TOP-LEFT (y=9%–19%): Wide ${hex} pill badge: "🏷 OFERTA ESPECIAL" — bold white, hourglass icon left
2. UPPER CENTER (y=20%–40%): Headline:
   • "${h1}" — ultra-bold white Anton/Impact, large, no shadow
   • "${h2}" — ultra-bold ${hex}, same size, line below
3. MID CENTER (y=41%–49%): Large value display box (white background, rounded, drop-shadow):
   • Sub-text small dark: "${ptShort}"
   • Scarcity line bold dark: "${b1 || '¡Solo por tiempo limitado!'}"
4. LOWER-LEFT (x 2%–52%, y 50%–62%): dark italic strip, white text: "${sub}"
5. LOWER-LEFT to CENTER PRODUCT ZONE (x 4%–54%, y 62%–95%): KEEP COMPLETELY CLEAR
6. LOWER-RIGHT VALUE CARD (x 56%–98%, y 65%–88%, ${hex} background, rounded):
   • "✓ Envío gratis"
   • "✓ Garantía incluida"
   • "✓ Pago seguro"
   All bold white text
7. BOTTOM STRIP (y=89%–97%, dark): "${cta}" — bold white ${hex} pill button, centered

DECORATIVE: Confetti or geometric shapes floating. Diagonal ${hex} energy stripe. Celebration burst behind headline.

STYLE: Celebratory, value-forward, high-energy. Premium feel. NO actual prices with numbers, NO URLs.
${fmt}
${productRule}
${IMPACT_RULE}
${COPY_DENSITY_RULE}
${NO_LABEL_RULE}`.trim();

  return null;
}

// Wrap every angle return so NO_LABEL_RULE and productRule are always appended.
// (The angle branches above already include them inline for safety; this is the fallback.)


// ICON_STRIP_ANGLES is now unused — all angles use full Gemini design
const ICON_STRIP_ANGLES = new Set([]);

// ─── ICON PANEL GENERATION ───────────────────────────────────────────────────

// Angles that use the feature strip at the bottom — icon panel is generated for these
const ICON_STRIP_ANGLES_ACTIVE = new Set(['pain', 'urgency']);

async function generateIconPanel(productContext, copy, primaryColor) {
  const features = [
    copy.f1 || copy.b1 || 'Resultado visible',
    copy.f2 || copy.b2 || 'Fórmula premium',
    copy.f3 || copy.b3 || 'Uso diario',
    copy.f4 || copy.cta || 'Garantizado',
  ];

  const prompt = `Generate a wide horizontal strip image (4:1 aspect ratio) with exactly 4 photorealistic 3D-rendered icon objects evenly distributed across it.

Product: ${productContext}

Each icon represents one of these 4 benefit concepts — derive the specific 3D object visually from the product context:
1. "${features[0]}"
2. "${features[1]}"
3. "${features[2]}"
4. "${features[3]}"

STRICT REQUIREMENTS:
• Background: pure solid very dark color, near-black (#0d1117) — fills the entire image
• 4 icons placed in equal columns, one per quarter, each centered
• Icon style: photorealistic 3D rendered objects with subtle ${primaryColor} glow and cinematic lighting from above
• Icon materials: glass, metallic, or organic — premium commercial 3D render quality
• Each icon takes up ~65% of its column width — small and well-lit
• ABSOLUTELY NO text, NO labels, NO letters, NO borders, NO frames — only the 4 icon objects on dark background
• Icons must clearly represent different concepts, not repeated`;

  const res = await fetch(GEMINI_IMAGE_URL(getGeminiKey()), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });
  const data = await res.json();
  if (!res.ok) return null;
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  return imgPart ? { data: imgPart.inlineData.data } : null;
}

// ─── BACKGROUND / FULL-DESIGN GENERATION ─────────────────────────────────────

// productBase64: when provided, Gemini integrates the product into the scene directly.
async function generateBackground(scenePrompt, productBase64 = null) {
  const parts = [];
  if (productBase64) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: productBase64 } });
  }
  parts.push({ text: scenePrompt });

  const res = await fetch(GEMINI_IMAGE_URL(getGeminiKey()), {
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

// Generates a single photorealistic square icon image for a benefit/feature text.
async function generateIconImage(benefitText, productContext, primaryColor) {
  const categoryHint = productContext.substring(0, 80);
  const prompt = `Single flat icon on solid ${primaryColor} background. Square 1:1.
ICON: A single clean white flat vector-style symbol representing "${benefitText}".
Examples: shield for "protection/guarantee", heart for "health/love", star for "quality", leaf for "natural", drop for "hydration", lightning for "energy/fast", paw for "pets", muscle arm for "strength".
The white symbol must fill 55-65% of the frame, perfectly centered.
Ultra-clean edges. No gradients. No text. No shadows. Pure flat white icon on ${primaryColor}.
Style: Apple-quality system icon, flat design.
Product: ${categoryHint}`;
  return generateBackground(prompt);
}
// ─── COMPOSITE: background + template + product ───────────────────────────────

async function compositeAll({ backgroundBase64, templatePng, productBase64, iconPanelBase64, iconImages, format, angle, fullDesign }) {
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

  // 4. AI circular icons — each generated at 1:1 ratio, cropped to circle, composited at exact strip position
  if (iconImages && iconImages.length) {
    const stripH = Math.round(h * 0.205);
    const stripY = h - stripH;
    const circleR = Math.round(stripH * 0.26);
    const circleY = stripY + Math.round(stripH * 0.40);
    const boxW = Math.round(w / 4);
    const iconSize = circleR * 2;
    const svgCircle = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}"><circle cx="${circleR}" cy="${circleR}" r="${circleR}"/></svg>`;

    for (let i = 0; i < Math.min(iconImages.length, 4); i++) {
      if (!iconImages[i]) continue;
      try {
        const bx = Math.round(i * boxW + boxW / 2);
        // Resize to square, convert to PNG (needs alpha for mask), apply circular clip
        const resized = await sharp(Buffer.from(iconImages[i], 'base64'))
          .resize(iconSize, iconSize, { fit: 'cover', position: 'center' })
          .png()
          .toBuffer();
        const circularIcon = await sharp(resized)
          .composite([{ input: Buffer.from(svgCircle), blend: 'dest-in' }])
          .png()
          .toBuffer();
        layers.push({ input: circularIcon, left: bx - circleR, top: circleY - circleR, blend: 'over' });
      } catch {
        // icon composite failed — canvas fallback circle remains visible for this slot
      }
    }
  }

  const result = await sharp(bgBuffer)
    .composite(layers)
    .jpeg({ quality: 92 })
    .toBuffer();

  return result.toString('base64');
}

// ─── SINGLE VARIATION PIPELINE ───────────────────────────────────────────────

const SCENE_STYLE_VARIANTS = [
  '', // V0: wide lifestyle (default)
  '\nSCENE STYLE VARIANT: Dramatic close-up. Person fills more of the frame — tight crop, intense expression, intimate. More emotion visible in the face.',
  '\nSCENE STYLE VARIANT: Cinematic environmental portrait. Strong depth of field, subject sharply separated from a richly detailed background. Premium editorial feel.',
];

async function generateOneVariation({ a, variationIdx, productContext, productName, primaryColor, productImageBase64, format, adjustmentInstruction }) {
  const label = ANGLE_LABELS[a] || a;
  const hasProduct = !!productImageBase64;
  // Pick a random template+scene variant on every call for visual diversity
  const vIdx = Math.floor(Math.random() * 3);

  const copy = await generateCopy(productContext, a, label);
  const enrichedCopy = { ...(copy || {}), productName: productName || '' };

  const scenePromptFn = ANGLE_SCENES[a] || ANGLE_SCENES.desire;
  let scenePrompt = scenePromptFn(productContext, format);
  scenePrompt += SCENE_STYLE_VARIANTS[vIdx];
  if (adjustmentInstruction) scenePrompt += `\n\nSCENE ADJUSTMENT: ${adjustmentInstruction}`;

  const features = [
    enrichedCopy.f1 || 'Resultados probados',
    enrichedCopy.f2 || 'Formula premium',
    enrichedCopy.f3 || 'Uso diario seguro',
    enrichedCopy.f4 || 'Satisfaccion total',
  ];
  const [bgImage, ...iconResults] = await Promise.allSettled([
    generateBackground(scenePrompt),
    ...features.map(f => generateIconImage(f, productContext, primaryColor)),
  ]);

  if (bgImage.status === 'rejected') throw bgImage.reason;
  const aiIconImages = iconResults.map(r => r.status === 'fulfilled' ? r.value.data : null);

  const templatePng = buildTemplate(a, enrichedCopy, primaryColor, format, hasProduct, vIdx);

  const composited = await compositeAll({
    backgroundBase64: bgImage.value.data,
    templatePng,
    productBase64: productImageBase64 || null,
    iconPanelBase64: null,
    iconImages: aiIconImages,
    format,
    angle: a,
    fullDesign: false,
  });

  return { imageUrl: `data:image/jpeg;base64,${composited}`, angle: a, variation: variationIdx, label, copy };
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const {
    productName,
    description,
    angles,
    angle = 'desire',
    format = 'square',
    primaryColor = '#6366f1',
    productImageBase64,
    adjustmentInstruction,
    variationsCount = 1,
  } = req.body;

  if (!productName && !productImageBase64) {
    return res.status(400).json({ error: 'Se requiere nombre del producto o imagen.' });
  }

  const selectedAngles = Array.isArray(angles) && angles.length > 0 ? angles : [angle];
  const numVariations = Math.min(Math.max(1, variationsCount), 3);
  const totalVariations = selectedAngles.length * numVariations;

  // Credit check: 10 credits per variation to be generated
  const totalCost = CREDIT_COSTS.generate_image * totalVariations;
  const creditCheck = await checkCredits(user.email, 'generate_image');
  if (!creditCheck.ok) {
    return res.status(creditCheck.status).json({ error: creditCheck.error, balance: creditCheck.balance });
  }

  try {
    let productContext = '';
    if (productImageBase64) {
      const visualAnalysis = await analyzeProduct(productImageBase64);
      productContext = description
        ? `${visualAnalysis}\n\nSeller description: ${description}`
        : visualAnalysis;
    } else {
      productContext = `Product: ${productName}. ${description || ''}`;
    }

    const jobs = selectedAngles.flatMap(a =>
      Array.from({ length: numVariations }, (_, v) =>
        generateOneVariation({ a, variationIdx: v, productContext, productName, primaryColor, productImageBase64, format, adjustmentInstruction })
      )
    );

    const results = await Promise.allSettled(jobs);
    const images = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message);

    if (images.length === 0) {
      return res.status(500).json({ error: errors[0] || 'Error generando imagenes' });
    }

    // Deduct credits only for the variations that actually succeeded
    const creditsCharged = CREDIT_COSTS.generate_image * images.length;
    // ~5 Gemini image calls per variation (1 background + 4 icons) × $0.039 each
    const estimatedCostUsd = parseFloat((images.length * 0.20).toFixed(4));
    const { w: finalWidth, h: finalHeight } = DIMS[format] || DIMS.square;

    await deductCredits(user.email, 'generate_image', {
      model:              'gemini-2.5-flash-image',
      output_format:      format,
      final_width:        finalWidth,
      final_height:       finalHeight,
      jpeg_quality:       92,
      number_of_images:   images.length,
      estimated_cost_usd: estimatedCostUsd,
      credits_charged:    creditsCharged,
      user_id:            user.id,
      quality_tier:       'standard_ads_ready',
      metadata: {
        angles:       selectedAngles,
        num_angles:   selectedAngles.length,
        variations_per_angle: numVariations,
        errors_count: errors.length,
      },
    });

    return res.status(200).json({ images, ...(errors.length && { errors }) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error generando imagenes' });
  }
}
