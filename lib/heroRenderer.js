// Motor de creativos PRODUCT-HERO (estilo SaleAds).
// IA (Gemini) genera la fotografía hero integrando el producto (relighting + props),
// y la capa de diseño se renderiza con Chromium (HTML/CSS) → texto perfecto.
//
// Render cross-entorno:
//   - Vercel/Lambda → @sparticuz/chromium + playwright-core
//   - Local         → playwright-core con Google Chrome del sistema
//
// Exporta generateHeroCreative() → { imageUrl (data URL jpeg), copy }

const sharp = require('sharp');

const W = 1080, H = 1350; // vertical 4:5

const getKey = () => {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error('GEMINI_API_KEY no configurada en el servidor');
  return k;
};
const TEXT_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getKey()}`;
const IMG_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${getKey()}`;

function stripDataUrl(b64) {
  return typeof b64 === 'string' ? b64.replace(/^data:image\/\w+;base64,/, '') : b64;
}
function rgba(hex, a) {
  const n = (hex || '#A855F7').replace('#', '');
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}

// Símbolos como SVG inline — NO dependen de fuentes del sistema (el Chromium de
// Vercel es minimalista y renderiza → y ★ como tofu si se usan como glifos).
const STAR_PATH = 'M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z';
function starsSvg(color, size = 40) {
  const one = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="${STAR_PATH}"/></svg>`;
  return `<span style="display:inline-flex;gap:6px;align-items:center;">${one.repeat(5)}</span>`;
}
function arrowSvg(size = 30) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
}

async function genText(prompt) {
  const res = await fetch(TEXT_URL(), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9 } }),
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

// ── Escena hero: integra el producto (relighting + props), SIN texto ──────────
async function genHeroScene(productB64, description, cleanLabel) {
  const labelRule = cleanLabel
    ? `LABEL: You MAY cleanly REDRAW the product's label so ALL its text is sharp, professional and correctly spelled in Spanish — but keep the SAME brand name, the SAME colors, the SAME overall layout and the SAME illustration/icon. No gibberish, no distorted letters. Keep the bottle/package shape, material color and any dropper identical to the input.`
    : `LABEL: Keep the product's label EXACTLY as in the input — every detail, fully readable, DO NOT redesign, restyle or rewrite it.`;
  const prompt =
`Use the EXACT product from the provided image as the HERO of a premium advertising scene. Keep the product's shape, material/glass color and any dropper EXACTLY as in the input.
${labelRule}
SCENE: cinematic premium gradient studio background whose color palette COMPLEMENTS the product's own branding colors, with a soft radial glow and a dreamy mood that fits: ${description}.
PLACEMENT & SIZE: place the product CENTERED. Its height should be about 50% of the frame and its BASE must sit no lower than 76% of the frame height — leave the bottom 22% clean and empty. Stand it on a subtle glossy reflective surface with a realistic soft contact shadow and a gentle vertical reflection. Relight to match the scene (soft key light + cool rim light) so it looks studio-photographed, not pasted.
PROPS: add a FEW tasteful, subtle props relevant to the product category derived from the description — for pet products, a happy healthy pet softly out of focus in the far background and soft leaves; for beauty, soft petals or water drops; for supplements, clean natural botanical elements. Keep props minimal and premium, never cluttered. Subtle floating bokeh particles.
COMPOSITION: keep the TOP 24% and BOTTOM 22% of the frame clean, darker and uncluttered so text can be added later. Vertical 4:5 framing.
QUALITY: 8K, photorealistic, premium product advertising, dramatic but clean.
STRICT: NO marketing text, NO words, NO extra logos other than the product's own label, NO watermarks, NO duplicate bottles.`;
  return genImage([{ inlineData: { mimeType: 'image/png', data: productB64 } }, { text: prompt }]);
}

