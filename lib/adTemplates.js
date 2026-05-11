// SVG ad template generator — one design per angle
// Sharp composites these as transparent PNG overlays over the AI background

const DIMS = {
  square:     { w: 1080, h: 1080 },
  vertical:   { w: 1080, h: 1920 },
  horizontal: { w: 1920, h: 1080 },
};

function hex2rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Word-wrap text into SVG tspan lines
function wrapLines(text, maxChars) {
  if (!text) return [''];
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

// Build <tspan> elements for multiline SVG text
function tspans(lines, x, y, dy, attrs = '') {
  return lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : dy}" ${attrs}>${escX(l)}</tspan>`)
    .join('');
}

function escX(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pill(x, y, w, h, r, fill, text, textColor = '#fff', fontSize = 28) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>
    <text x="${x + w / 2}" y="${y + h / 2 + fontSize * 0.36}" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="${fontSize}" fill="${textColor}">${escX(text)}</text>`;
}

function checkBullets(items, x, y, color, fontSize = 26, dy = 44) {
  return items
    .map((item, i) => `
      <text x="${x}" y="${y + i * dy}"
        font-family="Arial Black,Arial,sans-serif" font-weight="900"
        font-size="${fontSize}" fill="${color}">✓</text>
      <text x="${x + 40}" y="${y + i * dy}"
        font-family="Arial,sans-serif" font-weight="700"
        font-size="${fontSize}" fill="#fff">${escX(item)}</text>`)
    .join('');
}

function crossBullets(items, x, y, fontSize = 26, dy = 44) {
  return items
    .map((item, i) => `
      <text x="${x}" y="${y + i * dy}"
        font-family="Arial Black,Arial,sans-serif" font-weight="900"
        font-size="${fontSize}" fill="#ef4444">❌</text>
      <text x="${x + 44}" y="${y + i * dy}"
        font-family="Arial,sans-serif" font-weight="700"
        font-size="${fontSize}" fill="#cbd5e1">${escX(item)}</text>`)
    .join('');
}

// ─── ANGLE TEMPLATES ─────────────────────────────────────────────────────────

function templatePain(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || '¿CANSADO DE NO VER RESULTADOS?', 22);
  const bullets = [
    copy.b1 || 'Solución probada y efectiva',
    copy.b2 || 'Resultados desde la primera semana',
    copy.b3 || 'Sin efectos secundarios',
  ];
  const cta = copy.cta || '¡VER SOLUCIÓN →';
  const barH = 90 + headLines.length * 52;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <!-- Top gradient overlay for readability -->
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#botFade)"/>

    <!-- Accent bar top -->
    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Headline -->
    <text x="${w / 2}" y="80"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="54" fill="${color}">
      ${tspans(headLines, w / 2, 80, 62)}
    </text>

    <!-- Empathy line -->
    <text x="${w / 2}" y="${80 + headLines.length * 62 + 20}"
      text-anchor="middle"
      font-family="Arial,sans-serif" font-weight="700"
      font-size="28" fill="#e2e8f0">
      ${escX(copy.primaryText ? copy.primaryText.split('.')[0] + '.' : 'Sabemos exactamente cómo te sientes.')}
    </text>

    <!-- Bullets bottom-left -->
    ${checkBullets(bullets, 40, Math.round(h * 0.72), color, 28, 50)}

    <!-- CTA pill -->
    ${pill(Math.round(w / 2 - 200), Math.round(h - 100), 400, 70, 35, color, cta, '#fff', 30)}

    <!-- Bottom accent bar -->
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateDesire(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || '¡LOGRA EL RESULTADO QUE SIEMPRE QUISISTE!', 22);
  const bullets = [
    copy.b1 || 'Resultados visibles y duraderos',
    copy.b2 || 'Fórmula premium comprobada',
    copy.b3 || 'Miles de clientes satisfechos',
  ];
  const cta = copy.cta || '¡LO QUIERO AHORA!';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.65"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.78"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#botFade)"/>

    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Stars top right -->
    <text x="${w - 40}" y="55" text-anchor="end"
      font-size="36" fill="${color}">★★★★★</text>

    <!-- Headline -->
    <text x="${w / 2}" y="90"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="52" fill="#fff">
      ${tspans(headLines, w / 2, 90, 60)}
    </text>

    <!-- Accent underline -->
    <rect x="${Math.round(w / 2 - 80)}" y="${90 + headLines.length * 60 + 10}"
      width="160" height="5" rx="3" fill="${color}"/>

    <!-- Outcome bullets -->
    ${checkBullets(bullets, 40, Math.round(h * 0.72), color, 28, 50)}

    <!-- CTA -->
    ${pill(Math.round(w / 2 - 220), Math.round(h - 110), 440, 74, 37, color, cta, '#fff', 32)}

    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateTransformation(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const half = Math.round(w / 2);
  const cta = copy.cta || '¡EMPIEZA EL CAMBIO!';
  const productName = copy.productName || '';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="leftFade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
      </linearGradient>
      <linearGradient id="rightFade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#000" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.55"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>

    <rect width="${half}" height="${h}" fill="url(#leftFade)"/>
    <rect x="${half}" width="${half}" height="${h}" fill="url(#rightFade)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#botFade)"/>

    <!-- Divider line -->
    <rect x="${half - 3}" width="6" height="${h}" fill="${color}"/>

    <!-- VS badge -->
    <circle cx="${half}" cy="${Math.round(h * 0.22)}" r="38" fill="${color}"/>
    <text x="${half}" y="${Math.round(h * 0.22) + 12}"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="26" fill="#fff">VS</text>

    <!-- ANTES label -->
    <rect x="20" y="20" width="130" height="46" rx="8" fill="#374151"/>
    <text x="85" y="51" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="26" fill="#9ca3af">ANTES</text>

    <!-- DESPUÉS label -->
    <rect x="${half + 20}" y="20" width="166" height="46" rx="8" fill="${color}"/>
    <text x="${half + 103}" y="51" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="26" fill="#fff">DESPUÉS</text>

    <!-- Left pain text -->
    <text x="${Math.round(half * 0.5)}" y="${Math.round(h * 0.38)}"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="34" fill="#9ca3af">
      ${tspans(wrapLines('FRUSTRACIÓN. SIN RESULTADOS.', 14), Math.round(half * 0.5), Math.round(h * 0.38), 42)}
    </text>

    <!-- Right result text -->
    <text x="${Math.round(half + half * 0.5)}" y="${Math.round(h * 0.38)}"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="34" fill="#fff">
      ${tspans(wrapLines('¡CONFIANZA. RESULTADOS REALES!', 14), Math.round(half + half * 0.5), Math.round(h * 0.38), 42)}
    </text>

    <!-- Bottom tagline -->
    <text x="${w / 2}" y="${Math.round(h * 0.75)}"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="30" fill="${color}">
      ${escX(productName ? `La solución: ${productName.toUpperCase()}` : copy.headline || 'EL CAMBIO QUE NECESITAS')}
    </text>

    <!-- CTA -->
    ${pill(Math.round(w / 2 - 210), Math.round(h - 110), 420, 72, 36, color, cta, '#fff', 30)}

    <rect width="${w}" height="8" fill="${color}"/>
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateObjection(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const cta = copy.cta || '¡PRUÉBALO SIN RIESGO!';
  const t1 = copy.t1 || '¡Noté la diferencia en la primera semana!';
  const t2 = copy.t2 || 'Resultados increíbles, lo recomiendo al 100%.';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.8"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.4)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#botFade)"/>

    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Headline -->
    <text x="${w / 2}" y="72"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="42" fill="#fff">MILES YA LO COMPROBARON:</text>

    <!-- Testimonial 1 -->
    <rect x="30" y="${Math.round(h * 0.62)}" width="${Math.round(w * 0.88)}" height="100" rx="14"
      fill="rgba(255,255,255,0.12)" stroke="${color}" stroke-width="2"/>
    <circle cx="76" cy="${Math.round(h * 0.62) + 50}" r="28" fill="${color}" opacity="0.8"/>
    <text x="76" y="${Math.round(h * 0.62) + 56}" text-anchor="middle"
      font-family="Arial,sans-serif" font-size="22" fill="#fff">👤</text>
    <text x="120" y="${Math.round(h * 0.62) + 34}"
      font-family="Arial,sans-serif" font-weight="700" font-size="22" fill="#fff">
      ${escX(t1.length > 46 ? t1.slice(0, 46) + '…' : t1)}
    </text>
    <text x="120" y="${Math.round(h * 0.62) + 62}"
      font-family="Arial,sans-serif" font-size="18" fill="${color}">
      ★★★★★ — Laura M. ✅ Compra verificada
    </text>

    <!-- Testimonial 2 -->
    <rect x="30" y="${Math.round(h * 0.62) + 116}" width="${Math.round(w * 0.88)}" height="100" rx="14"
      fill="rgba(255,255,255,0.12)" stroke="${color}" stroke-width="2"/>
    <circle cx="76" cy="${Math.round(h * 0.62) + 166}" r="28" fill="${color}" opacity="0.8"/>
    <text x="76" y="${Math.round(h * 0.62) + 172}" text-anchor="middle"
      font-family="Arial,sans-serif" font-size="22" fill="#fff">👤</text>
    <text x="120" y="${Math.round(h * 0.62) + 150}"
      font-family="Arial,sans-serif" font-weight="700" font-size="22" fill="#fff">
      ${escX(t2.length > 46 ? t2.slice(0, 46) + '…' : t2)}
    </text>
    <text x="120" y="${Math.round(h * 0.62) + 178}"
      font-family="Arial,sans-serif" font-size="18" fill="${color}">
      ★★★★★ — Carlos R. ✅ Compra verificada
    </text>

    <!-- Credibility -->
    <text x="${w / 2}" y="${Math.round(h * 0.62) + 240}"
      text-anchor="middle"
      font-family="Arial,sans-serif" font-weight="700" font-size="24" fill="#94a3b8">
      +5,000 clientes satisfechos
    </text>

    ${pill(Math.round(w / 2 - 210), Math.round(h - 110), 420, 72, 36, color, cta, '#fff', 30)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateUrgency(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || '¡OFERTA POR TIEMPO LIMITADO!', 20);
  const cta = copy.cta || '¡COMPRA AHORA!';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.48)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.52)}" width="${w}" height="${Math.round(h * 0.48)}" fill="url(#botFade)"/>

    <!-- Top urgency strip -->
    <rect width="${w}" height="64" fill="${color}"/>
    <text x="${w / 2}" y="44" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="30" fill="#fff">⚡ OFERTA ESPECIAL · TIEMPO LIMITADO ⚡</text>

    <!-- Giant headline -->
    <text x="${w / 2}" y="130"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="64" fill="#fff">
      ${tspans(headLines, w / 2, 130, 72)}
    </text>

    <!-- Starburst badge -->
    <text x="${w - 110}" y="240"
      text-anchor="middle" font-size="100">⭐</text>
    <text x="${w - 110}" y="218" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="18" fill="#fff">SOLO</text>
    <text x="${w - 110}" y="238" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="18" fill="#fff">HOY</text>

    <!-- Benefits -->
    <text x="50" y="${Math.round(h * 0.74)}"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="30" fill="${color}">✓</text>
    <text x="96" y="${Math.round(h * 0.74)}"
      font-family="Arial,sans-serif" font-weight="700"
      font-size="30" fill="#fff">${escX(copy.description || 'Resultados garantizados')}</text>

    <text x="50" y="${Math.round(h * 0.74) + 46}"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="30" fill="${color}">✓</text>
    <text x="96" y="${Math.round(h * 0.74) + 46}"
      font-family="Arial,sans-serif" font-weight="700"
      font-size="30" fill="#fff">Envío gratis incluido</text>

    ${pill(Math.round(w / 2 - 240), Math.round(h - 120), 480, 80, 40, color, cta, '#fff', 34)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateAuthority(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || 'FÓRMULA PREMIUM RESPALDADA POR EXPERTOS', 22);
  const features = [
    copy.f1 || 'Ingredientes certificados de alta calidad',
    copy.f2 || 'Resultados comprobados científicamente',
    copy.f3 || 'Sin contraindicaciones',
    copy.f4 || 'Fabricación bajo estrictos estándares',
  ];
  const cta = copy.cta || 'VER MÁS';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#botFade)"/>

    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Trophy icon area -->
    <text x="60" y="82" font-size="52">🏆</text>

    <!-- Headline -->
    <text x="130" y="62"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="40" fill="#fff">
      ${tspans(headLines, 130, 62, 48)}
    </text>

    <!-- Feature rows -->
    ${features.map((f, i) => `
      <rect x="30" y="${Math.round(h * 0.66) + i * 56}" width="46" height="46" rx="8" fill="${color}"/>
      <text x="53" y="${Math.round(h * 0.66) + i * 56 + 30}" text-anchor="middle"
        font-family="Arial Black,Arial,sans-serif" font-weight="900"
        font-size="22" fill="#fff">✓</text>
      <text x="90" y="${Math.round(h * 0.66) + i * 56 + 30}"
        font-family="Arial,sans-serif" font-weight="700"
        font-size="24" fill="#e2e8f0">${escX(f)}</text>
    `).join('')}

    ${pill(Math.round(w / 2 - 160), Math.round(h - 100), 320, 66, 33, color, cta, '#fff', 28)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateComparison(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const half = Math.round(w / 2);
  const leftItems = [
    copy.l1 || 'Resultados genéricos',
    copy.l2 || 'Sin soporte al cliente',
    copy.l3 || 'Calidad dudosa',
  ];
  const rightItems = [
    copy.r1 || 'Resultados comprobados',
    copy.r2 || 'Soporte personalizado',
    copy.r3 || 'Calidad premium garantizada',
  ];
  const brandName = copy.productName ? copy.productName.toUpperCase() : 'NOSOTROS';
  const cta = copy.cta || '¡ELIGE LO MEJOR!';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="leftBg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="#1e293b" stop-opacity="0.5"/>
      </linearGradient>
      <linearGradient id="rightBg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${half}" height="${h}" fill="url(#leftBg)"/>
    <rect x="${half}" width="${half}" height="${h}" fill="url(#rightBg)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#botFade)"/>

    <!-- Top banner -->
    <rect width="${w}" height="70" fill="rgba(0,0,0,0.7)"/>
    <text x="${w / 2}" y="47" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="34" fill="#fff">¿POR QUÉ ELEGIRNOS?</text>

    <!-- Column headers -->
    <rect x="20" y="90" width="${half - 40}" height="52" rx="10" fill="#374151"/>
    <text x="${half / 2}" y="124" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="26" fill="#9ca3af">OTROS</text>

    <rect x="${half + 20}" y="90" width="${half - 40}" height="52" rx="10" fill="${color}"/>
    <text x="${half + half / 2}" y="124" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="24" fill="#fff">${escX(brandName.length > 14 ? brandName.slice(0, 14) + '…' : brandName)}</text>

    <!-- VS badge -->
    <circle cx="${half}" cy="116" r="32" fill="#fff"/>
    <text x="${half}" y="124" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="22" fill="${color}">VS</text>

    <!-- Divider -->
    <rect x="${half - 2}" y="160" width="4" height="${Math.round(h * 0.56)}" fill="${color}" opacity="0.6"/>

    <!-- Left items -->
    ${crossBullets(leftItems, 28, 196, 24, 50)}

    <!-- Right items -->
    ${checkBullets(rightItems, half + 28, 196, color, 24, 50)}

    <!-- CTA -->
    ${pill(Math.round(w / 2 - 200), Math.round(h - 110), 400, 72, 36, color, cta, '#fff', 30)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateGuarantee(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const cta = copy.cta || '¡COMPRA SIN RIESGO!';
  const bullets = [
    copy.b1 || 'Devolución completa si no funciona',
    copy.b2 || 'Sin preguntas, sin letra pequeña',
    copy.b3 || 'Proceso simple y rápido',
  ];

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.68"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.4)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.6)}" width="${w}" height="${Math.round(h * 0.4)}" fill="url(#botFade)"/>

    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Shield graphic (large, centered top) -->
    <text x="${w / 2}" y="120" text-anchor="middle" font-size="88">🛡️</text>

    <!-- Guarantee headline -->
    <text x="${w / 2}" y="168" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="44" fill="#fff">GARANTÍA TOTAL</text>
    <text x="${w / 2}" y="216" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="32" fill="${color}">DE DEVOLUCIÓN</text>

    <!-- Guarantee badge pill -->
    ${pill(Math.round(w / 2 - 180), 238, 360, 60, 30, color, '100% GARANTIZADO', '#fff', 28)}

    <!-- Terms line -->
    <text x="${w / 2}" y="342" text-anchor="middle"
      font-family="Arial,sans-serif" font-weight="700"
      font-size="22" fill="#cbd5e1">
      ${escX(copy.primaryText ? copy.primaryText.split('.')[0].slice(0, 60) + '.' : 'Si no ves resultados en 30 días, te devolvemos tu dinero.')}
    </text>

    ${checkBullets(bullets, 40, Math.round(h * 0.72), color, 26, 48)}

    ${pill(Math.round(w / 2 - 200), Math.round(h - 110), 400, 72, 36, color, cta, '#fff', 30)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateSocialProof(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const cta = copy.cta || '¡ÚNETE A ELLOS!';
  const r1 = copy.r1 || '¡Increíble, lo noté en la primera semana de uso!';
  const r2 = copy.r2 || 'Superó mis expectativas, 100% recomendado.';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.42)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.58)}" width="${w}" height="${Math.round(h * 0.42)}" fill="url(#botFade)"/>

    <rect width="${w}" height="8" fill="${color}"/>

    <!-- Big stat -->
    <text x="${w / 2}" y="90" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="62" fill="#fff">+10,000</text>
    <text x="${w / 2}" y="140" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="32" fill="${color}">CLIENTES SATISFECHOS</text>

    <!-- Stars -->
    <text x="${w / 2}" y="188" text-anchor="middle"
      font-size="38" fill="${color}">★★★★★</text>
    <text x="${w / 2}" y="222" text-anchor="middle"
      font-family="Arial,sans-serif" font-weight="700"
      font-size="22" fill="#94a3b8">4.9/5 · Más de 800 reseñas verificadas</text>

    <!-- Review card 1 -->
    <rect x="30" y="${Math.round(h * 0.63)}" width="${Math.round(w * 0.88)}" height="96" rx="12"
      fill="rgba(255,255,255,0.1)" stroke="${color}" stroke-width="2"/>
    <circle cx="70" cy="${Math.round(h * 0.63) + 48}" r="26" fill="${color}" opacity="0.8"/>
    <text x="70" y="${Math.round(h * 0.63) + 54}" text-anchor="middle"
      font-size="20" fill="#fff">👤</text>
    <text x="110" y="${Math.round(h * 0.63) + 32}"
      font-family="Arial,sans-serif" font-weight="700" font-size="20" fill="#fff">
      ${escX(r1.length > 48 ? r1.slice(0, 48) + '…' : r1)}
    </text>
    <text x="110" y="${Math.round(h * 0.63) + 58}"
      font-family="Arial,sans-serif" font-size="17" fill="${color}">
      ★★★★★ — Camila R. ✅ Verificada
    </text>

    <!-- Review card 2 -->
    <rect x="30" y="${Math.round(h * 0.63) + 108}" width="${Math.round(w * 0.88)}" height="96" rx="12"
      fill="rgba(255,255,255,0.1)" stroke="${color}" stroke-width="2"/>
    <circle cx="70" cy="${Math.round(h * 0.63) + 156}" r="26" fill="${color}" opacity="0.8"/>
    <text x="70" y="${Math.round(h * 0.63) + 162}" text-anchor="middle"
      font-size="20" fill="#fff">👤</text>
    <text x="110" y="${Math.round(h * 0.63) + 140}"
      font-family="Arial,sans-serif" font-weight="700" font-size="20" fill="#fff">
      ${escX(r2.length > 48 ? r2.slice(0, 48) + '…' : r2)}
    </text>
    <text x="110" y="${Math.round(h * 0.63) + 166}"
      font-family="Arial,sans-serif" font-size="17" fill="${color}">
      ★★★★★ — Diego M. ✅ Verificada
    </text>

    ${pill(Math.round(w / 2 - 180), Math.round(h - 104), 360, 68, 34, color, cta, '#fff', 28)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templateCuriosity(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const headLines = wrapLines(copy.headline || '¿SABÍAS QUE LA MAYORÍA LO HACE MAL?', 22);
  const hints = [
    copy.h1 || 'El error que todos cometen sin saberlo',
    copy.h2 || 'La solución que cambia todo',
    copy.h3 || 'Resultados que no esperabas posibles',
  ];
  const cta = copy.cta || 'DESCUBRE EL SECRETO →';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.5)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.5)}" width="${w}" height="${Math.round(h * 0.5)}" fill="url(#botFade)"/>

    <!-- Hook strip -->
    <rect width="${w}" height="${60 + headLines.length * 62}" fill="${color}" opacity="0.92"/>

    <!-- Hook headline -->
    <text x="${w / 2}" y="58"
      text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="52" fill="#fff">
      ${tspans(headLines, w / 2, 58, 62)}
    </text>

    <!-- Subheadline -->
    <text x="${w / 2}" y="${70 + headLines.length * 62}"
      text-anchor="middle"
      font-family="Arial,sans-serif" font-weight="700"
      font-size="26" fill="rgba(255,255,255,0.85)">
      ${escX(copy.description || 'Lo que nadie te había contado hasta ahora')}
    </text>

    <!-- Hint bullets -->
    ${hints.map((hint, i) => `
      <text x="50" y="${Math.round(h * 0.72) + i * 52}"
        font-family="Arial Black,Arial,sans-serif" font-weight="900"
        font-size="28" fill="${color}">→</text>
      <text x="94" y="${Math.round(h * 0.72) + i * 52}"
        font-family="Arial,sans-serif" font-weight="700"
        font-size="26" fill="#e2e8f0">${escX(hint)}</text>
    `).join('')}

    ${pill(Math.round(w / 2 - 230), Math.round(h - 112), 460, 74, 37, color, cta, '#fff', 28)}
    <rect y="${h - 8}" width="${w}" height="8" fill="${color}"/>
  </svg>`;
}

