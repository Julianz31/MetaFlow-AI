// Motor de anuncios — 11 ángulos en 4 arquetipos de diseño (HTML/CSS + Chromium).
// IA genera SOLO la fotografía (sin texto); la capa de diseño es determinista.
// Reemplaza el motor viejo (Gemini dibujaba todo). Mismo contrato {images}.

const sharp = require('sharp');

const getKey = () => {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY no configurada en el servidor');
  return k;
};
const TEXT_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getKey()}`;
const IMG_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${getKey()}`;

// ─── helpers IA ────────────────────────────────────────────────────────────────
async function genText(prompt, temp = 0.92) {
  const res = await fetch(TEXT_URL(), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: temp } }),
  });
  const d = await res.json();
  const raw = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}
async function genImage(parts) {
  const res = await fetch(IMG_URL(), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || 'Error generando imagen');
  const p = d.candidates?.[0]?.content?.parts?.find(x => x.inlineData);
  if (!p) throw new Error('Gemini no devolvió imagen');
  return p.inlineData.data;
}
const sceneImage = (prompt) => genImage([{ text: prompt }]);

function stripDataUrl(b64) { return typeof b64 === 'string' ? b64.replace(/^data:image\/\w+;base64,/, '') : b64; }

// Pre-encuadre del producto: Gemini imita la escala de la imagen de entrada,
// así que componemos el producto PEQUEÑO (~42% de alto) en un lienzo del
// tamaño del anuncio para que la escena final no salga con el frasco gigante.
async function padProductImage(b64, W, H) {
  try {
    const buf = Buffer.from(b64, 'base64');
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) return b64;
    // En formatos no verticales hay menos aire: producto más pequeño y más alto
    const portrait = H >= W * 1.15;
    const targetH = Math.round(H * (portrait ? 0.42 : 0.36));
    const centerY = portrait ? 0.58 : 0.53;
    const w = Math.round(meta.width * (targetH / meta.height));
    if (w > W * 0.9) return b64; // foto muy panorámica: no forzar
    const resized = await sharp(buf).resize({ height: targetH }).png().toBuffer();
    const out = await sharp({ create: { width: W, height: H, channels: 3, background: '#ededed' } })
      .composite([{ input: resized, left: Math.round(W * 0.55 - w / 2), top: Math.round(H * centerY - targetH / 2) }])
      .jpeg({ quality: 92 }).toBuffer();
    return out.toString('base64');
  } catch { return b64; }
}
function rgba(hex, a) {
  const n = (hex || '#7C3AED').replace('#', '');
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}

// ─── símbolos como SVG (el Chromium de Vercel no trae glifos → tofu) ───────────
const STAR_PATH = 'M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z';
const starsSvg = (color, size = 38) => {
  const one = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="${STAR_PATH}"/></svg>`;
  return `<span style="display:inline-flex;gap:5px;align-items:center;">${one.repeat(5)}</span>`;
};
const arrowSvg = (size = 30) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
const checkSvg = (color, size = 30) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const crossSvg = (color, size = 28) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;
const shieldSvg = (color, size = 60) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"/><path d="M9.5 12.5l2 2 4-4.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ─── escena fotográfica por ángulo (SIN texto, SIN producto si va overlay) ─────
function fmtHint(format) {
  return format === 'vertical' ? 'Vertical 9:16 portrait framing.'
    : format === 'horizontal' ? 'Horizontal 16:9 landscape framing.'
    : 'Vertical 4:5 portrait framing.';
}
const NO_TEXT = 'STRICT: absolutely NO text, NO words, NO letters, NO logos, NO watermarks. ONLY a clean photographic scene.';
const TECH = '8K, photorealistic, cinematic, magazine quality, sharp focus, natural color grade.';
const SCENE_ADAPT = (ctx) => `Derive the setting, person demographics, wardrobe and props EXCLUSIVELY from this product context: ${ctx}. Auto-detect category: beauty→vanity/bathroom/glowing skin; pet→home with owner+pet; fitness/supplement→gym or outdoors; food→kitchen; health→clean wellness space.`;

// devuelve 1 o 2 prompts de escena según el arquetipo
function scenePrompts(angle, ctx, format) {
  const f = fmtHint(format);
  const base = (mood, clear) => `Photorealistic lifestyle photograph. ${SCENE_ADAPT(ctx)}
MOOD: ${mood}
${clear}
${NO_TEXT} ${TECH} ${f}`;

  switch (angle) {
    case 'pain': return [base(
      'The target customer visibly frustrated, stressed or worried about the exact problem this product solves. Dark, moody, dramatic emotional tone, soft bokeh. Authentic, relatable.',
      'Subject on the LEFT. Keep the RIGHT 40% and the bottom area cleaner/darker for text and a product inset.')];
    case 'desire': return [base(
      'A radiant, happy customer who achieved their ideal result. Warm golden-hour light, vibrant, aspirational, genuine smile.',
      'Subject LEFT-OF-CENTER, upper area. Keep right and bottom calmer for text.')];
    case 'urgency': return [base(
      'High-energy, dynamic scene. Excited, action-ready customer, vivid colors, dramatic light, sense of immediacy.',
      'Subject centered/left, upper area. Keep right 40% and bottom cleaner for text.')];
    case 'authority': return [base(
      'A confident expert relevant to the category (beauty→dermatologist, pet→veterinarian, fitness→trainer, food→nutritionist) in a clean premium bright environment. Credible, trustworthy.',
      'Expert center-left. Keep right side clean/minimal for credential cards.')];
    case 'guarantee': return [base(
      'Calm, peaceful, reassuring. A completely relaxed, satisfied customer, soft warm light, content smile.',
      'Subject on the RIGHT. Keep left-lower area clean for a guarantee seal and text.')];
    case 'curiosity': return [base(
      'Intriguing, cinematic, atmospheric. Customer with a surprised, mind-blown expression, dramatic single-light, dark edges bright center.',
      'Subject LEFT, upper area. Keep right-lower clean and darker for text.')];
    case 'price': return [base(
      'Energetic, celebratory. Happy customer reacting with excitement, vibrant bright festive atmosphere.',
      'Subject upper-center. Keep lower area cleaner for an offer block and text.')];
    case 'social_proof': return [base(
      'Warm, community feel. A happy, glowing, relatable customer who benefited from the product, natural warm light, genuine smile.',
      'Subject in the UPPER half. Keep the LOWER half calmer/darker for testimonial cards.')];
    case 'objection': return [base(
      'A thoughtful, intelligent-looking customer moving from skeptical to reassured, clean trustworthy premium environment, soft light.',
      'Subject center. Keep both lower sides usable for two contrasting panels.')];
    case 'transformation': return [
      base('The customer in the BEFORE state — genuinely struggling with the exact problem. Desaturated, cool, dull, gloomy lighting.', 'Head-on, centered, plain soft background.'),
      base('The SAME customer in the AFTER state — thriving, happy, confident. Warm, vibrant, golden healthy light.', 'Head-on, centered, plain warm background.')];
    case 'comparison': return [
      base('A customer WITHOUT the product, struggling, with generic unbranded alternatives. Moody, desaturated, cool tones.', 'Head-on, centered, plain background.'),
      base('The SAME customer WITH the product, thriving and smiling. Bright, warm, premium tones.', 'Head-on, centered, plain premium background.')];
    default: return scenePrompts('desire', ctx, format);
  }
}

// Escena PRODUCT-HERO: el producto es la estrella (grande, centrado), fondo
// estudio con mood por ángulo. La imagen del producto se alimenta a Gemini.
const HERO_MOOD = {
  desire: 'warm golden glow, aspirational, dreamy',
  pain: 'moody, dramatic, deep shadows, tense',
  urgency: 'high-energy, vivid, dynamic dramatic light',
  authority: 'clean, premium, minimal, bright, clinical',
  guarantee: 'calm, soft, reassuring, warm trustworthy',
  curiosity: 'dark cinematic, single spotlight, mysterious, intriguing',
  price: 'bright, celebratory, vibrant, festive',
};
function heroScenePrompt(angle, ctx, format, cleanLabel) {
  const mood = HERO_MOOD[angle] || 'premium, cinematic';
  return `Use the EXACT product from the provided image as the HERO of a premium advertising scene (high-end supplement/beauty ad style). Keep its shape, color and dropper EXACTLY. ${labelRule(cleanLabel)}
SCENE: rich SATURATED gradient studio background in the same color family as the product's own branding/label (deep, vibrant, premium — like a brand-color environment), tone adjusted to the mood: ${mood}. Fine glowing sparkles and soft bokeh floating in the air. A few loose elements of the product itself scattered artfully near its base (drops, gummies, petals, kibble — whatever matches: ${ctx}), plus optionally its cap/lid lying beside it. Optionally a soft out-of-focus contextual element behind (happy pet for pet products, serene person for sleep/beauty).
PLACEMENT: product standing center (horizontal center at ~55% of frame width) on a subtle glossy surface with soft contact shadow and gentle reflection. SIZE — CRITICAL: the product must be SMALL relative to the frame: total product height ~40% of the frame height, its TOP edge no higher than 34% from the top, its base at ~80% of frame height. Lots of breathing room around it. Relight to match the scene.
COMPOSITION: the TOP 30% of the frame must stay CLEAN (only smooth gradient and sparkles, nothing else) for a large headline; keep the bottom 15% simple. ${fmtHint(format)}
QUALITY: ${TECH} STRICT: NO marketing text, NO words, NO extra logos beyond the product's own label, NO watermarks, only ONE instance of the main product bottle.`;
}