async function genCopy(productName, description) {
  try {
    return await genText(
`Director creativo de respuesta directa de Latinoamérica. Producto: ${productName}. Descripción real (única fuente, NO inventes beneficios fuera de esto): ${description}.
Anuncio product-hero. Devuelve SOLO JSON válido:
{
 "headline":"titular potente, máx 6 palabras",
 "accent":"UNA palabra exacta dentro del titular para resaltar",
 "subline":"subtítulo de apoyo, máx 45 chars",
 "pills":["3 etiquetas de 1 palabra"],
 "benefits":["3 beneficios concretos de máx 18 chars c/u"],
 "testimonials":[{"name":"Nombre R.","text":"testimonio creíble con resultado, máx 60 chars"},{"name":"Otro N.","text":"otro testimonio concreto, máx 60 chars"}],
 "rating":"social proof con número, ej '10.000+ clientes felices'",
 "cta":"2-3 palabras"
}
Español impecable con tildes. Específico, sin clichés.`);
  } catch {
    return {
      headline: productName || 'Resultados reales', accent: '', subline: description?.slice(0, 45) || '',
      pills: ['Calidad', 'Premium', 'Real'], benefits: ['Resultado visible', 'Fórmula premium', 'Uso fácil'],
      testimonials: [{ name: 'Cliente', text: 'Excelente producto, lo recomiendo.' }, { name: 'Cliente', text: 'Resultados desde la primera semana.' }],
      rating: '10.000+ clientes felices', cta: 'Lo quiero',
    };
  }
}

