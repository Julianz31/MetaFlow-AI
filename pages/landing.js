import Head from 'next/head';
import Link from 'next/link';

const features = [
  {
    icon: '⚡',
    title: 'Dashboard en tiempo real',
    desc: 'ROAS, inversión y facturación de tus últimos 7 días en una sola pantalla. Sin abrir el Administrador de Meta.'
  },
  {
    icon: '🤖',
    title: 'Análisis con IA (Claude)',
    desc: 'Un experto en Meta Ads analiza tus campañas automáticamente y te dice exactamente qué pausar, escalar o cambiar.'
  },
  {
    icon: '🎨',
    title: 'Imágenes IA para anuncios',
    desc: 'Sube la foto de tu producto, elige el estilo y DALL-E 3 genera creativos de alto nivel listos para publicar.'
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
    desc: 'Crea campañas completas directamente desde la app con el copy generado por IA y múltiples creativos.'
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
    desc: 'Analiza, genera imágenes, optimiza y toma decisiones con inteligencia artificial.'
  }
];

export default function Landing() {
  return (
    <>
      <Head>
        <title>MetaFlow.AI — El copiloto de IA para tus Meta Ads</title>
        <meta name="description" content="Automatiza, analiza y crea anuncios de alto nivel para Meta Ads con inteligencia artificial. Gestiona campañas, genera creativos con DALL-E 3 y optimiza tu ROAS." />
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
              <Link href="/?mode=login" className="l-btn-ghost">Iniciar sesión</Link>
              <Link href="/?signup=1" className="l-btn-primary">Comenzar gratis</Link>
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
              Ahora disponible — Regístrate gratis
            </div>
            <h1 className="l-hero-title">
              El copiloto de IA
              <br />
              <span className="l-gradient-text">para tus Meta Ads</span>
            </h1>
            <p className="l-hero-sub">
              Conecta tu cuenta de Meta Ads y deja que la inteligencia artificial analice tus campañas, genere creativos de alto nivel y optimice tu ROAS automáticamente.
            </p>
            <div className="l-hero-actions">
              <Link href="/?signup=1" className="l-cta-main">
                <span>⚡</span> Comenzar gratis ahora
              </Link>
              <Link href="/?mode=login" className="l-cta-secondary">
                Ya tengo cuenta →
              </Link>
            </div>
            <p className="l-hero-hint">Sin tarjeta de crédito · Configuración en minutos</p>
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

        {/* ── STATS ── */}
        <section className="l-section l-stats-section">
          <div className="l-section-inner">
            <div className="l-stats-grid">
              {[
                { value: 'DALL-E 3', label: 'Para imágenes de alto nivel', sub: 'HD quality' },
                { value: 'Claude AI', label: 'Para análisis experto', sub: 'Anthropic' },
                { value: '100%', label: 'Tus datos son solo tuyos', sub: 'Privado y seguro' },
                { value: '24/7', label: 'Tus reglas actúan siempre', sub: 'Automatización' }
              ].map(s => (
                <div key={s.value} className="l-stat-card">
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
              <span>⚡</span> Crear mi cuenta gratis
            </Link>
            <p className="l-hero-hint">Sin tarjeta de crédito · Sin límite de tiempo</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="l-footer">
          <div className="l-footer-inner">
            <div className="l-logo">
              <div className="l-logo-mark">⚡</div>
              <span>MetaFlow.AI</span>
            </div>
            <p className="l-footer-copy">© 2026 MetaFlow.AI — Construido con IA para expertos en Meta Ads.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