// En qué escena va integrado el producto real (split: la del "después/con producto")
function productSceneIndex(angle) {
  return (angle === 'transformation' || angle === 'comparison') ? 1 : 0;
}
// Regla de etiqueta: fidelidad (conservar tal cual) vs limpia (reconstruir legible)
const LABEL_KEEP = `Keep the product's label EXACTLY as in the input — every detail, fully readable, do NOT redesign or rewrite it.`;
const LABEL_CLEAN = `CRITICAL — REDRAW THE LABEL FULLY LEGIBLE: EVERY single line of text on the product's label (including the small print) must be a real, sharp, correctly-spelled Spanish word. ZERO blurry, distorted, garbled or nonsense text anywhere on the label. Keep the SAME brand name, SAME colors, SAME layout and SAME illustration/icon, but REPLACE any unreadable small print with short, clean, relevant Spanish wording (product type, "Para perros y gatos", benefit keywords, volume). Keep the bottle/package shape and material identical.`;
const labelRule = (clean) => (clean ? LABEL_CLEAN : LABEL_KEEP);

const productIntegrate = (clean) => `
FEATURE THE PRODUCT: Use the EXACT product from the provided image — the person holds it naturally in-frame (or it sits clearly visible on a nearby surface), relit to match the scene. ${labelRule(clean)} It must clearly be the SAME product; do NOT invent a different bottle. Show only ONE instance of the product (no duplicates).`;
const NO_PRODUCT = `
Do NOT include any product bottle, dropper, jar or packaging in this scene.`;

// ─── copy por ángulo ───────────────────────────────────────────────────────────
const ANGLE_LABELS = {
  pain: 'Dolor', desire: 'Deseo', transformation: 'Transformación', objection: 'Objeción',
  urgency: 'Urgencia', authority: 'Autoridad', comparison: 'Comparativa', guarantee: 'Garantía',
  social_proof: 'Prueba Social', curiosity: 'Curiosidad', price: 'Precio/Oferta',
};
const COPY_FIELDS = {
  pain: `"eyebrow":"2-3 palabras MAYÚS del dolor","headline":"titular que golpea el dolor, máx 5 palabras","accent":"1 palabra del titular","sub":"frase de alivio, máx 50 chars","b1":"dolor concreto máx 22 chars","b2":"dolor concreto máx 22 chars","b3":"consecuencia máx 22 chars","cta":"2-3 palabras","badge":"1-2 palabras"`,
  desire: `"eyebrow":"2-3 palabras MAYÚS aspiracional","headline":"titular del resultado ideal, máx 5 palabras","accent":"1 palabra","sub":"beneficio, máx 50 chars","b1":"resultado máx 22 chars","b2":"resultado máx 22 chars","b3":"resultado máx 22 chars","cta":"2-3 palabras","badge":"1-2 palabras"`,
  urgency: `"eyebrow":"OFERTA/escasez 2-3 palabras","headline":"titular urgente, máx 5 palabras","accent":"1 palabra","sub":"frase de urgencia, máx 50 chars","b1":"beneficio máx 22 chars","b2":"beneficio máx 22 chars","b3":"beneficio máx 22 chars","cta":"2-3 palabras","badge":"OFERTA LIMITADA"`,
  authority: `"eyebrow":"2-3 palabras MAYÚS de autoridad","headline":"titular de credibilidad, máx 5 palabras","accent":"1 palabra","sub":"frase, máx 50 chars","b1":"credencial/cifra máx 26 chars","b2":"credencial/cifra máx 26 chars","b3":"certificación máx 26 chars","cta":"2-3 palabras","badge":"Certificado"`,
  guarantee: `"eyebrow":"GARANTÍA 1-2 palabras","headline":"titular de cero riesgo, máx 5 palabras","accent":"1 palabra","sub":"frase, máx 50 chars","b1":"garantía concreta máx 24 chars","b2":"sin riesgo máx 24 chars","b3":"ventaja máx 24 chars","cta":"2-3 palabras","badge":"30 días"`,
  curiosity: `"eyebrow":"2-3 palabras intrigantes","headline":"gancho de curiosidad, máx 5 palabras","accent":"1 palabra","sub":"pista, máx 50 chars","b1":"pista misteriosa máx 26 chars","b2":"dato sorprendente máx 26 chars","b3":"revelación parcial máx 26 chars","cta":"2-3 palabras","badge":"Descubre"`,
  price: `"eyebrow":"OFERTA 2-3 palabras","headline":"titular de valor, máx 5 palabras","accent":"1 palabra","sub":"frase de valor, máx 50 chars","b1":"✓ incluido máx 18 chars","b2":"✓ incluido máx 18 chars","b3":"✓ incluido máx 18 chars","cta":"2-3 palabras","badge":"Oferta"`,
  social_proof: `"banner":"prueba social con número, ej '+12.000 clientes'","headline":"titular, máx 4 palabras","accent":"1 palabra","t1name":"Nombre R.","t1text":"testimonio con resultado, máx 64 chars","t2name":"Otro N.","t2text":"testimonio concreto, máx 64 chars","cta":"2-3 palabras"`,
  objection: `"headline":"titular que desarma la duda, máx 5 palabras","accent":"1 palabra","sub":"frase, máx 50 chars","p1":"duda máx 24 chars","p2":"duda máx 24 chars","p3":"duda máx 24 chars","s1":"respuesta máx 24 chars","s2":"respuesta máx 24 chars","s3":"respuesta máx 24 chars","cta":"2-3 palabras"`,
  transformation: `"headline":"titular del cambio, máx 4 palabras","accent":"1 palabra","before":"estado ANTES, máx 24 chars","after":"estado DESPUÉS, máx 24 chars","timeframe":"ej '4 semanas'","cta":"2-3 palabras","count":"prueba social con número, ej 'Únete a +8.000 clientes felices'"`,
  comparison: `"headline":"titular comparativo, máx 4 palabras","accent":"1 palabra","themLabel":"1-2 palabras ej 'OTROS'","usLabel":"1-2 palabras ej 'NOSOTROS'","b1":"contra ellos máx 22 chars","b2":"contra ellos máx 22 chars","a1":"a favor nuestro máx 22 chars","a2":"a favor nuestro máx 22 chars","cta":"2-3 palabras","count":"prueba social con número, ej 'Únete a +8.000 clientes felices'"`,
};
// Campos extra para el layout estilo SaleAds (burbujas de chat + chips + social)
const SALEADS_EXTRA = `,"chip1":"1 palabra clave del beneficio","chip2":"1 palabra distinta","chip3":"1 palabra distinta","t1name":"Nombre A.","t1text":"testimonio corto y creíble con resultado concreto y 1 emoji, máx 58 chars","t2name":"Otro N.","t2text":"testimonio corto distinto con 1 emoji, máx 58 chars","count":"prueba social con número, ej 'Únete a +12.000 clientes felices'"`;

