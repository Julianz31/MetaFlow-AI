// Canvas-based ad template renderer using @napi-rs/canvas
// Works on Vercel Lambda (prebuilt Skia binaries for linux-x64)

const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

const FONTS_DIR = path.join(__dirname, 'fonts');
try {
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, 'Inter-Regular.woff'), 'Inter');
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, 'Inter-Bold.woff'),    'Inter');
} catch (e) {
  console.warn('[adTemplates] Font registration failed:', e.message);
}

const DIMS = {
  square:     { w: 1080, h: 1080 },
  vertical:   { w: 1080, h: 1920 },
  horizontal: { w: 1920, h: 1080 },
};

// ─── DRAWING HELPERS ─────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function fadeRect(ctx, x, y, w, h, fromColor, toColor, vertical = true) {
  const grad = vertical
    ? ctx.createLinearGradient(x, y, x, y + h)
    : ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, fromColor);
  grad.addColorStop(1, toColor);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, strokeWidth = 2) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeWidth; ctx.stroke(); }
}

function txt(ctx, text, x, y, size, weight, color, align = 'left', maxWidth) {
  ctx.font = `${weight} ${size}px Inter, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
}

function wrapText(ctx, text, x, y, maxWidth, size, weight, color, lineHeight, align = 'left') {
  ctx.font = `${weight} ${size}px Inter, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  const words = String(text).split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
  return curY + lineHeight;
}

function pill(ctx, x, y, w, h, fill, text, textColor, size) {
  roundRect(ctx, x, y, w, h, h / 2, fill);
  txt(ctx, text, x + w / 2, y + h / 2 + size * 0.36, size, 'bold', textColor, 'center');
}

function drawCheck(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = r * 0.35;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.4);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.35);
  ctx.stroke();
  ctx.restore();
}

