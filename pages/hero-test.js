// Página de prueba AISLADA del motor product-hero (beta).
// No toca el generador en producción. Requiere haber iniciado sesión en la app
// (reusa el token de Supabase persistido en el navegador).
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getSupabaseBrowser } from '../lib/supabase-browser';

async function getAuthHeader() {
  try {
    const supabase = getSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch { return {}; }
}

export default function HeroTest() {
  const [name, setName] = useState('Spets Omegas');
  const [desc, setDesc] = useState('Suplemento de omegas full spectrum en gotas para mascotas. Mejora la piel y el pelaje de perros y gatos, aporta brillo y nutre el manto. 100 ml.');
  const [color, setColor] = useState('#A855F7');
  const [cleanLabel, setCleanLabel] = useState(true);
  const [imgB64, setImgB64] = useState('');
  const [imgPreview, setImgPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
    })();
  }, []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setImgB64(String(reader.result)); setImgPreview(String(reader.result)); };
    reader.readAsDataURL(f);
  };

  const generate = async () => {
    setError(''); setResult(null);
    if (!imgB64) { setError('Sube una imagen de producto.'); return; }
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await axios.post('/api/generate-hero', {
        productName: name, description: desc, primaryColor: color,
        productImageBase64: imgB64, cleanLabel,
      }, { headers: authHeader, timeout: 300000 });
      setResult(res.data.images?.[0] || null);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Error');
    } finally { setLoading(false); }
  };

  const wrap = { maxWidth: 1000, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#0f172a' };
  const input = { width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, marginTop: 4, fontSize: 14 };
  const label = { fontWeight: 600, fontSize: 13, marginTop: 14, display: 'block' };

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>🧪 Motor Product-Hero (beta)</h1>
      <p style={{ color: '#64748b', marginTop: 4 }}>Prueba aislada — no afecta el generador en producción.</p>

      {loggedIn === false && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 12, borderRadius: 8, marginTop: 16 }}>
          No hay sesión activa. Inicia sesión en la app principal (<a href="/">/</a>) en este mismo navegador y vuelve aquí.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
        <div>
          <label style={label}>Imagen del producto (PNG/JPG)</label>
          <input type="file" accept="image/*" onChange={onFile} style={{ marginTop: 6 }} />
          {imgPreview && <img src={imgPreview} alt="" style={{ maxHeight: 160, marginTop: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />}

          <label style={label}>Nombre del producto</label>
          <input style={input} value={name} onChange={e => setName(e.target.value)} />

          <label style={label}>Descripción (única fuente de beneficios)</label>
          <textarea style={{ ...input, minHeight: 90 }} value={desc} onChange={e => setDesc(e.target.value)} />

          <label style={label}>Color de acento</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ marginTop: 6, width: 60, height: 36 }} />

          <label style={{ ...label, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={cleanLabel} onChange={e => setCleanLabel(e.target.checked)} />
            Reconstruir etiqueta legible (clean label)
          </label>

          <button onClick={generate} disabled={loading}
            style={{ marginTop: 20, width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: loading ? '#94a3b8' : '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'default' : 'pointer' }}>
            {loading ? 'Generando… (puede tardar ~30-60s)' : 'Generar anuncio'}
          </button>
          {error && <div style={{ color: '#dc2626', marginTop: 12, fontSize: 14 }}>{error}</div>}
        </div>

        <div>
          <label style={label}>Resultado</label>
          <div style={{ marginTop: 6, border: '1px dashed #cbd5e1', borderRadius: 12, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            {loading && <span style={{ color: '#64748b' }}>Generando…</span>}
            {!loading && result && <img src={result.imageUrl} alt="creativo" style={{ maxWidth: '100%', borderRadius: 10 }} />}
            {!loading && !result && <span style={{ color: '#94a3b8' }}>Aquí aparecerá el creativo</span>}
          </div>
          {result?.copy && (
            <pre style={{ marginTop: 12, background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(result.copy, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
