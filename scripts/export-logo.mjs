import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '../public/logo-1024.svg');
const outPath = path.join(__dirname, '../public/logo-1024.png');

const svg = readFileSync(svgPath, 'utf8');

// Use macOS built-in qlmanage or rsvg-convert if available
try {
  execSync(`rsvg-convert -w 1024 -h 1024 "${svgPath}" -o "${outPath}"`);
  console.log('✓ Exported with rsvg-convert →', outPath);
  process.exit(0);
} catch {}

try {
  execSync(`inkscape "${svgPath}" --export-filename="${outPath}" --export-width=1024 --export-height=1024`);
  console.log('✓ Exported with Inkscape →', outPath);
  process.exit(0);
} catch {}

// Fallback: wrap in HTML and use Safari/qlmanage screenshot
const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;background:#0b0f19}body{width:1024px;height:1024px;overflow:hidden}</style>
</head><body>${svg}</body></html>`;

const htmlPath = path.join(__dirname, '../public/_logo_export.html');
writeFileSync(htmlPath, html);

console.log('');
console.log('Ni rsvg-convert ni Inkscape encontrados. Opciones:');
console.log('');
console.log('OPCIÓN A — Instala rsvg-convert (recomendado):');
console.log('  brew install librsvg');
console.log('  node scripts/export-logo.mjs');
console.log('');
console.log('OPCIÓN B — Abre en Chrome y usa este snippet en la consola:');
console.log(`  file://${svgPath}`);
console.log('');
console.log(`const img = new Image();
img.src = '${svgPath.replace(/\\/g, '/')}';
img.onload = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  c.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
  const a = document.createElement('a');
  a.download = 'logo-1024.png';
  a.href = c.toDataURL('image/png');
  a.click();
};`);
