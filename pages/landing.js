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
    name: 'Mensual',
    price: '$34',
    period: 'USD / mes',
    badge: null,
    desc: 'Acceso completo. Cancela cuando quieras.',
    features: [
      'Dashboard de rendimiento en tiempo real',
      'Análisis experto con IA ilimitado',
      'Generador de imágenes de la mejor calidad',
      'Vitrina de productos ilimitada',
      'Reglas automáticas inteligentes',
      'Constructor de campañas con IA',
      'Soporte prioritario'
    ],
    cta: 'Comenzar mensual',
    highlighted: false
  },
  {
    name: 'Anual',
    price: '$300',
    period: 'USD / año',
    badge: '¡Ahorra $108!',
    desc: 'El mejor valor. Equivale a solo $25/mes.',
    features: [
      'Todo lo del plan mensual',
      '2 meses gratis incluidos',
      'Acceso anticipado a nuevas funciones',
      'Soporte VIP prioritario',
      'Sesión de onboarding incluida',
      'Garantía de 30 días'
    ],
    cta: 'Comenzar anual',
    highlighted: true
  }
];

export default function Landing() {
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
              Desde $25 USD/mes · Cancela cuando quieras
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
            <div className="l-pricing-grid">
              {plans.map(plan => (
                <div key={plan.name} className={`l-pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
                  {plan.badge && <div className="l-pricing-badge">{plan.badge}</div>}
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
                  <Link href="/?signup=1" className={`l-pricing-cta ${plan.highlighted ? 'primary' : 'secondary'}`}>
                    {plan.cta}
                  </Link>
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
            <p className="l-hero-hint">Desde $25 USD/mes · Sin contrato de permanencia</p>
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