function drawStars(ctx, x, y, count, size, color) {
  for (let i = 0; i < count; i++) {
    const cx = x + i * (size + 4);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let p = 0; p < 5; p++) {
      const a = (p * 4 * Math.PI) / 5 - Math.PI / 2;
      const ai = a + (2 * Math.PI) / 5;
      if (p === 0) ctx.moveTo(cx + size * Math.cos(a), y + size * Math.sin(a));
      else ctx.lineTo(cx + size * Math.cos(a), y + size * Math.sin(a));
      ctx.lineTo(cx + (size * 0.4) * Math.cos(ai), y + (size * 0.4) * Math.sin(ai));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function bullets(ctx, items, x, y, color, textColor, size, spacing) {
  items.forEach((item, i) => {
    const cy = y + i * spacing;
    drawCheck(ctx, x + 14, cy - 6, 14, color);
    txt(ctx, item, x + 36, cy, size, 'normal', textColor, 'left');
  });
}

function crossItems(ctx, items, x, y, size, spacing) {
  items.forEach((item, i) => {
    const cy = y + i * spacing;
    roundRect(ctx, x, cy - size, size, size, 3, '#ef4444');
    txt(ctx, 'X', x + size / 2, cy - 4, size - 6, 'bold', '#fff', 'center');
    txt(ctx, item, x + size + 10, cy, size, 'normal', '#cbd5e1', 'left');
  });
}

function avatarCard(ctx, x, y, w, h, color, initial, testimonial, reviewer) {
  roundRect(ctx, x, y, w, h, 14, 'rgba(255,255,255,0.12)', color, 2);
  ctx.beginPath();
  ctx.arc(x + 38, y + h / 2, 26, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  txt(ctx, initial, x + 38, y + h / 2 + 8, 22, 'bold', '#fff', 'center');
  const t = testimonial.length > 46 ? testimonial.slice(0, 46) + '...' : testimonial;
  txt(ctx, t, x + 76, y + h / 2 - 12, 20, 'bold', '#fff', 'left');
  drawStars(ctx, x + 76, y + h / 2 + 16, 5, 8, color);
  txt(ctx, `— ${reviewer}`, x + 76 + 5 * 13, y + h / 2 + 16, 18, 'normal', color, 'left');
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

function templatePain(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.45, 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.55, w, h * 0.45, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)');

  // Top accent bar
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 8);

  // Headline
  const headY = wrapText(ctx, copy.headline || '¿CANSADO DE NO VER RESULTADOS?',
    w / 2, 82, w - 80, 54, 'bold', color, 66, 'center');

  // Empathy line
  const subtext = (copy.primaryText || 'Sabemos exactamente como te sientes.').split('.')[0] + '.';
  txt(ctx, subtext, w / 2, headY + 10, 28, 'normal', '#e2e8f0', 'center');

  // Bullets
  const bItems = [
    copy.b1 || 'Solucion probada y efectiva',
    copy.b2 || 'Resultados desde la primera semana',
    copy.b3 || 'Sin efectos secundarios',
  ];
  bullets(ctx, bItems, 40, Math.round(h * 0.73), color, '#fff', 28, 52);

  // CTA
  pill(ctx, w / 2 - 200, h - 108, 400, 70, color, copy.cta || 'VER SOLUCION', '#fff', 30);

  // Bottom accent bar
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateDesire(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.45, 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.55, w, h * 0.45, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.8)');

  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 8);
  drawStars(ctx, w - 40 - 5 * 14, 42, 5, 9, color);

  const headY = wrapText(ctx, copy.headline || 'LOGRA EL RESULTADO QUE SIEMPRE QUISISTE',
    w / 2, 92, w - 80, 52, 'bold', '#fff', 62, 'center');

  // Accent underline
  ctx.fillStyle = color;
  roundRect(ctx, w / 2 - 80, headY + 8, 160, 5, 3, color);

  const bItems = [
    copy.b1 || 'Resultados visibles y duraderos',
    copy.b2 || 'Formula premium comprobada',
    copy.b3 || 'Miles de clientes satisfechos',
  ];
  bullets(ctx, bItems, 40, Math.round(h * 0.73), color, '#fff', 28, 52);
  pill(ctx, w / 2 - 220, h - 112, 440, 74, color, copy.cta || 'LO QUIERO AHORA', '#fff', 32);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateTransformation(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const half = Math.round(w / 2);

  // Left panel dark overlay
  fadeRect(ctx, 0, 0, half, h, 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.1)', false);
  // Right panel color overlay
  fadeRect(ctx, half, 0, half, h, hexToRgba(color, 0.15), hexToRgba(color, 0.55), false);
  // Bottom fade
  fadeRect(ctx, 0, h * 0.6, w, h * 0.4, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)');

  // Divider
  ctx.fillStyle = color; ctx.fillRect(half - 3, 0, 6, h);

  // VS badge
  ctx.beginPath();
  ctx.arc(half, Math.round(h * 0.22), 38, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  txt(ctx, 'VS', half, Math.round(h * 0.22) + 12, 26, 'bold', '#fff', 'center');

  // ANTES label
  roundRect(ctx, 20, 20, 130, 46, 8, '#374151');
  txt(ctx, 'ANTES', 85, 51, 24, 'bold', '#9ca3af', 'center');

  // DESPUES label
  roundRect(ctx, half + 20, 20, 166, 46, 8, color);
  txt(ctx, 'DESPUES', half + 103, 51, 24, 'bold', '#fff', 'center');

  // Panel texts
  wrapText(ctx, 'FRUSTRACION. SIN RESULTADOS.',
    Math.round(half * 0.5), Math.round(h * 0.38), half - 60, 32, 'bold', '#9ca3af', 40, 'center');
  wrapText(ctx, 'CONFIANZA. RESULTADOS REALES!',
    Math.round(half + half * 0.5), Math.round(h * 0.38), half - 60, 32, 'bold', '#fff', 40, 'center');

  // Tagline
  const tagline = copy.productName
    ? `La solucion: ${copy.productName.toUpperCase().slice(0, 30)}`
    : (copy.headline || 'EL CAMBIO QUE NECESITAS').slice(0, 36);
  txt(ctx, tagline, w / 2, Math.round(h * 0.76), 28, 'bold', color, 'center');

  pill(ctx, w / 2 - 210, h - 112, 420, 72, color, copy.cta || 'EMPIEZA EL CAMBIO', '#fff', 30);
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 8); ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateObjection(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.4, 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.6, w, h * 0.4, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.82)');
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 8);

  txt(ctx, 'MILES YA LO COMPROBARON:', w / 2, 72, 40, 'bold', '#fff', 'center');

  const t1 = copy.t1 || 'Note la diferencia en la primera semana!';
  const t2 = copy.t2 || 'Resultados increibles, lo recomiendo al 100%.';
  const cardW = Math.round(w * 0.88);
  const cardY1 = Math.round(h * 0.62);
  const cardY2 = cardY1 + 116;

  avatarCard(ctx, 30, cardY1, cardW, 100, color, 'L', t1, 'Laura M.');
  avatarCard(ctx, 30, cardY2, cardW, 100, color, 'C', t2, 'Carlos R.');

  txt(ctx, '+5,000 clientes satisfechos', w / 2, cardY2 + 130, 24, 'normal', '#94a3b8', 'center');
  drawStars(ctx, w / 2 - 5 * 12, cardY2 + 158, 5, 9, '#f59e0b');
  pill(ctx, w / 2 - 210, h - 112, 420, 72, color, copy.cta || 'PRUEBALO SIN RIESGO', '#fff', 30);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateUrgency(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.48, 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.52, w, h * 0.48, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)');

  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 64);
  txt(ctx, '** OFERTA ESPECIAL · TIEMPO LIMITADO **', w / 2, 44, 30, 'bold', '#fff', 'center');

  // Starburst circle badge
  ctx.beginPath();
  ctx.arc(w - 105, 155, 75, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
  txt(ctx, 'SOLO', w - 105, 143, 22, 'bold', '#fff', 'center');
  txt(ctx, 'HOY', w - 105, 169, 22, 'bold', '#fff', 'center');

  wrapText(ctx, copy.headline || 'OFERTA POR TIEMPO LIMITADO!',
    w / 2, 132, w - 200, 64, 'bold', '#fff', 72, 'center');

  bullets(ctx, [
    copy.description || 'Resultados garantizados',
    'Envio gratis incluido',
  ], 50, Math.round(h * 0.75), color, '#fff', 30, 50);

  pill(ctx, w / 2 - 240, h - 122, 480, 80, color, copy.cta || 'COMPRA AHORA!', '#fff', 34);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateAuthority(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.45, 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.55, w, h * 0.45, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.82)');
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 8);

  // Trophy badge
  ctx.beginPath();
  ctx.arc(62, 62, 48, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
  drawStars(ctx, 62 - 2 * 14, 76, 1, 14, '#fff');

  wrapText(ctx, copy.headline || 'FORMULA PREMIUM RESPALDADA POR EXPERTOS',
    128, 52, w - 148, 40, 'bold', '#fff', 50, 'left');

  const feats = [
    copy.f1 || 'Ingredientes certificados de alta calidad',
    copy.f2 || 'Resultados comprobados',
    copy.f3 || 'Sin contraindicaciones',
    copy.f4 || 'Fabricacion bajo estandares premium',
  ];
  feats.forEach((f, i) => {
    const fy = Math.round(h * 0.67) + i * 58;
    roundRect(ctx, 30, fy, 46, 46, 8, color);
    drawCheck(ctx, 53, fy + 23, 11, color);
    txt(ctx, f, 90, fy + 30, 24, 'normal', '#e2e8f0', 'left');
  });

  pill(ctx, w / 2 - 160, h - 102, 320, 66, color, copy.cta || 'VER MAS', '#fff', 28);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateComparison(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const half = Math.round(w / 2);

  // Left panel
  fadeRect(ctx, 0, 0, half, h, 'rgba(15,23,42,0.82)', 'rgba(30,41,59,0.5)', false);
  // Right panel
  const cg = ctx.createLinearGradient(half, 0, w, 0);
  cg.addColorStop(0, hexToRgba(color, 0.2));
  cg.addColorStop(1, hexToRgba(color, 0.6));
  ctx.fillStyle = cg; ctx.fillRect(half, 0, half, h);
  // Bottom fade
  fadeRect(ctx, 0, h * 0.6, w, h * 0.4, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)');

  // Top banner
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, w, 70);
  txt(ctx, 'POR QUE ELEGIRNOS?', w / 2, 47, 34, 'bold', '#fff', 'center');

  // Column headers
  roundRect(ctx, 20, 90, half - 40, 52, 10, '#374151');
  txt(ctx, 'OTROS', half / 2, 124, 26, 'bold', '#9ca3af', 'center');

  const brand = (copy.productName || 'NOSOTROS').toUpperCase().slice(0, 14);
  roundRect(ctx, half + 20, 90, half - 40, 52, 10, color);
  txt(ctx, brand, half + half / 2, 124, 24, 'bold', '#fff', 'center');

  // VS badge
  ctx.beginPath(); ctx.arc(half, 116, 32, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();
  txt(ctx, 'VS', half, 124, 22, 'bold', color, 'center');

  // Divider
  ctx.fillStyle = color; ctx.globalAlpha = 0.6;
  ctx.fillRect(half - 2, 160, 4, Math.round(h * 0.56));
  ctx.globalAlpha = 1;

  const leftItems  = [copy.l1 || 'Resultados genericos', copy.l2 || 'Sin soporte al cliente', copy.l3 || 'Calidad dudosa'];
  const rightItems = [copy.r1 || 'Resultados comprobados', copy.r2 || 'Soporte personalizado', copy.r3 || 'Calidad premium garantizada'];

  crossItems(ctx, leftItems, 28, 210, 24, 52);
  bullets(ctx, rightItems, half + 28, 210, color, '#fff', 24, 52);

  pill(ctx, w / 2 - 200, h - 112, 400, 72, color, copy.cta || 'ELIGE LO MEJOR!', '#fff', 30);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateGuarantee(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.4, 'rgba(0,0,0,0.68)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.6, w, h * 0.4, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.82)');
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 8);

  // Shield shape
  roundRect(ctx, w / 2 - 70, 26, 140, 120, 20, color);
  roundRect(ctx, w / 2 - 50, 44, 100, 84, 12, 'rgba(255,255,255,0.2)');
  txt(ctx, 'GRTIA', w / 2, 100, 30, 'bold', '#fff', 'center');

  txt(ctx, 'GARANTIA TOTAL', w / 2, 168, 44, 'bold', '#fff', 'center');
  txt(ctx, 'DE DEVOLUCION', w / 2, 210, 32, 'bold', color, 'center');
  pill(ctx, w / 2 - 180, 230, 360, 58, color, '100% GARANTIZADO', '#fff', 26);

  const terms = (copy.primaryText || 'Si no ves resultados en 30 dias te devolvemos tu dinero.').split('.')[0].slice(0, 60) + '.';
  txt(ctx, terms, w / 2, 342, 22, 'normal', '#cbd5e1', 'center');

  const bItems = [copy.b1 || 'Devolucion completa si no funciona', copy.b2 || 'Sin preguntas', copy.b3 || 'Proceso simple y rapido'];
  bullets(ctx, bItems, 40, Math.round(h * 0.73), color, '#fff', 26, 50);

  pill(ctx, w / 2 - 200, h - 112, 400, 72, color, copy.cta || 'COMPRA SIN RIESGO!', '#fff', 30);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateSocialProof(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.42, 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.58, w, h * 0.42, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)');
  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 8);

  txt(ctx, '+10,000', w / 2, 90, 62, 'bold', '#fff', 'center');
  txt(ctx, 'CLIENTES SATISFECHOS', w / 2, 140, 32, 'bold', color, 'center');
  drawStars(ctx, w / 2 - 5 * 16, 188, 5, 12, color);
  txt(ctx, '4.9/5 · Mas de 800 resenas verificadas', w / 2, 224, 22, 'normal', '#94a3b8', 'center');

  const r1 = copy.r1 || 'Increible, lo note en la primera semana de uso!';
  const r2 = copy.r2 || 'Supero mis expectativas. 100% recomendado.';
  const cardW = Math.round(w * 0.88);
  const cardY1 = Math.round(h * 0.63);
  avatarCard(ctx, 30, cardY1, cardW, 96, color, 'C', r1, 'Camila R.');
  avatarCard(ctx, 30, cardY1 + 108, cardW, 96, color, 'D', r2, 'Diego M.');

  pill(ctx, w / 2 - 180, h - 106, 360, 68, color, copy.cta || 'UNETE A ELLOS!', '#fff', 28);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templateCuriosity(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.5, 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.1)');
  fadeRect(ctx, 0, h * 0.5, w, h * 0.5, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.88)');

  // Hook strip — measure headline first
  ctx.font = 'bold 52px Inter, sans-serif';
  const headLines = [];
  const words = (copy.headline || 'SABIAS QUE LA MAYORIA LO HACE MAL?').split(' ');
  let line = '';
  for (const w2 of words) {
    const t = line ? `${line} ${w2}` : w2;
    if (ctx.measureText(t).width > w - 80 && line) { headLines.push(line); line = w2; }
    else line = t;
  }
  if (line) headLines.push(line);
  const stripH = 60 + headLines.length * 62;
  ctx.fillStyle = color; ctx.globalAlpha = 0.92;
  ctx.fillRect(0, 0, w, stripH);
  ctx.globalAlpha = 1;

  let hy = 58;
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  headLines.forEach(l => { ctx.fillText(l, w / 2, hy); hy += 62; });

  txt(ctx, copy.description || 'Lo que nadie te habia contado hasta ahora',
    w / 2, hy + 12, 26, 'normal', 'rgba(255,255,255,0.85)', 'center');

  const hints = [
    copy.h1 || 'El error que todos cometen sin saberlo',
    copy.h2 || 'La solucion que cambia todo',
    copy.h3 || 'Resultados que no esperabas posibles',
  ];
  hints.forEach((hint, i) => {
    const hy2 = Math.round(h * 0.72) + i * 52;
    txt(ctx, '>>', 50, hy2, 28, 'bold', color, 'left');
    txt(ctx, hint, 94, hy2, 26, 'normal', '#e2e8f0', 'left');
  });

  pill(ctx, w / 2 - 230, h - 114, 460, 74, color, copy.cta || 'DESCUBRE EL SECRETO', '#fff', 28);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
}