function templatePrice(copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const cta = copy.cta || '¡APROVECHA AHORA!';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="botFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#topFade)"/>
    <rect y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#botFade)"/>

    <!-- Top offer strip -->
    <rect width="${w}" height="68" fill="${color}"/>
    <text x="${w / 2}" y="46" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="30" fill="#fff">⚡ OFERTA ESPECIAL · TIEMPO LIMITADO ⚡</text>

    <!-- Price display -->
    <text x="${w / 2}" y="160" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="42" fill="#94a3b8" text-decoration="line-through">
      Precio normal: $150.000
    </text>
    <!-- Line through old price -->
    <rect x="${Math.round(w * 0.15)}" y="140" width="${Math.round(w * 0.7)}" height="4" fill="#ef4444"/>

    <text x="${w / 2}" y="232" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="74" fill="#fff">¡50% OFF!</text>

    <text x="${w / 2}" y="286" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="34" fill="${color}">SOLO $75.000</text>

    <!-- Value stack -->
    <text x="${w / 2}" y="${Math.round(h * 0.73)}" text-anchor="middle"
      font-family="Arial,sans-serif" font-weight="700"
      font-size="24" fill="#e2e8f0">
      ${escX(copy.description || 'Incluye: producto + envío gratis + garantía 30 días')}
    </text>

    <!-- Scarcity -->
    <text x="${w / 2}" y="${Math.round(h * 0.73) + 42}" text-anchor="middle"
      font-family="Arial Black,Arial,sans-serif" font-weight="900"
      font-size="24" fill="#ef4444">⏰ Solo por esta semana · Quedan pocas unidades</text>

    ${pill(Math.round(w / 2 - 240), Math.round(h - 118), 480, 80, 40, color, cta, '#fff', 34)}
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

/**
 * Returns the SVG string for an angle template.
 * @param {string} angle
 * @param {object} copy  - { headline, primaryText, description, cta, productName, ... }
 * @param {string} color - primary hex color
 * @param {string} format - 'square' | 'vertical' | 'horizontal'
 */
function buildSvgTemplate(angle, copy, color, format) {
  const fn = TEMPLATE_FNS[angle] || TEMPLATE_FNS.desire;
  return fn(copy || {}, color || '#6366f1', format || 'square');
}

module.exports = { buildSvgTemplate, DIMS };