async function genCopy(angle, ctx) {
  let fields = COPY_FIELDS[angle] || COPY_FIELDS.desire;
  if ((ARCHETYPE[angle] || 'saleads') === 'saleads') fields += SALEADS_EXTRA;
  try {
    return await genText(
`Eres el mejor copywriter de respuesta directa de Latinoamérica. Anuncio de Facebook/Instagram en español.
PRODUCTO Y DESCRIPCIÓN REAL (única fuente de beneficios — PROHIBIDO inventar beneficios/ingredientes fuera de esto):
${ctx}
Ángulo: ${ANGLE_LABELS[angle]}.
Devuelve SOLO un JSON válido con EXACTAMENTE estas claves:
{ ${fields} }
Reglas: español impecable con tildes; específico, emocional, sin clichés; respeta los límites de caracteres; titulares sin palabras repetidas; el titular en formato de oración normal (NO Cada Palabra Con Mayúscula inicial); si el titular es pregunta lleva SIEMPRE signos de apertura y cierre (¿...?).
IMPORTANTE: el campo "accent" (si existe) DEBE ser UNA palabra que aparezca EXACTAMENTE escrita dentro de "headline" (misma palabra, mismas tildes), para poder resaltarla. No inventes una palabra que no esté en el titular.`);
  } catch {
    return null;
  }
}

// ─── arquetipos de diseño (HTML/CSS) ──────────────────────────────────────────
const HEAD = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Poppins:wght@600;700;800&family=Manrope:wght@500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">`;

function baseCss(W, H, ACCENT) {
  return `*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;}
  html,body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Manrope',sans-serif;}
  .stage{position:relative;width:${W}px;height:${H}px;}
  .photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .chip{display:inline-flex;align-items:center;gap:10px;padding:12px 22px;border-radius:100px;
    background:rgba(255,255,255,0.14);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.25);color:#fff;font-weight:700;font-size:24px;}
  .cta{display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:22px 56px;border-radius:100px;font-weight:800;font-size:34px;color:#fff;
    background:linear-gradient(135deg,${ACCENT},${rgba(ACCENT,0.78)});box-shadow:0 16px 40px ${rgba(ACCENT,0.45)};}`;
}

function productLayer(productB64, css) {
  return productB64 ? `<img class="product" style="${css}" src="data:image/png;base64,${productB64}"/>` : '';
}

// ─── skins: 5 tratamientos visuales (variación REAL de diseño por creativo) ───
// Un skin cambia tipografía del titular, resaltado de la palabra accent, estilo
// del CTA y de las tarjetas/paneles. El fondo fotográfico reserva las mismas
// zonas limpias, así que cualquier skin encaja sobre cualquier escena.
const SKINS = [
  { id: 'classic', hFont: "'Poppins',sans-serif",       hWeight: 800, hTransform: 'none',      hSpacing: '-1px',   hScale: 1.0,  hLine: 1.02, accent: 'color',     cta: 'gradient', card: 'glass' },
  { id: 'impact',  hFont: "'Anton',sans-serif",         hWeight: 400, hTransform: 'uppercase', hSpacing: '0px',    hScale: 1.18, hLine: 0.94, accent: 'highlight', cta: 'solid',    card: 'solid' },
  { id: 'poster',  hFont: "'Bebas Neue',sans-serif",    hWeight: 400, hTransform: 'uppercase', hSpacing: '2px',    hScale: 1.28, hLine: 0.92, accent: 'underline', cta: 'white',    card: 'outline' },
  { id: 'bold',    hFont: "'Archivo Black',sans-serif", hWeight: 400, hTransform: 'uppercase', hSpacing: '-1px',   hScale: 0.86, hLine: 1.0,  accent: 'color',     cta: 'solid',    card: 'solid' },
  { id: 'clean',   hFont: "'Space Grotesk',sans-serif", hWeight: 700, hTransform: 'none',      hSpacing: '-0.5px', hScale: 0.95, hLine: 1.04, accent: 'highlight', cta: 'gradient', card: 'glass' },
];
const pickSkin = (skinId, skinIndex) =>
  SKINS.find(s => s.id === skinId) || SKINS[Math.abs(skinIndex || 0) % SKINS.length];

function skinCss(skin, ACCENT) {
  const ac = skin.accent === 'highlight'
    ? `background:${ACCENT};color:#fff;display:inline-block;line-height:1.04;padding:0 0.14em 0.04em;border-radius:0.12em;vertical-align:baseline;`
    : skin.accent === 'underline'
      ? `color:#fff;box-shadow:inset 0 -0.16em 0 0 ${ACCENT};`
      : `color:${ACCENT};`;
  const cta = skin.cta === 'solid'
    ? `border-radius:16px;background:${ACCENT};box-shadow:0 14px 36px ${rgba(ACCENT, 0.4)};`
    : skin.cta === 'white'
      ? `border-radius:100px;background:#fff;color:#12101c;box-shadow:0 16px 40px rgba(0,0,0,0.4);`
      : `border-radius:100px;background:linear-gradient(135deg,${ACCENT},${rgba(ACCENT, 0.78)});box-shadow:0 16px 40px ${rgba(ACCENT, 0.45)};`;
  const card = skin.card === 'solid'
    ? `background:rgba(15,14,22,0.92);border:1px solid rgba(255,255,255,0.09);`
    : skin.card === 'outline'
      ? `background:rgba(10,8,16,0.42);border:2px solid rgba(255,255,255,0.4);backdrop-filter:blur(8px);`
      : `background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);backdrop-filter:blur(18px);`;
  return {
    hCss: `font-family:${skin.hFont};font-weight:${skin.hWeight};text-transform:${skin.hTransform};letter-spacing:${skin.hSpacing};line-height:${skin.hLine};`,
    hSize: (base) => Math.round(base * skin.hScale),
    acRule: `.headline .ac,.head .ac{${ac}}`,
    ctaRule: `.cta{${cta}}`,
    cardCss: card,
  };
}