function wrapAccent(headline, accent) {
  if (!accent) return headline;
  const re = new RegExp(`(${accent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  return headline.replace(re, '<span class="ac">$1</span>');
}

function buildHTML(copy, heroB64, accent) {
  const ACCENT = accent || '#A855F7';
  const pills = (copy.pills || []).map(p => `<span class="pill">${p}</span>`).join('');
  const benefits = (copy.benefits || []).map(b => `<div class="ben"><span class="plus">+</span>${b}</div>`).join('');
  const t = copy.testimonials || [];
  const bubble = (x, cls) => x ? `<div class="bub ${cls}"><div class="bh"><div class="av">${(x.name || '?')[0]}</div><b>${x.name || ''}</b></div><div class="bt">${x.text || ''}</div></div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Manrope:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;}
  html,body{width:${W}px;height:${H}px;overflow:hidden;font-family:'Manrope',sans-serif;}
  .stage{position:relative;width:${W}px;height:${H}px;}
  .photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .top{position:absolute;top:0;left:0;right:0;height:32%;background:linear-gradient(to bottom,rgba(10,4,20,0.85),rgba(10,4,20,0));}
  .head{position:absolute;top:44px;left:60px;right:60px;text-align:center;z-index:5;
    font-family:'Poppins';font-weight:800;color:#fff;font-size:74px;line-height:1.02;letter-spacing:-1px;text-shadow:0 4px 24px rgba(0,0,0,0.5);}
  .head .ac{color:${ACCENT};}
  .sub{position:absolute;top:205px;left:0;right:0;text-align:center;z-index:5;color:rgba(255,255,255,0.9);font-weight:600;font-size:32px;}
  .pills{position:absolute;top:268px;left:0;right:0;display:flex;justify-content:center;gap:14px;z-index:5;}
  .pill{padding:10px 26px;border-radius:100px;background:rgba(255,255,255,0.14);backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,0.25);color:#fff;font-weight:700;font-size:26px;}
  .bens{position:absolute;left:54px;top:430px;display:flex;flex-direction:column;gap:20px;z-index:5;}
  .ben{display:flex;align-items:center;gap:14px;color:#fff;font-weight:700;font-size:30px;text-shadow:0 2px 10px rgba(0,0,0,0.6);}
  .plus{width:40px;height:40px;border-radius:50%;background:${ACCENT};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px;color:#fff;}
  .bub{position:absolute;width:300px;padding:18px 22px;border-radius:22px;z-index:6;
    background:rgba(255,255,255,0.13);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.22);box-shadow:0 12px 30px rgba(0,0,0,0.35);}
  .bub.b1{right:28px;top:452px;} .bub.b2{right:28px;top:632px;}
  .bh{display:flex;align-items:center;gap:12px;margin-bottom:8px;}
  .av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,${ACCENT},${rgba(ACCENT,0.6)});display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:22px;}
  .bh b{color:#fff;font-size:24px;} .bt{color:rgba(255,255,255,0.92);font-weight:500;font-size:24px;line-height:1.25;}
  .footer{position:absolute;bottom:0;left:0;right:0;height:310px;z-index:6;
    display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:18px;padding-bottom:44px;
    background:linear-gradient(to top,rgba(10,4,20,0.98) 50%,rgba(10,4,20,0.82) 74%,rgba(10,4,20,0) 100%);}
  .stars{display:flex;}
  .social{color:rgba(255,255,255,0.92);font-weight:600;font-size:30px;}
  .cta{display:inline-flex;align-items:center;gap:12px;margin-top:6px;padding:22px 60px;border-radius:100px;font-weight:800;font-size:34px;color:#fff;
    background:linear-gradient(135deg,${ACCENT},${rgba(ACCENT,0.78)});box-shadow:0 16px 40px ${rgba(ACCENT,0.5)};}
</style></head><body><div class="stage">
  <img class="photo" src="data:image/png;base64,${heroB64}"/>
  <div class="top"></div>
  <div class="head">${wrapAccent(copy.headline || '', copy.accent)}</div>
  <div class="sub">${copy.subline || ''}</div>
  <div class="pills">${pills}</div>
  <div class="bens">${benefits}</div>
  ${bubble(t[0], 'b1')}${bubble(t[1], 'b2')}
  <div class="footer">
    <div class="stars">${starsSvg(ACCENT, 40)}</div>
    <div class="social">Únete a ${copy.rating || ''}</div>
    <div class="cta">${copy.cta || 'Lo quiero'} ${arrowSvg(30)}</div>
  </div>
</div></body></html>`;
}

// ── Lanzar Chromium según entorno ─────────────────────────────────────────────
async function launchBrowser() {
  const { chromium } = require('playwright-core');
  const onServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;
  if (onServerless) {
    const sparticuz = require('@sparticuz/chromium');
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }
  // Local: usa Google Chrome del sistema (sin descargar navegadores)
  return chromium.launch({ channel: 'chrome', headless: true });
}

async function renderHtml(html) {
  const browser = await launchBrowser();
  try {
    // deviceScaleFactor 1 → render nativo 1080x1350: mucho menos consumo de RAM
    // (clave para caber en los 1024 MB del plan Hobby de Vercel).
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const buf = await page.screenshot({ type: 'png' });
    return sharp(buf).jpeg({ quality: 90 }).toBuffer();
  } finally {
    await browser.close();
  }
}

/**
 * @param {object} p
 * @param {string} p.productName
 * @param {string} p.description
 * @param {string} p.primaryColor   hex (#RRGGBB)
 * @param {string} p.productImageBase64  base64 (con o sin data-url)
 * @param {boolean} [p.cleanLabel]
 * @returns {Promise<{imageUrl:string, copy:object}>}
 */
async function generateHeroCreative({ productName, description, primaryColor, productImageBase64, cleanLabel = false }) {
  const productB64 = stripDataUrl(productImageBase64);
  if (!productB64) throw new Error('Se requiere la imagen del producto (productImageBase64).');

  const [heroB64, copy] = await Promise.all([
    genHeroScene(productB64, description || productName, cleanLabel),
    genCopy(productName, description || ''),
  ]);

  const jpeg = await renderHtml(buildHTML(copy, heroB64, primaryColor));
  return { imageUrl: `data:image/jpeg;base64,${jpeg.toString('base64')}`, copy };
}

module.exports = { generateHeroCreative };
