import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const features = [
  {
    icon: '⚡',
    title: 'Dashboard en tiempo real',
    desc: 'ROAS, inversión y facturación de tus últimos 7 días en una sola pantalla. Sin abrir el Administrador de Meta.'
  },
  {
    icon: '🤖',
    title: 'Análisis experto con IA',
    desc: 'Un experto en Meta Ads analiza tus campañas automáticamente y te dice exactamente qué pausar, escalar o cambiar.'
  },
  {
    icon: '🎨',
    title: 'Generador de imágenes de la mejor calidad',
    desc: 'Sube la foto de tu producto, elige el estilo y nuestro generador crea creativos de alto nivel listos para publicar.'
  },
  {
    icon: '🛍️',
    title: 'Vitrina de productos',
    desc: 'Tu catálogo siempre disponible. Agrega precio, link y descripción para crear anuncios en segundos.'
  },
  {
    icon: '📋',
    title: 'Reglas automáticas',
    desc: 'Configura condiciones: si el ROAS baja de X, pausa la campaña. Si el CPA sube, ajusta el presupuesto. Sin trabajo manual.'
  },
  {
    icon: '🚀',
    title: 'Constructor de campañas',
    desc: 'Crea campañas completas directamente desde la app con copy generado por IA y múltiples creativos.'
  }
];

const steps = [
  {
    number: '01',
    title: 'Conecta tu cuenta de Meta Ads',
    desc: 'Solo necesitas tu System User Access Token y tu Ad Account ID. Se configura una vez.'
  },
  {
    number: '02',
    title: 'Agrega tus productos y configura reglas',
    desc: 'Sube tu catálogo y define cuándo la IA debe actuar sobre tus campañas.'
  },
  {
    number: '03',
    title: 'Deja que MetaFlow.AI trabaje por ti',
    desc: 'Analiza, genera imágenes de la mejor calidad, optimiza y toma decisiones con inteligencia artificial.'
  }
];

const testimonials = [
  {
    name: 'Carolina Restrepo',
    role: 'Fundadora · Tienda de moda online',
    avatar: 'CR',
    text: 'Antes perdía horas revisando campañas manualmente. Con MetaFlow.AI mi ROAS subió de 2.1x a 4.8x en el primer mes. El análisis automático me dice exactamente qué hacer sin que yo tenga que adivinar.'
  },
  {
    name: 'Andrés Mejía',
    role: 'Director de Marketing · E-commerce de electrónica',
    avatar: 'AM',
    text: 'El generador de imágenes es increíble. En minutos tengo creativos de calidad profesional para mis anuncios. Antes pagaba a un diseñador $500 USD al mes — ahora lo hago en segundos.'
  },
  {
    name: 'Valentina Torres',
    role: 'CEO · Marca de cosméticos',
    avatar: 'VT',
    text: 'Las reglas automáticas me salvaron el presupuesto. Una campaña se estaba comiendo la plata sin conversiones y MetaFlow.AI la pausó sola. Ya no me preocupa que algo salga mal de noche o en fin de semana.'
  },
  {
    name: 'Felipe Gómez',
    role: 'Growth Manager · SaaS B2B',
    avatar: 'FG',
    text: 'La vitrina de productos conectada al creador de anuncios es un game changer. Selecciono el producto, genero la imagen y lanzo el anuncio en menos de 5 minutos. Antes eso me tomaba medio día.'
  }
];

const plans = [
  {
    name: 'Plan Pro',
    price: '$99.900',
    period: 'COP / mes',
    badge: null,
    desc: 'Acceso completo a todas las funciones. Cancela cuando quieras.',
    features: [
      'Dashboard de rendimiento en tiempo real',
      'Análisis experto con IA ilimitado',
      'Generador de imágenes con IA de alto nivel',
      'Los 11 ángulos publicitarios',
      'Vitrina de productos ilimitada',
      'Reglas automáticas inteligentes',
      'Constructor de campañas con IA',
      'Integración directa con Meta Ads',
      'Soporte prioritario'
    ],
    cta: 'Comenzar ahora',
    highlighted: true
  }
];