// Arquetipo SPOTLIGHT: escena + scrim + eyebrow + headline + sub + bullets + CTA + badge
function buildSpotlight(angle, copy, sceneB64, productB64, ACCENT, W, H) {
  const c = copy || {};
  const wrapAccent = (h, a) => a ? String(h || '').replace(new RegExp(`(${String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<span class="ac">$1</span>') : (h || '');
  const cross = crossSvg('#ff7a7a', 26), check = checkSvg(ACCENT, 26);
  const icon = (angle === 'pain') ? cross : check;
  const bullets = ['b1', 'b2', 'b3'].filter(k => c[k]).map(k => `<div class="ben">${icon}<span>${c[k]}</span></div>`).join('');
  const topBar = (angle === 'urgency' || angle === 'price')
    ? `<div class="urgbar">${c.badge || c.eyebrow || 'OFERTA LIMITADA'}</div>` : '';
  const seal = (angle === 'guarantee') ? `<div class="seal">${shieldSvg('#fff', 54)}<span>${c.badge || '30 días'}</span></div>` : '';
  return `${HEAD}<style>${baseCss(W, H, ACCENT)}
    .scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,6,14,0.95) 0%,rgba(8,6,14,0.7) 22%,rgba(8,6,14,0.15) 48%,rgba(8,6,14,0) 66%);}
    .scrimtop{position:absolute;top:0;left:0;right:0;height:26%;background:linear-gradient(to bottom,rgba(8,6,14,0.6),rgba(8,6,14,0));}
    .toprow{position:absolute;top:46px;left:54px;right:54px;display:flex;justify-content:space-between;align-items:flex-start;z-index:5;}
    .urgbar{display:inline-block;padding:12px 26px;border-radius:12px;background:${ACCENT};color:#fff;font-weight:800;font-size:26px;letter-spacing:.5px;text-transform:uppercase;}
    .badge{padding:10px 20px;border-radius:100px;background:rgba(255,255,255,0.16);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.3);color:#fff;font-weight:700;font-size:22px;}
    .seal{position:absolute;top:120px;right:54px;z-index:6;display:flex;flex-direction:column;align-items:center;gap:6px;color:#fff;font-weight:800;font-size:24px;}
    .product{position:absolute;z-index:4;filter:drop-shadow(0 30px 45px rgba(0,0,0,0.55));}
    .block{position:absolute;left:54px;right:54px;bottom:54px;z-index:6;}
    .eyebrow{display:inline-block;color:${ACCENT};font-weight:800;font-size:25px;letter-spacing:4px;text-transform:uppercase;margin-bottom:14px;}
    .headline{font-family:'Anton';color:#fff;font-size:104px;line-height:0.94;text-transform:uppercase;}
    .headline .ac{color:${ACCENT};}
    .sub{color:rgba(255,255,255,0.92);font-weight:600;font-size:32px;margin-top:18px;max-width:84%;line-height:1.25;}
    .bens{margin-top:26px;display:flex;flex-direction:column;gap:14px;}
    .ben{display:flex;align-items:center;gap:14px;color:#fff;font-weight:700;font-size:30px;}
    .ctarow{display:flex;align-items:center;gap:22px;margin-top:30px;}
  </style></head><body><div class="stage">
    <img class="photo" src="data:image/png;base64,${sceneB64}"/>
    <div class="scrimtop"></div><div class="scrim"></div>
    <div class="toprow"><div>${topBar}</div>${c.badge && !topBar && angle !== 'guarantee' ? `<div class="badge">${c.badge}</div>` : '<div></div>'}</div>
    ${seal}
    <div class="block">
      ${c.eyebrow && angle !== 'urgency' && angle !== 'price' ? `<span class="eyebrow">${c.eyebrow}</span>` : ''}
      <div class="headline">${wrapAccent(c.headline, c.accent)}</div>
      ${c.sub ? `<div class="sub">${c.sub}</div>` : ''}
      <div class="bens">${bullets}</div>
      <div class="ctarow"><div class="cta">${c.cta || 'Lo quiero'} ${arrowSvg(28)}</div></div>
    </div>
  </div></body></html>`;
}

// Arquetipo SPLIT (antes/después · ellos/nosotros) — estilo SaleAds: titular
// serif con palabra dorada, captions tipo burbuja con ✗/✓, estrellas doradas
// + contador social (sin botón CTA; Meta pone el suyo).
function buildSplit(angle, copy, scenes, productB64, ACCENT, W, H, skin) {
  const c = copy || {};
  const fs = H / 1350;
  const px = (n) => Math.round(n * fs);
  const isTrans = angle === 'transformation';
  const lLabel = isTrans ? 'Antes' : (c.themLabel || 'Otros');
  const rLabel = isTrans ? `Después${c.timeframe ? ' · ' + c.timeframe : ''}` : (c.usLabel || 'Nosotros');
  const capL = isTrans ? c.before : [c.b1, c.b2].filter(Boolean).join(' · ');
  const capR = isTrans ? c.after : [c.a1, c.a2].filter(Boolean).join(' · ');
  const wrapAccent = (h, a) => a ? String(h || '').replace(new RegExp(`(${String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<span class="ac">$1</span>') : (h || '');
  return `${HEAD}<style>${baseCss(W, H, ACCENT)}
    .half{position:absolute;top:0;height:100%;width:50%;overflow:hidden;}
    .half.l{left:0;} .half.r{right:0;}
    .half img{width:100%;height:100%;object-fit:cover;}
    .half.l img{filter:saturate(0.45) brightness(0.72);}
    .divider{position:absolute;left:50%;top:0;transform:translateX(-50%);width:5px;height:100%;background:rgba(255,255,255,0.92);z-index:3;}
    .arrow{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);z-index:5;width:${px(88)}px;height:${px(88)}px;border-radius:50%;background:${ACCENT};display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 14px 40px rgba(0,0,0,0.5);}
    .scrimtop{position:absolute;top:0;left:0;right:0;height:30%;background:linear-gradient(to bottom,rgba(8,6,14,0.9),rgba(8,6,14,0));z-index:2;}
    .scrimbot{position:absolute;bottom:0;left:0;right:0;height:32%;background:linear-gradient(to top,rgba(8,6,14,0.92),rgba(8,6,14,0));z-index:2;}
    .head{position:absolute;top:${px(48)}px;left:40px;right:40px;text-align:center;z-index:6;font-family:'Playfair Display',serif;font-weight:800;color:#fff;font-size:${px(80)}px;line-height:1.05;letter-spacing:-1px;text-shadow:0 4px 26px rgba(0,0,0,0.6);}
    .head .ac{color:${GOLD};font-style:italic;}
    .labels{position:absolute;top:${Math.round(H * 0.185)}px;left:0;right:0;display:flex;justify-content:space-between;padding:0 ${px(56)}px;z-index:6;}
    .lbl{padding:${px(11)}px ${px(30)}px;border-radius:100px;font-weight:800;font-size:${px(26)}px;text-transform:uppercase;letter-spacing:.5px;}
    .lbl.l{background:rgba(16,14,22,0.85);color:#fff;border:1px solid rgba(255,255,255,0.25);}
    .lbl.r{background:${GOLD};color:#221a08;}
    .caps{position:absolute;bottom:${Math.round(H * 0.115)}px;left:0;right:0;display:flex;justify-content:space-between;padding:0 ${px(40)}px;gap:${px(20)}px;z-index:6;}
    .cap{width:47%;display:flex;align-items:center;gap:${px(12)}px;padding:${px(16)}px ${px(20)}px;border-radius:18px;font-weight:700;font-size:${px(24)}px;line-height:1.2;}
    .cap.l{background:rgba(18,15,26,0.78);border:1px solid rgba(255,255,255,0.16);color:rgba(255,255,255,0.92);}
    .cap.r{background:rgba(255,255,255,0.96);color:#191325;box-shadow:0 12px 30px rgba(0,0,0,0.35);}
    .social{position:absolute;bottom:${px(40)}px;left:0;right:0;text-align:center;z-index:6;display:flex;flex-direction:column;align-items:center;gap:${px(8)}px;}
    .count{color:rgba(255,255,255,0.95);font-weight:700;font-size:${px(26)}px;text-shadow:0 2px 10px rgba(0,0,0,0.6);}
  </style></head><body><div class="stage">
    <div class="half l"><img src="data:image/png;base64,${scenes[0]}"/></div>
    <div class="half r"><img src="data:image/png;base64,${scenes[1] || scenes[0]}"/></div>
    <div class="divider"></div><div class="arrow">${arrowSvg(px(38))}</div>
    <div class="scrimtop"></div><div class="scrimbot"></div>
    <div class="head">${wrapAccent(c.headline, c.accent)}</div>
    <div class="labels"><div class="lbl l">${lLabel}</div><div class="lbl r">${rLabel}</div></div>
    <div class="caps">
      <div class="cap l">${crossSvg('#ff8fa8', px(24))}<span>${capL || ''}</span></div>
      <div class="cap r">${checkSvg('#12a150', px(24))}<span>${capR || ''}</span></div>
    </div>
    <div class="social">${goldStars(px(30))}<div class="count">${c.count || ''}</div></div>
  </div></body></html>`;
}

// Arquetipo TESTIMONIOS (social_proof)
function buildTestimonials(copy, sceneB64, productB64, ACCENT, W, H, skin) {
  const c = copy || {};
  const S = skinCss(skin, ACCENT);
  const wrapAccent = (h, a) => a ? String(h || '').replace(new RegExp(`(${String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<span class="ac">$1</span>') : (h || '');
  const card = (n, t) => n ? `<div class="tcard"><div class="th"><div class="av">${(n || '?')[0]}</div><b>${n}</b><span class="ts">${starsSvg(ACCENT, 22)}</span></div><div class="tt">"${t || ''}"</div></div>` : '';
  return `${HEAD}<style>${baseCss(W, H, ACCENT)}
    .scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,6,14,0.96) 0%,rgba(8,6,14,0.85) 32%,rgba(8,6,14,0.3) 56%,rgba(8,6,14,0.1) 72%);}
    .banner{position:absolute;top:0;left:0;right:0;height:90px;background:${ACCENT};display:flex;align-items:center;justify-content:center;gap:14px;z-index:5;color:#fff;font-weight:800;font-size:32px;}
    .head{position:absolute;top:140px;left:54px;right:54px;text-align:center;z-index:5;${S.hCss}color:#fff;font-size:${S.hSize(78)}px;text-shadow:0 3px 18px rgba(0,0,0,0.5);}
    ${S.acRule} ${S.ctaRule}
    .cards{position:absolute;bottom:160px;left:54px;right:54px;display:flex;flex-direction:column;gap:20px;z-index:5;}
    .tcard{padding:24px 28px;border-radius:20px;${S.cardCss}}
    .th{display:flex;align-items:center;gap:14px;margin-bottom:10px;}
    .av{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,${ACCENT},${rgba(ACCENT, 0.6)});display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:24px;}
    .th b{color:#fff;font-size:27px;} .ts{margin-left:auto;}
    .tt{color:rgba(255,255,255,0.92);font-weight:500;font-size:27px;line-height:1.25;}
    .cta{position:absolute;bottom:48px;left:54px;right:54px;z-index:5;}
  </style></head><body><div class="stage">
    <img class="photo" src="data:image/png;base64,${sceneB64}"/><div class="scrim"></div>
    <div class="banner">${starsSvg('#fff', 30)} ${c.banner || ''}</div>
    <div class="head">${wrapAccent(c.headline, c.accent)}</div>
    <div class="cards">${card(c.t1name, c.t1text)}${card(c.t2name, c.t2text)}</div>
    <div class="cta">${c.cta || 'Quiero probarlo'} ${arrowSvg(28)}</div>
  </div></body></html>`;
}

// Arquetipo OBJECIÓN (✗ dudas vs ✓ realidad)
function buildObjection(copy, sceneB64, productB64, ACCENT, W, H, skin) {
  const c = copy || {};
  const S = skinCss(skin, ACCENT);
  const wrapAccent = (h, a) => a ? String(h || '').replace(new RegExp(`(${String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<span class="ac">$1</span>') : (h || '');
  const dudas = ['p1', 'p2', 'p3'].filter(k => c[k]).map(k => `<div class="li">${crossSvg('#ff8a8a', 24)}<span>${c[k]}</span></div>`).join('');
  const real = ['s1', 's2', 's3'].filter(k => c[k]).map(k => `<div class="li">${checkSvg('#fff', 24)}<span>${c[k]}</span></div>`).join('');
  return `${HEAD}<style>${baseCss(W, H, ACCENT)}
    .scrimtop{position:absolute;top:0;left:0;right:0;height:32%;background:linear-gradient(to bottom,rgba(8,6,14,0.88),rgba(8,6,14,0));}
    .scrimbot{position:absolute;bottom:0;left:0;right:0;height:62%;background:linear-gradient(to top,rgba(8,6,14,0.96) 40%,rgba(8,6,14,0));}
    .head{position:absolute;top:56px;left:54px;right:54px;text-align:center;z-index:5;${S.hCss}color:#fff;font-size:${S.hSize(76)}px;text-shadow:0 3px 18px rgba(0,0,0,0.5);}
    ${S.acRule} ${S.ctaRule}
    .sub{position:absolute;top:${Math.round(H * 0.2)}px;left:54px;right:54px;text-align:center;z-index:5;color:rgba(255,255,255,0.9);font-weight:600;font-size:30px;}
    .panels{position:absolute;bottom:150px;left:54px;right:54px;display:flex;gap:20px;z-index:5;}
    .panel{flex:1;padding:26px 24px;border-radius:20px;}
    .panel.l{${S.cardCss}}
    .panel.r{background:${rgba(ACCENT, 0.9)};}
    .ph{font-weight:800;font-size:26px;margin-bottom:16px;text-transform:uppercase;}
    .panel.l .ph{color:${ACCENT};} .panel.r .ph{color:#fff;}
    .li{display:flex;align-items:center;gap:12px;color:#fff;font-weight:700;font-size:25px;margin-bottom:12px;line-height:1.15;}
    .cta{position:absolute;bottom:48px;left:54px;right:54px;z-index:5;}
  </style></head><body><div class="stage">
    <img class="photo" src="data:image/png;base64,${sceneB64}"/>
    <div class="scrimtop"></div><div class="scrimbot"></div>
    <div class="head">${wrapAccent(c.headline, c.accent)}</div>
    ${c.sub ? `<div class="sub">${c.sub}</div>` : ''}
    <div class="panels">
      <div class="panel l"><div class="ph">¿Lo dudas?</div>${dudas}</div>
      <div class="panel r"><div class="ph">La realidad</div>${real}</div>
    </div>
    <div class="cta">${c.cta || 'Saber más'} ${arrowSvg(28)}</div>
  </div></body></html>`;
}

// Arquetipo PRODUCT-HERO: el producto (ya integrado en la escena) es la estrella.
// Titular arriba, beneficios GRANDES a la izquierda, CTA abajo, badge por ángulo.
function buildProductHero(angle, copy, sceneB64, ACCENT, W, H, skin) {
  const c = copy || {};
  const S = skinCss(skin, ACCENT);
  const wrapAccent = (h, a) => a ? String(h || '').replace(new RegExp(`(${String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<span class="ac">$1</span>') : (h || '');
  const isPain = angle === 'pain';
  const icon = isPain ? crossSvg('#fff', 24) : checkSvg('#fff', 26);
  const bullets = ['b1', 'b2', 'b3'].filter(k => c[k]).map(k => `<div class="ben"><span class="ic">${icon}</span><span>${c[k]}</span></div>`).join('');
  const urg = (angle === 'urgency' || angle === 'price') ? `<div class="urg">${c.badge || c.eyebrow || 'OFERTA LIMITADA'}</div>` : '';
  const guar = (angle === 'guarantee') ? `<div class="urg" style="display:inline-flex;align-items:center;gap:10px;">${shieldSvg('#fff', 26)} GARANTÍA ${c.badge || '30 DÍAS'}</div>` : '';
  const topLeft = urg || guar;
  const badge = (c.badge && !topLeft) ? `<div class="badge">${c.badge}</div>` : '<div></div>';
  return `${HEAD}<style>${baseCss(W, H, ACCENT)}
    .scrimT{position:absolute;top:0;left:0;right:0;height:42%;background:linear-gradient(to bottom,rgba(8,6,14,0.85) 0%,rgba(8,6,14,0.25) 55%,rgba(8,6,14,0) 100%);}
    .scrimL{position:absolute;inset:0;background:linear-gradient(to right,rgba(8,6,14,0.8) 0%,rgba(8,6,14,0.15) 40%,rgba(8,6,14,0) 62%);}
    .scrimB{position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(to top,rgba(8,6,14,0.95) 28%,rgba(8,6,14,0));}
    .toprow{position:absolute;top:44px;left:54px;right:54px;display:flex;justify-content:space-between;align-items:flex-start;z-index:6;}
    .urg{padding:12px 26px;border-radius:12px;background:${ACCENT};color:#fff;font-weight:800;font-size:26px;text-transform:uppercase;letter-spacing:.5px;}
    .badge{padding:10px 22px;border-radius:100px;background:rgba(255,255,255,0.16);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.3);color:#fff;font-weight:700;font-size:22px;}
    .headwrap{position:absolute;top:108px;left:50px;right:50px;text-align:center;z-index:6;}
    .eyebrow{display:inline-block;color:${ACCENT};font-weight:800;font-size:25px;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;}
    .head{${S.hCss}color:#fff;font-size:${S.hSize(72)}px;text-shadow:0 4px 24px rgba(0,0,0,0.55);}
    ${S.acRule} ${S.ctaRule}
    .sub{color:rgba(255,255,255,0.92);font-weight:600;font-size:30px;margin-top:16px;}
    .bens{position:absolute;left:54px;bottom:200px;z-index:6;display:flex;flex-direction:column;gap:20px;max-width:46%;}
    .ben{display:flex;align-items:center;gap:16px;color:#fff;font-weight:800;font-size:33px;text-shadow:0 2px 12px rgba(0,0,0,0.75);line-height:1.1;}
    .ben .ic{width:50px;height:50px;border-radius:50%;background:${isPain ? '#e0466b' : ACCENT};display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:0 6px 16px ${isPain ? 'rgba(224,70,107,0.5)' : rgba(ACCENT, 0.5)};}
    .footer{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:center;padding-bottom:48px;z-index:7;}
    .footer .cta{font-size:36px;padding:24px 66px;}
  </style></head><body><div class="stage">
    <img class="photo" src="data:image/png;base64,${sceneB64}"/>
    <div class="scrimT"></div><div class="scrimL"></div><div class="scrimB"></div>
    <div class="toprow"><div>${topLeft}</div>${badge}</div>
    <div class="headwrap">
      ${c.eyebrow && !urg ? `<span class="eyebrow">${c.eyebrow}</span>` : ''}
      <div class="head">${wrapAccent(c.headline, c.accent)}</div>
      ${c.sub ? `<div class="sub">${c.sub}</div>` : ''}
    </div>
    <div class="bens">${bullets}</div>
    <div class="footer"><div class="cta">${c.cta || 'Lo quiero'} ${arrowSvg(30)}</div></div>
  </div></body></html>`;
}

const ARCHETYPE = {
  pain: 'saleads', desire: 'saleads', urgency: 'saleads', authority: 'saleads',
  guarantee: 'saleads', curiosity: 'saleads', price: 'saleads',
  transformation: 'split', comparison: 'split', social_proof: 'testimonials', objection: 'objection',
};

// Arquetipo SALEADS (réplica del estilo SaleAds.ai): titular serif con palabra
// dorada, chips glass, burbujas de chat con testimonios alrededor del producto,
// beneficios "+" abajo, estrellas doradas + contador social. SIN botón CTA
// (Meta pone el suyo, igual que en los ads reales de SaleAds).
const GOLD = '#FFD166';
const sparkleSvg = (color, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 1l2.4 8.6L23 12l-8.6 2.4L12 23l-2.4-8.6L1 12l8.6-2.4L12 1z"/></svg>`;
const goldStars = (size = 34) => {
  const one = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${GOLD}"><path d="${STAR_PATH}"/></svg>`;
  return `<span style="display:inline-flex;gap:8px;">${one.repeat(5)}</span>`;
};

function buildSaleAds(angle, copy, sceneB64, ACCENT, W, H, variant = 0) {
  const c = copy || {};
  // Factor de escala: las medidas están afinadas para 1080x1350; en 1:1 y 16:9
  // todo se encoge proporcionalmente para que no choque con el producto.
  const fs = H / 1350;
  const px = (n) => Math.round(n * fs);
  const wrapAccent = (h, a) => a ? String(h || '').replace(new RegExp(`(${String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<span class="ac">$1</span>') : (h || '');
  const chips = ['chip1', 'chip2', 'chip3'].filter(k => c[k]).map(k =>
    `<span class="chip2">${sparkleSvg(GOLD, 17)}<span>${c[k]}</span></span>`).join('<span class="chipsep">|</span>');
  // Prueba social: rota el formato entre variaciones (como los ads reales de
  // SaleAds); en dolor/curiosidad no van testimonios (romperían el tono).
  const isPain = angle === 'pain' || angle === 'curiosity';
  const proof = isPain ? 'none' : ['sides', 'stacked', 'rows'][Math.abs(variant) % 3];
  const bubble = (n, t, cls) => (n && t) ? `
    <div class="bub ${cls}">
      <div class="bh"><span class="bav">${(n || '?')[0]}</span><b>${n}</b></div>
      <div class="bt">${t}</div>
    </div>` : '';
  const bubbles = proof === 'sides' ? bubble(c.t1name, c.t1text, 'l b1') + bubble(c.t2name, c.t2text, 'r b2')
    : proof === 'stacked' ? bubble(c.t1name, c.t1text, 'l b1') + bubble(c.t2name, c.t2text, 'l b3')
    : '';
  const row = (n, t) => (n && t) ? `<div class="row"><span class="bav">${(n || '?')[0]}</span><b>${n}</b><span class="rtxt">${t}</span></div>` : '';
  const rows = proof === 'rows' ? `<div class="rows">${row(c.t1name, c.t1text)}${row(c.t2name, c.t2text)}</div>` : '';
  const mark = isPain ? `<span class="psign">${crossSvg('#ff8fa8', Math.round(26 * fs))}</span>` : `<span class="psign">+</span>`;
  const bens = proof === 'rows' ? '' : ['b1', 'b2', 'b3'].filter(k => c[k]).map(k =>
    `<span class="plus">${mark}${String(c[k]).replace(/^[✓✔✗✘xX+\-•\s]+/, '')}</span>`).join('');
  const pill = (angle === 'price' || angle === 'urgency') && c.badge
    ? `<div class="pill">${c.badge}</div>`
    : (angle === 'guarantee' && c.badge ? `<div class="pill">${shieldSvg('#1c1630', 22)} Garantía ${c.badge}</div>` : '');
  return `${HEAD}<style>${baseCss(W, H, ACCENT)}
    .scrimT{position:absolute;top:0;left:0;right:0;height:34%;background:linear-gradient(to bottom,rgba(10,6,20,0.62) 0%,rgba(10,6,20,0.18) 62%,rgba(10,6,20,0) 100%);}
    .scrimB{position:absolute;bottom:0;left:0;right:0;height:26%;background:linear-gradient(to top,rgba(10,6,20,0.72) 12%,rgba(10,6,20,0) 100%);}
    .top{position:absolute;top:${px(54)}px;left:44px;right:44px;text-align:center;z-index:6;}
    .head{font-family:'Playfair Display',serif;font-weight:800;color:#fff;font-size:${px(86)}px;line-height:1.04;letter-spacing:-1px;text-shadow:0 4px 26px rgba(0,0,0,0.5);}
    .head .ac{color:${GOLD};font-style:italic;}
    .sub{color:rgba(255,255,255,0.95);font-weight:600;font-size:${px(31)}px;margin-top:${px(14)}px;text-shadow:0 2px 10px rgba(0,0,0,0.5);}
    .chips{display:flex;justify-content:center;align-items:center;gap:${px(16)}px;margin-top:${px(20)}px;}
    .chip2{display:inline-flex;align-items:center;gap:9px;padding:${px(10)}px ${px(22)}px;border-radius:100px;background:rgba(12,8,24,0.45);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.22);color:#fff;font-weight:700;font-size:${px(23)}px;}
    .chipsep{color:rgba(255,255,255,0.35);font-size:${px(22)}px;}
    .pill{display:inline-flex;align-items:center;gap:8px;margin-top:${px(18)}px;padding:${px(11)}px ${px(30)}px;border-radius:100px;background:#fff;color:#1c1630;font-weight:800;font-size:${px(25)}px;box-shadow:0 10px 30px rgba(0,0,0,0.35);}
    .bub{position:absolute;z-index:6;max-width:${px(340)}px;padding:${px(16)}px ${px(20)}px;border-radius:20px;background:rgba(255,255,255,0.96);box-shadow:0 14px 34px rgba(0,0,0,0.35);}
    .bub.l{left:40px;border-bottom-left-radius:5px;}
    .bub.r{right:40px;border-bottom-right-radius:5px;}
    .b1{top:${Math.round(H * 0.30)}px;} .b2{top:${Math.round(H * 0.47)}px;} .b3{top:${Math.round(H * 0.455)}px;}
    .rows{position:absolute;bottom:${Math.round(H * 0.105)}px;left:44px;right:44px;display:flex;flex-direction:column;gap:${px(14)}px;z-index:6;}
    .row{display:flex;align-items:center;gap:14px;padding:${px(15)}px ${px(20)}px;border-radius:16px;background:rgba(12,8,20,0.62);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.14);}
    .row b{color:#fff;font-size:${px(23)}px;flex:0 0 auto;}
    .rtxt{color:rgba(255,255,255,0.92);font-weight:600;font-size:${px(22)}px;line-height:1.2;}
    .bh{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
    .bav{width:${px(40)}px;height:${px(40)}px;border-radius:50%;background:linear-gradient(135deg,${ACCENT},${rgba(ACCENT, 0.55)});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:${px(20)}px;flex:0 0 auto;}
    .bh b{color:#191325;font-size:${px(22)}px;font-weight:800;}
    .bt{color:#2b2438;font-weight:600;font-size:${px(22)}px;line-height:1.25;}
    .plusrow{position:absolute;bottom:${Math.round(H * 0.115)}px;left:40px;right:40px;display:flex;justify-content:center;gap:${px(20)}px ${px(34)}px;flex-wrap:wrap;z-index:6;}
    .plus{display:inline-flex;align-items:center;gap:10px;color:#fff;font-weight:800;font-size:${px(30)}px;text-shadow:0 2px 12px rgba(0,0,0,0.6);white-space:nowrap;}
    .psign{color:${GOLD};font-size:${px(34)}px;font-weight:800;display:inline-flex;align-items:center;}
    .social{position:absolute;bottom:${px(44)}px;left:0;right:0;text-align:center;z-index:6;display:flex;flex-direction:column;align-items:center;gap:${px(10)}px;}
    .count{color:rgba(255,255,255,0.95);font-weight:700;font-size:${px(27)}px;text-shadow:0 2px 10px rgba(0,0,0,0.6);}
  </style></head><body><div class="stage">
    <img class="photo" src="data:image/png;base64,${sceneB64}"/>
    <div class="scrimT"></div><div class="scrimB"></div>
    <div class="top">
      <div class="head">${wrapAccent(c.headline, c.accent)}</div>
      ${c.sub ? `<div class="sub">${c.sub}</div>` : ''}
      ${chips ? `<div class="chips">${chips}</div>` : ''}
      ${pill}
    </div>
    ${bubbles}
    ${rows}
    ${bens ? `<div class="plusrow">${bens}</div>` : ''}
    <div class="social">${goldStars(px(34))}<div class="count">${c.count || ''}</div></div>
  </div></body></html>`;
}

// ─── render Chromium (cross-entorno) ──────────────────────────────────────────
async function launchBrowser() {
  const { chromium } = require('playwright-core');
  const onServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;
  if (onServerless) {
    const sparticuz = require('@sparticuz/chromium');
    return chromium.launch({ args: sparticuz.args, executablePath: await sparticuz.executablePath(), headless: true });
  }
  return chromium.launch({ channel: 'chrome', headless: true });
}
async function renderHtml(html, W, H) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const buf = await page.screenshot({ type: 'png' });
    return sharp(buf).jpeg({ quality: 90 }).toBuffer();
  } finally { await browser.close(); }
}

const DIMS = { square: { W: 1080, H: 1080 }, vertical: { W: 1080, H: 1350 }, horizontal: { W: 1350, H: 1080 } };

function buildHtmlFor(angle, copy, scenes, productB64, accent, W, H, skin, variant = 0) {
  const arch = ARCHETYPE[angle] || 'saleads';
  if (arch === 'split') return buildSplit(angle, copy, scenes, productB64, accent, W, H, skin);
  if (arch === 'testimonials') return buildTestimonials(copy, scenes[0], productB64, accent, W, H, skin);
  if (arch === 'objection') return buildObjection(copy, scenes[0], productB64, accent, W, H, skin);
  if (arch === 'producthero') return buildProductHero(angle, copy, scenes[0], accent, W, H, skin);
  return buildSaleAds(angle, copy, scenes[0], accent, W, H, variant);
}

// Selección automática de ángulos: la IA elige los N con más probabilidad de
// convertir para ESTE producto (el usuario no necesita saber de marketing).
async function pickAngles(productContext, count = 2) {
  const n = Math.min(Math.max(count || 2, 1), 4);
  try {
    const out = await genText(
`Eres un media buyer experto en Facebook/Instagram Ads para e-commerce en Latinoamérica.
PRODUCTO:
${productContext}
Elige los ${n} ángulos de venta con MAYOR probabilidad de producir anuncios ganadores para ESTE producto, entre estas claves: ${Object.keys(ANGLE_LABELS).join(', ')}.
Reglas: usa "price" o "urgency" SOLO si la descripción menciona oferta/descuento/promoción; "guarantee" SOLO si menciona garantía o devolución; diversifica (nada de dos ángulos casi iguales); prioriza lo más fuerte y visual del producto.
Devuelve SOLO un JSON válido: {"angles":["clave1","clave2"]}`, 0.4);
    const list = (out.angles || []).filter(a => ANGLE_LABELS[a]);
    if (list.length) return [...new Set(list)].slice(0, n);
  } catch {}
  return ['desire', 'social_proof'].slice(0, n);
}

// Análisis visual del producto (para grounding del copy y la escena)
async function analyzeProduct(imageB64) {
  try {
    const res = await fetch(TEXT_URL(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: `Analyze this product image. Return a concise factual brief (max 80 words): product name, exact physical type/format, ONLY the text/benefits clearly printed on the label (if unreadable say "No readable claims"), category (pet/beauty/fitness/food/supplement/etc), and packaging visual style. Do NOT invent any health benefit or claim not clearly printed.` },
          { inlineData: { mimeType: 'image/jpeg', data: imageB64 } },
        ] }],
      }),
    });
    const d = await res.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch { return ''; }
}

// Garantiza los campos que la UI/builder/biblioteca esperan (headline,
// primaryText, description, cta), además de los campos por ángulo del template.
function normalizeCopy(c) {
  const copy = { ...c };
  copy.headline = copy.headline || '';
  copy.cta = copy.cta || 'Ver más';
  copy.description = copy.description || copy.sub || copy.after || copy.banner || '';
  copy.primaryText = copy.primaryText || copy.sub
    || [copy.b1, copy.b2, copy.b3, copy.t1text, copy.t2text, copy.after, copy.s1].filter(Boolean).join(' ')
    || copy.headline;
  return copy;
}

// 1) Gemini: copy + escena(s) en paralelo (sin tocar Chromium)
async function prepareCreative({ angle, productContext, primaryColor, productImageBase64, format = 'vertical', existingCopy, adjustmentInstruction, cleanLabel = true, skinIndex = 0, skinId }) {
  const { W, H } = DIMS[format] || DIMS.vertical;
  const accent = primaryColor || '#7C3AED';
  const skin = pickSkin(skinId, skinIndex);
  const productB64 = stripDataUrl(productImageBase64) || null;
  const arch = ARCHETYPE[angle] || 'saleads';
  const adj = adjustmentInstruction ? `\nSCENE ADJUSTMENT: ${adjustmentInstruction}` : '';
  const withProduct = (text) => genImage([{ inlineData: { mimeType: 'image/png', data: productB64 } }, { text }]);

  let sceneTasks;
  if (arch === 'saleads' || arch === 'producthero') {
    // 1 escena: producto como estrella (integrado por Gemini, pre-encuadrado
    // pequeño para que respete la escala del layout)
    const hp = heroScenePrompt(angle, productContext, format, cleanLabel) + adj;
    if (productB64) {
      const padded = padProductImage(productB64, W, H).then(p =>
        genImage([{ inlineData: { mimeType: 'image/jpeg', data: p } }, { text: hp + '\nFRAMING: the input image shows the product at the EXACT size and position it must occupy in the final image (the light-gray area is placeholder background to replace with the scene). Match that framing and scale precisely.' }]));
      sceneTasks = [padded];
    } else {
      sceneTasks = [sceneImage(hp)];
    }
  } else {
    // lifestyle: producto integrado en la escena designada; las demás sin producto
    const prompts = scenePrompts(angle, productContext, format).map(p => p + adj);
    const prodIdx = productB64 ? productSceneIndex(angle) : -1;
    sceneTasks = prompts.map((p, i) =>
      i === prodIdx ? withProduct(p + productIntegrate(cleanLabel)) : sceneImage(productB64 ? p + NO_PRODUCT : p));
  }

  const copyTask = existingCopy ? Promise.resolve(existingCopy) : genCopy(angle, productContext);
  const [rawCopy, ...scenes] = await Promise.all([copyTask, ...sceneTasks]);
  const copy = normalizeCopy(rawCopy || {});
  return { angle, copy, scenes, productB64, accent, W, H, skin, variant: Math.abs(skinIndex || 0), label: ANGLE_LABELS[angle] || angle };
}

// 2) Render con un navegador YA abierto (una página por creativo)
async function renderPrepared(prep, browser) {
  const html = buildHtmlFor(prep.angle, prep.copy, prep.scenes, prep.productB64, prep.accent, prep.W, prep.H, prep.skin, prep.variant);
  const page = await browser.newPage({ viewport: { width: prep.W, height: prep.H }, deviceScaleFactor: 1 });
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const buf = await page.screenshot({ type: 'png' });
    const jpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    return { imageUrl: `data:image/jpeg;base64,${jpeg.toString('base64')}`, angle: prep.angle, label: prep.label, copy: prep.copy, skin: prep.skin.id };
  } finally { await page.close(); }
}

/**
 * Genera un lote de creativos. Gemini en PARALELO, render en SECUENCIA con un
 * solo navegador (seguro para la RAM de Vercel Hobby).
 * jobs: [{ angle, productContext, primaryColor, productImageBase64, format, variation, existingCopy, adjustmentInstruction }]
 * @returns {Promise<{images: Array, errors: string[]}>}
 */
async function generateBatch(jobs) {
  const preps = await Promise.allSettled(jobs.map(j => prepareCreative(j).then(p => ({ p, variation: j.variation ?? 0 }))));
  const ok = preps.filter(r => r.status === 'fulfilled').map(r => r.value);
  const errors = preps.filter(r => r.status === 'rejected').map(r => r.reason?.message || 'prepare error');
  if (!ok.length) return { images: [], errors };

  const browser = await launchBrowser();
  const images = [];
  try {
    for (const { p, variation } of ok) {
      try { images.push({ ...(await renderPrepared(p, browser)), variation }); }
      catch (e) { errors.push(e.message || 'render error'); }
    }
  } finally { await browser.close(); }
  return { images, errors };
}

// Conveniencia: un solo creativo (usado en pruebas locales).
async function generateCreative(opts) {
  const { images } = await generateBatch([{ ...opts, variation: 0 }]);
  if (!images[0]) throw new Error('No se pudo generar el creativo');
  return images[0];
}

module.exports = { generateBatch, generateCreative, analyzeProduct, pickAngles, buildHtmlFor, launchBrowser, ANGLE_LABELS, ARCHETYPE, DIMS, SKINS };
