// SVG ad template generator — one design per angle
// Fonts are embedded as base64 so they work on any server (Vercel, Linux, etc.)

const fs   = require('fs');
const path = require('path');

// Load Inter fonts once at module init — cached for all requests
let FONTS_STYLE = '';
try {
  const boldB64    = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Bold.ttf')).toString('base64');
  const regularB64 = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Regular.ttf')).toString('base64');
  FONTS_STYLE = `<style>
    @font-face{font-family:'Inter';src:url('data:font/truetype;base64,${regularB64}')format('truetype');font-weight:400;}
    @font-face{font-family:'Inter';src:url('data:font/truetype;base64,${boldB64}')format('truetype');font-weight:700;}
    @font-face{font-family:'Inter';src:url('data:font/truetype;base64,${boldB64}')format('truetype');font-weight:900;}
  </style>`;
} catch (e) {
  console.warn('[adTemplates] Inter fonts not found — using system sans-serif');
}

const FONT  = 'Inter, sans-serif';

const DIMS = {
  square:     { w: 1080, h: 1080 },
  vertical:   { w: 1080, h: 1920 },
  horizontal: { w: 1920, h: 1080 },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function escX(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapLines(text, maxChars) {
  if (!text) return [''];
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function tspans(lines, x, y, dy) {
  return lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : dy}">${escX(l)}</tspan>`)
    .join('');
}

function pill(x, y, w, h, r, fill, text, textColor = '#fff', fontSize = 28) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>
    <text x="${x + w / 2}" y="${y + h / 2 + fontSize * 0.36}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="${fontSize}" fill="${textColor}">${escX(text)}</text>`;
}

function checkBullets(items, x, y, color, fontSize = 26, dy = 46) {
  return items.map((item, i) => `
    <text x="${x}" y="${y + i * dy}" font-family="${FONT}" font-weight="900"
      font-size="${fontSize}" fill="${color}">&#x2713;</text>
    <text x="${x + 44}" y="${y + i * dy}" font-family="${FONT}" font-weight="700"
      font-size="${fontSize}" fill="#fff">${escX(item)}</text>`).join('');
}

function crossBullets(items, x, y, fontSize = 24, dy = 48) {
  return items.map((item, i) => `
    <rect x="${x}" y="${y + i * dy - fontSize}" width="${fontSize}" height="${fontSize}" rx="3" fill="#ef4444"/>
    <text x="${x + fontSize / 2}" y="${y + i * dy - 4}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="${fontSize - 4}" fill="#fff">X</text>
    <text x="${x + fontSize + 10}" y="${y + i * dy}" font-family="${FONT}" font-weight="700"
      font-size="${fontSize}" fill="#cbd5e1">${escX(item)}</text>`).join('');
}

function avatarCard(x, y, w, h, color, initial, testimonial, stars = '★★★★★', reviewer = '') {
  const t = testimonial.length > 46 ? testimonial.slice(0, 46) + '...' : testimonial;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"
      fill="rgba(255,255,255,0.12)" stroke="${color}" stroke-width="2"/>
    <circle cx="${x + 38}" cy="${y + h / 2}" r="26" fill="${color}" opacity="0.85"/>
    <text x="${x + 38}" y="${y + h / 2 + 8}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="22" fill="#fff">${escX(initial)}</text>
    <text x="${x + 76}" y="${y + h / 2 - 14}" font-family="${FONT}" font-weight="700"
      font-size="20" fill="#fff">${escX(t)}</text>
    <text x="${x + 76}" y="${y + h / 2 + 14}" font-family="${FONT}" font-size="18" fill="${color}">
      ${escX(stars)}${reviewer ? ' — ' + escX(reviewer) : ''}
    </text>`;
}

// ─── ANGLE TEMPLATES ─────────────────────────────────────────────────────────

function templatePain(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || '¿CANSADO DE NO VER RESULTADOS?', 22);
  const bullets = [
    copy.b1 || 'Solucion probada y efectiva',
    copy.b2 || 'Resultados desde la primera semana',
    copy.b3 || 'Sin efectos secundarios',
  ];

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#bF)"/>
    <rect width="${w}" height="8" fill="${color}"/>

    <text x="${w / 2}" y="80" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="54" fill="${color}">
      ${tspans(headLines, w / 2, 80, 62)}
    </text>
    <text x="${w / 2}" y="${80 + headLines.length * 62 + 20}" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="28" fill="#e2e8f0">
      ${escX((copy.primaryText || 'Sabemos exactamente como te sientes.').split('.')[0] + '.')}
    </text>

    ${checkBullets(bullets, 40, Math.round(h * 0.73), color, 28, 52)}
    ${pill(Math.round(w / 2 - 200), Math.round(h - 104), 400, 70, 35, color, copy.cta || 'VER SOLUCION', '#fff', 30)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateDesire(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || 'LOGRA EL RESULTADO QUE SIEMPRE QUISISTE', 22);
  const bullets = [
    copy.b1 || 'Resultados visibles y duraderos',
    copy.b2 || 'Formula premium comprobada',
    copy.b3 || 'Miles de clientes satisfechos',
  ];

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.65"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.8"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#bF)"/>
    <rect width="${w}" height="8" fill="${color}"/>

    <text x="${w - 40}" y="55" text-anchor="end" font-family="${FONT}" font-size="36" fill="${color}">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</text>

    <text x="${w / 2}" y="90" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="52" fill="#fff">
      ${tspans(headLines, w / 2, 90, 60)}
    </text>
    <rect x="${Math.round(w / 2 - 80)}" y="${90 + headLines.length * 60 + 10}"
      width="160" height="5" rx="3" fill="${color}"/>

    ${checkBullets(bullets, 40, Math.round(h * 0.73), color, 28, 52)}
    ${pill(Math.round(w / 2 - 220), Math.round(h - 110), 440, 74, 37, color, copy.cta || 'LO QUIERO AHORA', '#fff', 32)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateTransformation(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const half = Math.round(w / 2);
  const tagline = copy.productName
    ? `La solucion: ${copy.productName.toUpperCase()}`
    : (copy.headline || 'EL CAMBIO QUE NECESITAS');

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="lF" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.75"/><stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
      </linearGradient>
      <linearGradient id="rF" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.1"/><stop offset="100%" stop-color="${color}" stop-opacity="0.55"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${half}" height="${h}" fill="url(#lF)"/>
    <rect x="${half}" width="${half}" height="${h}" fill="url(#rF)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#bF)"/>
    <rect x="${half - 3}" width="6" height="${h}" fill="${color}"/>

    <circle cx="${half}" cy="${Math.round(h * 0.22)}" r="38" fill="${color}"/>
    <text x="${half}" y="${Math.round(h * 0.22) + 12}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="26" fill="#fff">VS</text>

    <rect x="20" y="20" width="130" height="46" rx="8" fill="#374151"/>
    <text x="85" y="51" text-anchor="middle" font-family="${FONT}" font-weight="900"
      font-size="26" fill="#9ca3af">ANTES</text>

    <rect x="${half + 20}" y="20" width="166" height="46" rx="8" fill="${color}"/>
    <text x="${half + 103}" y="51" text-anchor="middle" font-family="${FONT}" font-weight="900"
      font-size="26" fill="#fff">DESPUES</text>

    <text x="${Math.round(half * 0.5)}" y="${Math.round(h * 0.38)}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="32" fill="#9ca3af">
      ${tspans(wrapLines('FRUSTRACION. SIN RESULTADOS.', 14), Math.round(half * 0.5), Math.round(h * 0.38), 40)}
    </text>
    <text x="${Math.round(half + half * 0.5)}" y="${Math.round(h * 0.38)}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="32" fill="#fff">
      ${tspans(wrapLines('CONFIANZA. RESULTADOS REALES!', 14), Math.round(half + half * 0.5), Math.round(h * 0.38), 40)}
    </text>

    <text x="${w / 2}" y="${Math.round(h * 0.76)}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="28" fill="${color}">
      ${escX(tagline.length > 36 ? tagline.slice(0, 36) : tagline)}
    </text>

    ${pill(Math.round(w / 2 - 210), Math.round(h - 110), 420, 72, 36, color, copy.cta || 'EMPIEZA EL CAMBIO', '#fff', 30)}
    <rect width="${w}" height="8" fill="${color}"/>
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateObjection(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const t1 = copy.t1 || 'Note la diferencia en la primera semana!';
  const t2 = copy.t2 || 'Resultados increibles, lo recomiendo al 100%.';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.7"/><stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.4)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#bF)"/>
    <rect width="${w}" height="8" fill="${color}"/>

    <text x="${w / 2}" y="72" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="40" fill="#fff">MILES YA LO COMPROBARON:</text>

    ${avatarCard(30, Math.round(h * 0.62), Math.round(w * 0.88), 100, color, 'L', t1, '★★★★★', 'Laura M.')}
    ${avatarCard(30, Math.round(h * 0.62) + 116, Math.round(w * 0.88), 100, color, 'C', t2, '★★★★★', 'Carlos R.')}

    <text x="${w / 2}" y="${Math.round(h * 0.62) + 244}" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="24" fill="#94a3b8">
      +5,000 clientes satisfechos ★★★★★
    </text>

    ${pill(Math.round(w / 2 - 210), Math.round(h - 110), 420, 72, 36, color, copy.cta || 'PRUEBALO SIN RIESGO', '#fff', 30)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateUrgency(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || 'OFERTA POR TIEMPO LIMITADO!', 20);

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.8"/><stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.48)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.52)}" width="${w}" height="${Math.round(h * 0.48)}" fill="url(#bF)"/>

    <rect width="${w}" height="64" fill="${color}"/>
    <text x="${w / 2}" y="44" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="30" fill="#fff">
      ** OFERTA ESPECIAL · TIEMPO LIMITADO **
    </text>

    <text x="${w / 2}" y="130" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="64" fill="#fff">
      ${tspans(headLines, w / 2, 130, 72)}
    </text>

    <!-- Starburst badge -->
    <rect x="${w - 180}" y="80" width="150" height="150" rx="75" fill="${color}" opacity="0.9"/>
    <text x="${w - 105}" y="148" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="22" fill="#fff">SOLO</text>
    <text x="${w - 105}" y="174" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="22" fill="#fff">HOY</text>

    <text x="50" y="${Math.round(h * 0.75)}"
      font-family="${FONT}" font-weight="900" font-size="30" fill="${color}">&#x2713;</text>
    <text x="96" y="${Math.round(h * 0.75)}"
      font-family="${FONT}" font-weight="700" font-size="30" fill="#fff">
      ${escX(copy.description || 'Resultados garantizados')}
    </text>
    <text x="50" y="${Math.round(h * 0.75) + 48}"
      font-family="${FONT}" font-weight="900" font-size="30" fill="${color}">&#x2713;</text>
    <text x="96" y="${Math.round(h * 0.75) + 48}"
      font-family="${FONT}" font-weight="700" font-size="30" fill="#fff">Envio gratis incluido</text>

    ${pill(Math.round(w / 2 - 240), Math.round(h - 120), 480, 80, 40, color, copy.cta || 'COMPRA AHORA!', '#fff', 34)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateAuthority(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || 'FORMULA PREMIUM RESPALDADA POR EXPERTOS', 22);
  const features = [
    copy.f1 || 'Ingredientes certificados de alta calidad',
    copy.f2 || 'Resultados comprobados',
    copy.f3 || 'Sin contraindicaciones',
    copy.f4 || 'Fabricacion bajo estandares premium',
  ];

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.72"/><stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#bF)"/>
    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Trophy badge -->
    <circle cx="62" cy="62" r="48" fill="${color}" opacity="0.9"/>
    <text x="62" y="72" text-anchor="middle" font-family="${FONT}" font-weight="900"
      font-size="34" fill="#fff">★</text>

    <text x="128" y="52" font-family="${FONT}" font-weight="900" font-size="40" fill="#fff">
      ${tspans(headLines, 128, 52, 48)}
    </text>

    ${features.map((f, i) => `
      <rect x="30" y="${Math.round(h * 0.67) + i * 58}" width="46" height="46" rx="8" fill="${color}"/>
      <text x="53" y="${Math.round(h * 0.67) + i * 58 + 30}" text-anchor="middle"
        font-family="${FONT}" font-weight="900" font-size="22" fill="#fff">&#x2713;</text>
      <text x="90" y="${Math.round(h * 0.67) + i * 58 + 30}" font-family="${FONT}" font-weight="700"
        font-size="24" fill="#e2e8f0">${escX(f)}</text>`).join('')}

    ${pill(Math.round(w / 2 - 160), Math.round(h - 100), 320, 66, 33, color, copy.cta || 'VER MAS', '#fff', 28)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateComparison(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const half = Math.round(w / 2);
  const leftItems  = [
    copy.l1 || 'Resultados genericos',
    copy.l2 || 'Sin soporte al cliente',
    copy.l3 || 'Calidad dudosa',
  ];
  const rightItems = [
    copy.r1 || 'Resultados comprobados',
    copy.r2 || 'Soporte personalizado',
    copy.r3 || 'Calidad premium garantizada',
  ];
  const brandName = copy.productName
    ? copy.productName.toUpperCase().slice(0, 14)
    : 'NOSOTROS';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="lB" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.82"/><stop offset="100%" stop-color="#1e293b" stop-opacity="0.5"/>
      </linearGradient>
      <linearGradient id="rB" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/><stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${half}" height="${h}" fill="url(#lB)"/>
    <rect x="${half}" width="${half}" height="${h}" fill="url(#rB)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#bF)"/>

    <rect width="${w}" height="70" fill="rgba(0,0,0,0.7)"/>
    <text x="${w / 2}" y="47" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="34" fill="#fff">POR QUE ELEGIRNOS?</text>

    <rect x="20" y="90" width="${half - 40}" height="52" rx="10" fill="#374151"/>
    <text x="${half / 2}" y="124" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="26" fill="#9ca3af">OTROS</text>

    <rect x="${half + 20}" y="90" width="${half - 40}" height="52" rx="10" fill="${color}"/>
    <text x="${half + half / 2}" y="124" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="24" fill="#fff">${escX(brandName)}</text>

    <circle cx="${half}" cy="116" r="32" fill="#fff"/>
    <text x="${half}" y="124" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="22" fill="${color}">VS</text>

    <rect x="${half - 2}" y="160" width="4" height="${Math.round(h * 0.56)}" fill="${color}" opacity="0.6"/>

    ${crossBullets(leftItems, 28, 208, 24, 52)}
    ${checkBullets(rightItems, half + 28, 208, color, 24, 52)}

    ${pill(Math.round(w / 2 - 200), Math.round(h - 110), 400, 72, 36, color, copy.cta || 'ELIGE LO MEJOR!', '#fff', 30)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateGuarantee(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const bullets = [
    copy.b1 || 'Devolucion completa si no funciona',
    copy.b2 || 'Sin preguntas, sin letra pequena',
    copy.b3 || 'Proceso simple y rapido',
  ];
  const terms = (copy.primaryText || 'Si no ves resultados en 30 dias te devolvemos tu dinero.')
    .split('.')[0].slice(0, 60) + '.';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.68"/><stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.4)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#bF)"/>
    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Shield shape -->
    <rect x="${Math.round(w / 2 - 70)}" y="26" width="140" height="120" rx="20" fill="${color}" opacity="0.95"/>
    <rect x="${Math.round(w / 2 - 50)}" y="44" width="100" height="84" rx="12" fill="rgba(255,255,255,0.2)"/>
    <text x="${w / 2}" y="100" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="36" fill="#fff">GRTIA</text>

    <text x="${w / 2}" y="168" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="44" fill="#fff">GARANTIA TOTAL</text>
    <text x="${w / 2}" y="210" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="32" fill="${color}">DE DEVOLUCION</text>

    ${pill(Math.round(w / 2 - 180), 230, 360, 58, 29, color, '100% GARANTIZADO', '#fff', 26)}

    <text x="${w / 2}" y="338" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="22" fill="#cbd5e1">${escX(terms)}</text>

    ${checkBullets(bullets, 40, Math.round(h * 0.73), color, 26, 50)}
    ${pill(Math.round(w / 2 - 200), Math.round(h - 110), 400, 72, 36, color, copy.cta || 'COMPRA SIN RIESGO!', '#fff', 30)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateSocialProof(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const r1 = copy.r1 || 'Increible, lo note en la primera semana de uso!';
  const r2 = copy.r2 || 'Supero mis expectativas. 100% recomendado.';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.72"/><stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.42)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.58)}" width="${w}" height="${Math.round(h * 0.42)}" fill="url(#bF)"/>
    <rect width="${w}" height="8" fill="${color}"/>

    <text x="${w / 2}" y="90" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="62" fill="#fff">+10,000</text>
    <text x="${w / 2}" y="140" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="32" fill="${color}">CLIENTES SATISFECHOS</text>
    <text x="${w / 2}" y="188" text-anchor="middle"
      font-family="${FONT}" font-size="38" fill="${color}">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</text>
    <text x="${w / 2}" y="224" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="22" fill="#94a3b8">
      4.9/5 · Mas de 800 resenas verificadas
    </text>

    ${avatarCard(30, Math.round(h * 0.63), Math.round(w * 0.88), 96, color, 'C', r1, '★★★★★', 'Camila R.')}
    ${avatarCard(30, Math.round(h * 0.63) + 108, Math.round(w * 0.88), 96, color, 'D', r2, '★★★★★', 'Diego M.')}

    ${pill(Math.round(w / 2 - 180), Math.round(h - 104), 360, 68, 34, color, copy.cta || 'UNETE A ELLOS!', '#fff', 28)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateCuriosity(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || 'SABIAS QUE LA MAYORIA LO HACE MAL?', 22);
  const hints = [
    copy.h1 || 'El error que todos cometen sin saberlo',
    copy.h2 || 'La solucion que cambia todo',
    copy.h3 || 'Resultados que no esperabas posibles',
  ];

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.85"/><stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.5)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.5)}" width="${w}" height="${Math.round(h * 0.5)}" fill="url(#bF)"/>

    <rect width="${w}" height="${60 + headLines.length * 62}" fill="${color}" opacity="0.92"/>
    <text x="${w / 2}" y="58" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="52" fill="#fff">
      ${tspans(headLines, w / 2, 58, 62)}
    </text>
    <text x="${w / 2}" y="${70 + headLines.length * 62}" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="26" fill="rgba(255,255,255,0.85)">
      ${escX(copy.description || 'Lo que nadie te habia contado hasta ahora')}
    </text>

    ${hints.map((hint, i) => `
      <text x="50" y="${Math.round(h * 0.72) + i * 52}"
        font-family="${FONT}" font-weight="900" font-size="28" fill="${color}">&#x2192;</text>
      <text x="94" y="${Math.round(h * 0.72) + i * 52}"
        font-family="${FONT}" font-weight="700" font-size="26" fill="#e2e8f0">${escX(hint)}</text>`).join('')}

    ${pill(Math.round(w / 2 - 230), Math.round(h - 112), 460, 74, 37, color, copy.cta || 'DESCUBRE EL SECRETO', '#fff', 28)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templatePrice(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${FONTS_STYLE}
      <linearGradient id="tF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.75"/><stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#tF)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#bF)"/>

    <rect width="${w}" height="68" fill="${color}"/>
    <text x="${w / 2}" y="46" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="30" fill="#fff">
      ** OFERTA ESPECIAL · TIEMPO LIMITADO **
    </text>

    <!-- Old price crossed out -->
    <text x="${w / 2}" y="160" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="40" fill="#94a3b8">Precio normal: $150.000</text>
    <rect x="${Math.round(w * 0.15)}" y="142" width="${Math.round(w * 0.7)}" height="4" fill="#ef4444"/>

    <!-- Big discount -->
    <text x="${w / 2}" y="234" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="74" fill="#fff">50% OFF!</text>
    <text x="${w / 2}" y="286" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="34" fill="${color}">SOLO $75.000</text>

    <!-- Value + scarcity -->
    <text x="${w / 2}" y="${Math.round(h * 0.74)}" text-anchor="middle"
      font-family="${FONT}" font-weight="700" font-size="24" fill="#e2e8f0">
      ${escX(copy.description || 'Incluye: producto + envio gratis + garantia 30 dias')}
    </text>
    <text x="${w / 2}" y="${Math.round(h * 0.74) + 42}" text-anchor="middle"
      font-family="${FONT}" font-weight="900" font-size="24" fill="#ef4444">
      Solo por esta semana · Quedan pocas unidades
    </text>

    ${pill(Math.round(w / 2 - 240), Math.round(h - 118), 480, 80, 40, color, copy.cta || 'APROVECHA AHORA!', '#fff', 34)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

// ─── DISPATCHER ──────────────────────────────────────────────────────────────

const TEMPLATE_FNS = {
  pain:           templatePain,
  desire:         templateDesire,
  transformation: templateTransformation,
  objection:      templateObjection,
  urgency:        templateUrgency,
  authority:      templateAuthority,
  comparison:     templateComparison,
  guarantee:      templateGuarantee,
  social_proof:   templateSocialProof,
  curiosity:      templateCuriosity,
  price:          templatePrice,
};

function buildSvgTemplate(angle, copy, color, format) {
  const fn = TEMPLATE_FNS[angle] || TEMPLATE_FNS.desire;
  return fn(copy || {}, color || '#6366f1', format || 'square');
}

module.exports = { buildSvgTemplate, DIMS };