function templatePrice(copy, color, w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  fadeRect(ctx, 0, 0, w, h * 0.45, 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0)');
  fadeRect(ctx, 0, h * 0.55, w, h * 0.45, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)');

  ctx.fillStyle = color; ctx.fillRect(0, 0, w, 68);
  txt(ctx, '** OFERTA ESPECIAL · TIEMPO LIMITADO **', w / 2, 46, 30, 'bold', '#fff', 'center');

  // Old price + strikethrough
  txt(ctx, 'Precio normal: $150.000', w / 2, 160, 40, 'normal', '#94a3b8', 'center');
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, 142); ctx.lineTo(w * 0.85, 142);
  ctx.stroke();

  txt(ctx, '50% OFF!', w / 2, 234, 74, 'bold', '#fff', 'center');
  txt(ctx, 'SOLO $75.000', w / 2, 286, 34, 'bold', color, 'center');

  txt(ctx, copy.description || 'Incluye: producto + envio gratis + garantia 30 dias',
    w / 2, Math.round(h * 0.74), 24, 'normal', '#e2e8f0', 'center');
  txt(ctx, 'Solo por esta semana · Quedan pocas unidades',
    w / 2, Math.round(h * 0.74) + 42, 24, 'bold', '#ef4444', 'center');

  pill(ctx, w / 2 - 240, h - 120, 480, 80, color, copy.cta || 'APROVECHA AHORA!', '#fff', 34);
  ctx.fillStyle = color; ctx.fillRect(0, h - 8, w, 8);

  return canvas.toBuffer('image/png');
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
 * Returns a PNG Buffer for the given angle template.
 * @param {string} angle
 * @param {object} copy  - { headline, primaryText, description, cta, productName, ... }
 * @param {string} color - primary hex color
 * @param {string} format - 'square' | 'vertical' | 'horizontal'
 * @returns {Buffer} PNG buffer
 */
function buildTemplate(angle, copy, color, format) {
  const { w, h } = DIMS[format] || DIMS.square;
  const fn = TEMPLATE_FNS[angle] || TEMPLATE_FNS.desire;
  return fn(copy || {}, color || '#6366f1', w, h);
}

module.exports = { buildTemplate, DIMS };