function CampañasScreen() {
  const campaigns = [
    { name: 'Colección Verano 2026', status: 'active', budget: '$25.000', spend: '$18.430', roas: 5.2, cpa: '$4.80' },
    { name: 'Retargeting Web', status: 'active', budget: '$15.000', spend: '$12.100', roas: 3.8, cpa: '$7.20' },
    { name: 'Lookalike Compradores', status: 'paused', budget: '$20.000', spend: '$8.940', roas: 1.9, cpa: '$14.50' },
    { name: 'Brand Awareness Q2', status: 'active', budget: '$10.000', spend: '$9.870', roas: 4.1, cpa: '$5.90' },
    { name: 'Black Friday Remarketing', status: 'paused', budget: '$30.000', spend: '$22.100', roas: 2.1, cpa: '$11.30' },
  ];
  return (
    <div className="l-sc-campaigns">
      <div className="l-sc-topbar">
        <span className="l-sc-title">Campañas · Meta Ads</span>
        <span className="l-sc-pill">Últimos 7 días</span>
      </div>
      <div className="l-sc-table-wrap">
        <table className="l-sc-table">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Estado</th>
              <th>Presupuesto/día</th>
              <th>Gasto</th>
              <th>ROAS</th>
              <th>CPA</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.name}>
                <td className="l-sc-campname">{c.name}</td>
                <td><span className={`l-sc-status ${c.status}`}>{c.status === 'active' ? '● Activa' : '● Pausada'}</span></td>
                <td>{c.budget}</td>
                <td>{c.spend}</td>
                <td><span className={`l-sc-roas ${c.roas >= 3 ? 'good' : c.roas >= 2 ? 'warn' : 'bad'}`}>{c.roas}x</span></td>
                <td>{c.cpa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalisisScreen() {
  return (
    <div className="l-sc-analysis">
      <div className="l-sc-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span className="l-sc-title">Análisis experto — Últimos 7 días</span>
        </div>
        <span className="l-sc-pill purple">Generado hace 2 horas</span>
      </div>
      <div className="l-sc-ai-body">
        <div className="l-sc-ai-block">
          <div className="l-sc-ai-label">📊 Resumen ejecutivo</div>
          <p className="l-sc-ai-text">Tu ROAS promedio esta semana fue <strong>4.43x</strong>, por encima del benchmark del sector (3.2x). Invertiste <strong>$4.820</strong> generando <strong>$21.390</strong> en ventas. Tu campaña más rentable tiene un ROAS de 5.2x con un CPA de solo $4.80.</p>
        </div>
        <div className="l-sc-ai-block">
          <div className="l-sc-ai-label">✅ Recomendaciones de acción</div>
          <div className="l-sc-ai-rec">
            <span className="l-sc-ai-rec-tag scale">Escalar</span>
            <p>"Colección Verano 2026" — ROAS 5.2x con CPA de $4.80. Aumenta el presupuesto un 30% esta semana para maximizar retorno.</p>
          </div>
          <div className="l-sc-ai-rec">
            <span className="l-sc-ai-rec-tag pause">Pausar</span>
            <p>"Lookalike Compradores" — ROAS de 1.9x por debajo del umbral mínimo. CPA de $14.50 es 3x el valor óptimo.</p>
          </div>
          <div className="l-sc-ai-rec">
            <span className="l-sc-ai-rec-tag creative">Creativos</span>
            <p>"Retargeting Web" lleva 14 días con los mismos creativos y el CTR bajó 18%. Renueva las imágenes esta semana.</p>
          </div>
        </div>
        <div className="l-sc-ai-block warn">
          <div className="l-sc-ai-label">⚠️ Alerta de frecuencia</div>
          <p className="l-sc-ai-text">La frecuencia en "Brand Awareness Q2" llegó a <strong>4.2</strong>. La audiencia está saturada — renueva los creativos antes del lunes para evitar caída del ROAS.</p>
        </div>
      </div>
    </div>
  );
}

function ReglasScreen() {
  const rules = [
    { status: 'active', condition: 'ROAS < 2.0 por 2 días consecutivos', action: 'Pausar campaña automáticamente', scope: 'Todas las campañas', freq: 'Verificación diaria', color: 'red' },
    { status: 'active', condition: 'CPA > $12 USD por 3 días seguidos', action: 'Reducir presupuesto un 20%', scope: 'Campañas de conversión', freq: 'Verificación diaria', color: 'orange' },
    { status: 'active', condition: 'ROAS > 5.0 y gasto > $10.000/día', action: 'Aumentar presupuesto un 25%', scope: 'Todas las campañas', freq: 'Verificación diaria', color: 'green' },
    { status: 'paused', condition: 'Frecuencia > 4.5 en los últimos 7 días', action: 'Notificar por email', scope: 'Campañas de awareness', freq: 'Cada 6 horas', color: 'purple' },
  ];
  return (
    <div className="l-sc-rules">
      <div className="l-sc-topbar">
        <span className="l-sc-title">Reglas automáticas</span>
        <button className="l-sc-btn">+ Nueva regla</button>
      </div>
      <div className="l-sc-rules-list">
        {rules.map((r, i) => (
          <div key={i} className={`l-sc-rule-card ${r.status}`}>
            <div className="l-sc-rule-left">
              <div className={`l-sc-rule-dot ${r.color}`} />
            </div>
            <div className="l-sc-rule-body">
              <div className="l-sc-rule-row">
                <span className="l-sc-rule-kw if">SI</span>
                <span className="l-sc-rule-cond">{r.condition}</span>
              </div>
              <div className="l-sc-rule-row">
                <span className="l-sc-rule-kw then">ENTONCES</span>
                <span className="l-sc-rule-action">{r.action}</span>
              </div>
              <div className="l-sc-rule-meta">{r.scope} · {r.freq}</div>
            </div>
            <div className="l-sc-rule-right">
              <span className={`l-sc-status ${r.status}`}>{r.status === 'active' ? '● Activa' : '● Pausada'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImagenScreen() {
  return (
    <div className="l-sc-imagen">
      <div className="l-sc-topbar">
        <span className="l-sc-title">Generador de imagen IA</span>
        <span className="l-sc-pill purple">✨ Lista para publicar</span>
      </div>
      <div className="l-sc-imagen-body">
        <div className="l-sc-imagen-left">
          <div className="l-sc-img-label">Foto del producto subida</div>
          <div className="l-sc-img-upload">
            <div className="l-sc-img-product-mock">
              <div className="l-sc-img-glow" />
              <div className="l-sc-img-bottle">
                <div className="l-sc-bottle-cap" />
                <div className="l-sc-bottle-body">
                  <div className="l-sc-bottle-label">LUMIÈRE<br /><small>Sérum facial</small></div>
                </div>
              </div>
            </div>
            <div className="l-sc-img-filename">lumiere_serum_hd.jpg</div>
          </div>
          <div className="l-sc-img-label" style={{ marginTop: 14 }}>Estilo del anuncio</div>
          <div className="l-sc-style-chips">
            {['Editorial premium', 'Lifestyle', 'Minimalista'].map((s, i) => (
              <span key={s} className={`l-sc-chip ${i === 0 ? 'selected' : ''}`}>{s}</span>
            ))}
          </div>
          <div className="l-sc-img-label" style={{ marginTop: 10 }}>Formato</div>
          <div className="l-sc-style-chips">
            {['1:1 Feed', '9:16 Story', '1.91:1 Banner'].map((s, i) => (
              <span key={s} className={`l-sc-chip ${i === 0 ? 'selected' : ''}`}>{s}</span>
            ))}
          </div>
          <div className="l-sc-img-label" style={{ marginTop: 10 }}>Colores de marca</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#7c3aed', border: '2px solid rgba(255,255,255,0.15)' }} />
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f5f0ff', border: '2px solid rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 10, color: '#475569' }}>Primario · Secundario</span>
          </div>
        </div>
        <div className="l-sc-imagen-right">
          <div className="l-sc-img-label">Imagen generada por IA</div>
          <div className="l-sc-img-result">
            <div className="l-sc-img-beauty-mock">
              <div className="l-sc-beauty-bg" />
              <div className="l-sc-beauty-glow-1" />
              <div className="l-sc-beauty-glow-2" />
              <div className="l-sc-beauty-bottle">
                <div className="l-sc-bb-cap" />
                <div className="l-sc-bb-body">
                  <div className="l-sc-bb-shine" />
                  <div className="l-sc-bb-label">LUMIÈRE</div>
                </div>
              </div>
              <div className="l-sc-beauty-text">
                <div className="l-sc-beauty-headline">Skin that glows</div>
                <div className="l-sc-beauty-sub">Sérum facial premium · 30ml</div>
              </div>
            </div>
            <div className="l-sc-img-actions">
              <button className="l-sc-btn primary">⬇ Descargar HD</button>
              <button className="l-sc-btn">🚀 Publicar anuncio</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SCREEN_TABS = [
  { id: 'Campañas', icon: '📊', label: 'Campañas' },
  { id: 'Análisis IA', icon: '🤖', label: 'Análisis IA' },
  { id: 'Reglas', icon: '⚙️', label: 'Reglas automáticas' },
  { id: 'Imagen IA', icon: '🎨', label: 'Crear imagen IA' },
];

const SIDEBAR_ITEMS = [
  { screen: null, label: 'Dashboard' },
  { screen: 'Campañas', label: 'Campañas' },
  { screen: 'Análisis IA', label: 'Análisis IA' },
  { screen: 'Reglas', label: 'Reglas' },
  { screen: null, label: 'Productos' },
  { screen: 'Imagen IA', label: 'Crear Imagen' },
];

export default function Landing() {
  const [activeScreen, setActiveScreen] = useState('Campañas');

  return (
    <>
      <Head>
        <title>MetaFlow.AI — El copiloto de IA para tus Meta Ads</title>
        <meta name="description" content="Automatiza, analiza y crea anuncios de alto nivel para Meta Ads con inteligencia artificial. Gestiona campañas, genera creativos y optimiza tu ROAS." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="MetaFlow.AI — El copiloto de IA para tus Meta Ads" />
        <meta property="og:description" content="Automatiza, analiza y crea anuncios de alto nivel para Facebook e Instagram Ads con IA." />
      </Head>

      <div className="landing">

        {/* ── NAV ── */}
        <nav className="l-nav">
          <div className="l-nav-inner">
            <div className="l-logo">
              <div className="l-logo-mark">⚡</div>
              <span>MetaFlow.AI</span>
            </div>
            <div className="l-nav-actions">
              <a href="#precios" className="l-btn-ghost">Precios</a>
              <Link href="/?mode=login" className="l-btn-ghost">Iniciar sesión</Link>
              <Link href="/?signup=1" className="l-btn-primary">Comenzar ahora</Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="l-hero">
          <div className="l-hero-glow l-hero-glow--1" />
          <div className="l-hero-glow l-hero-glow--2" />
          <div className="l-hero-inner">
            <div className="l-badge">
              <span className="l-badge-dot" />
              $99.900 COP/mes · Cancela cuando quieras
            </div>
            <h1 className="l-hero-title">
              El copiloto de IA
              <br />
              <span className="l-gradient-text">para tus Meta Ads</span>
            </h1>
            <p className="l-hero-sub">
              Conecta tu cuenta de Meta Ads y deja que la inteligencia artificial analice tus campañas, genere creativos de la mejor calidad y optimice tu ROAS automáticamente.
            </p>
            <div className="l-hero-actions">
              <Link href="/?signup=1" className="l-cta-main">
                <span>⚡</span> Comenzar ahora
              </Link>
              <a href="#precios" className="l-cta-secondary">
                Ver planes →
              </a>
            </div>
            <p className="l-hero-hint">Configuración en minutos · Sin contrato de permanencia</p>
          </div>

          {/* App mockup */}
          <div className="l-hero-mockup">
            <div className="l-mockup-bar">
              <span className="l-dot l-dot--red" />
              <span className="l-dot l-dot--yellow" />
              <span className="l-dot l-dot--green" />
              <span className="l-mockup-url">app.metaflow.ai</span>
            </div>
            <div className="l-mockup-body">
              <div className="l-mockup-sidebar">
                {['Dashboard', 'Campañas', 'Análisis IA', 'Reglas', 'Productos', 'Crear Imagen'].map((item, i) => (
                  <div key={item} className={`l-mockup-nav-item ${i === 0 ? 'active' : ''}`}>{item}</div>
                ))}
              </div>
              <div className="l-mockup-main">
                <div className="l-mockup-metrics">
                  {[
                    { label: 'Inversión', value: '$4.820' },
                    { label: 'Facturación', value: '$21.390' },
                    { label: 'ROAS', value: '4.43x' },
                    { label: 'Campañas activas', value: '6' }
                  ].map(m => (
                    <div key={m.label} className="l-mockup-metric">
                      <span className="l-mockup-metric-val">{m.value}</span>
                      <span className="l-mockup-metric-lbl">{m.label}</span>
                    </div>
                  ))}
                </div>
                <div className="l-mockup-ai-card">
                  <div className="l-mockup-ai-icon">🤖</div>
                  <div className="l-mockup-ai-text">
                    <div className="l-mockup-ai-title">Análisis IA — últimos 7 días</div>
                    <div className="l-mockup-ai-line" />
                    <div className="l-mockup-ai-line l-mockup-ai-line--short" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SCREEN SHOWCASE ── */}
        <section className="l-section l-screens-section">
          <div className="l-section-inner">
            <div className="l-section-header">
              <p className="l-section-label">La plataforma</p>
              <h2 className="l-section-title">Ve cómo funciona en tiempo real</h2>
              <p className="l-section-sub">Explora cada módulo de MetaFlow.AI y descubre cómo transforma la gestión de tus campañas.</p>
            </div>
            <div className="l-screens-tabs">
              {SCREEN_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`l-screen-tab ${activeScreen === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveScreen(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div className="l-screen-mockup">
              <div className="l-mockup-bar">
                <span className="l-dot l-dot--red" />
                <span className="l-dot l-dot--yellow" />
                <span className="l-dot l-dot--green" />
                <span className="l-mockup-url">app.metaflow.ai</span>
              </div>
              <div className="l-screen-body">
                <div className="l-screen-sidebar">
                  {SIDEBAR_ITEMS.map((item, i) => (
                    <div key={i} className={`l-mockup-nav-item ${activeScreen === item.screen ? 'active' : ''}`}>
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="l-screen-content">
                  {activeScreen === 'Campañas' && <CampañasScreen />}
                  {activeScreen === 'Análisis IA' && <AnalisisScreen />}
                  {activeScreen === 'Reglas' && <ReglasScreen />}
                  {activeScreen === 'Imagen IA' && <ImagenScreen />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="l-section l-features-section">
          <div className="l-section-inner">
            <div className="l-section-header">
              <p className="l-section-label">Funcionalidades</p>
              <h2 className="l-section-title">Todo lo que necesitas para escalar tus anuncios</h2>
              <p className="l-section-sub">Una plataforma completa que reemplaza horas de trabajo manual con automatización inteligente.</p>
            </div>
            <div className="l-features-grid">
              {features.map(f => (
                <div key={f.title} className="l-feature-card">
                  <div className="l-feature-icon">{f.icon}</div>
                  <h3 className="l-feature-title">{f.title}</h3>
                  <p className="l-feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="l-section l-steps-section">
          <div className="l-section-inner">
            <div className="l-section-header">
              <p className="l-section-label">Cómo funciona</p>
              <h2 className="l-section-title">De cero a resultados en minutos</h2>
            </div>
            <div className="l-steps">
              {steps.map((s, i) => (
                <div key={s.number} className="l-step">
                  <div className="l-step-number">{s.number}</div>
                  <div className="l-step-content">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                  {i < steps.length - 1 && <div className="l-step-connector" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="l-section l-testimonials-section">
          <div className="l-section-inner">
            <div className="l-section-header">
              <p className="l-section-label">Testimonios</p>
              <h2 className="l-section-title">Lo que dicen quienes ya lo usan</h2>
              <p className="l-section-sub">Negocios reales que mejoraron sus resultados con MetaFlow.AI.</p>
            </div>
            <div className="l-testimonials-grid">
              {testimonials.map(t => (
                <div key={t.name} className="l-testimonial-card">
                  <div className="l-testimonial-stars">★★★★★</div>
                  <p className="l-testimonial-text">"{t.text}"</p>
                  <div className="l-testimonial-author">
                    <div className="l-testimonial-avatar">{t.avatar}</div>
                    <div>
                      <div className="l-testimonial-name">{t.name}</div>
                      <div className="l-testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="l-section l-pricing-section" id="precios">
          <div className="l-section-inner">
            <div className="l-section-header">
              <p className="l-section-label">Precios</p>
              <h2 className="l-section-title">Simple, transparente, sin sorpresas</h2>
              <p className="l-section-sub">Elige el plan que mejor se adapte a ti. Cancela cuando quieras.</p>
            </div>
            <div className="l-pricing-grid l-pricing-grid--single">
              {plans.map(plan => (
                <div key={plan.name} className="l-pricing-card highlighted">
                  <div className="l-pricing-name">{plan.name}</div>
                  <div className="l-pricing-price-row">
                    <span className="l-pricing-price">{plan.price}</span>
                    <span className="l-pricing-period">{plan.period}</span>
                  </div>
                  <p className="l-pricing-desc">{plan.desc}</p>
                  <ul className="l-pricing-features">
                    {plan.features.map(f => (
                      <li key={f}>
                        <span className="l-pricing-check">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing" className="l-pricing-cta primary">
                    {plan.cta}
                  </Link>
                  <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                    🔒 Pago seguro con Wompi · Cancela cuando quieras
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="l-section l-stats-section">
          <div className="l-section-inner">
            <div className="l-stats-grid">
              {[
                { value: 'IA', label: 'Generador de imágenes de la mejor calidad', sub: 'Creativos en segundos' },
                { value: 'IA', label: 'Análisis experto de campañas', sub: 'Optimización inteligente' },
                { value: '100%', label: 'Tus datos son solo tuyos', sub: 'Privado y seguro' },
                { value: '24/7', label: 'Tus reglas actúan siempre', sub: 'Automatización total' }
              ].map((s, i) => (
                <div key={i} className="l-stat-card">
                  <div className="l-stat-value">{s.value}</div>
                  <div className="l-stat-label">{s.label}</div>
                  <div className="l-stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="l-section l-cta-section">
          <div className="l-cta-glow" />
          <div className="l-section-inner l-cta-inner">
            <h2 className="l-cta-title">¿Listo para llevar tus anuncios<br />al siguiente nivel?</h2>
            <p className="l-cta-sub">Únete y empieza a gestionar tus Meta Ads con inteligencia artificial hoy mismo.</p>
            <Link href="/?signup=1" className="l-cta-main l-cta-main--large">
              <span>⚡</span> Comenzar ahora
            </Link>
            <p className="l-hero-hint">$99.900 COP/mes · Sin contrato de permanencia</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="l-footer">
          <div className="l-footer-inner">
            <div className="l-logo">
              <div className="l-logo-mark">⚡</div>
              <span>MetaFlow.AI</span>
            </div>
            <p className="l-footer-copy">© 2026 MetaFlow.AI — El copiloto de IA para tus Meta Ads.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
