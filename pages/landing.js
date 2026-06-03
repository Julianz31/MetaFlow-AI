// New MetaFlow Landing Page — pages/landing.js
// Replace the entire content of pages/landing.js with this file

import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

const PLANS = [
  {
    name: 'Pro',
    price: '$99.900',
    period: 'COP / mes',
    highlight: false,
    badge: null,
    meta: '1 cuenta Meta',
    credits: '700 créditos IA',
    images: '60 imágenes',
    whatsapp: '1 agente WhatsApp',
    features: [
      '1 cuenta publicitaria',
      '700 créditos IA al mes',
      '60 imágenes generadas',
      'Los 11 ángulos publicitarios',
      'Dashboard en tiempo real',
      'Análisis y recomendaciones IA',
      'Reglas automáticas',
      'Agente WhatsApp incluido',
      'Generador de landing pages',
    ],
  },
  {
    name: 'Business',
    price: '$209.900',
    period: 'COP / mes',
    highlight: true,
    badge: 'Más popular',
    meta: '3 cuentas Meta',
    credits: '1.800 créditos IA',
    images: '150 imágenes',
    whatsapp: '3 agentes WhatsApp',
    features: [
      '3 cuentas publicitarias',
      '1.800 créditos IA al mes',
      '150 imágenes generadas',
      'Los 11 ángulos publicitarios',
      'Dashboard en tiempo real',
      'Análisis y recomendaciones IA',
      'Reglas automáticas',
      '3 agentes WhatsApp',
      'Generador de landing pages',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Agency',
    price: '$359.900',
    period: 'COP / mes',
    highlight: false,
    badge: null,
    meta: '10 cuentas Meta',
    credits: '4.000 créditos IA',
    images: '350 imágenes',
    whatsapp: '10 agentes WhatsApp',
    features: [
      '10 cuentas publicitarias',
      '4.000 créditos IA al mes',
      '350 imágenes generadas',
      'Los 11 ángulos publicitarios',
      'Dashboard en tiempo real',
      'Análisis y recomendaciones IA',
      'Reglas automáticas',
      '10 agentes WhatsApp',
      'Generador de landing pages',
      'Soporte prioritario',
      'Acceso anticipado a nuevas funciones',
    ],
  },
]

const FEATURES = [
  {
    icon: '📊',
    title: 'Dashboard en tiempo real',
    desc: 'ROAS, inversión y facturación de los últimos 7 días en una sola pantalla. Sin abrir el Administrador de Meta.',
    color: '#FF6B2B',
  },
  {
    icon: '🤖',
    title: 'Análisis experto con IA',
    desc: 'Un experto en Meta Ads analiza tus campañas y te dice exactamente qué pausar, escalar o cambiar.',
    color: '#7C3AED',
  },
  {
    icon: '🎨',
    title: 'Generador de imágenes IA',
    desc: 'Sube la foto de tu producto y obtén creativos de alto nivel listos para publicar en segundos.',
    color: '#0EA5E9',
  },
  {
    icon: '💬',
    title: 'Agente WhatsApp 24/7',
    desc: 'Tu bot responde, califica y cierra ventas mientras duermes. Conectado directamente a tus campañas.',
    color: '#22C55E',
  },
  {
    icon: '🛍️',
    title: 'Vitrina de productos',
    desc: 'Tu catálogo siempre disponible. Agrega precio, link y descripción para crear anuncios en segundos.',
    color: '#F59E0B',
  },
  {
    icon: '⚙️',
    title: 'Reglas automáticas',
    desc: 'Si el ROAS baja de X, pausa la campaña. Si el CPA sube, ajusta el presupuesto. Sin trabajo manual.',
    color: '#EF4444',
  },
  {
    icon: '🚀',
    title: 'Constructor de campañas',
    desc: 'Crea campañas completas con copy generado por IA y múltiples creativos desde la misma plataforma.',
    color: '#8B5CF6',
  },
  {
    icon: '🌐',
    title: 'Generador de landing pages',
    desc: 'Genera páginas de venta optimizadas para conversión en segundos, listas para conectar a tus anuncios.',
    color: '#06B6D4',
  },
]

const TESTIMONIALS = [
  {
    name: 'Carolina Restrepo',
    role: 'Fundadora · Tienda de moda online',
    text: 'Antes perdía horas revisando campañas. Con MetaFlow mi ROAS subió de 2.1x a 4.8x en el primer mes. El análisis automático me dice exactamente qué hacer.',
    stars: 5,
    initials: 'CR',
  },
  {
    name: 'Andrés Mejía',
    role: 'Director de Marketing · E-commerce',
    text: 'El generador de imágenes es increíble. En minutos tengo creativos profesionales. Antes pagaba $500 USD al mes a un diseñador — ahora lo hago en segundos.',
    stars: 5,
    initials: 'AM',
  },
  {
    name: 'Valentina Torres',
    role: 'CEO · Marca de cosméticos',
    text: 'Las reglas automáticas me salvaron el presupuesto. Una campaña se estaba comiendo la plata sin conversiones y MetaFlow la pausó sola.',
    stars: 5,
    initials: 'VT',
  },
  {
    name: 'Felipe Gómez',
    role: 'Growth Manager · SaaS B2B',
    text: 'El agente de WhatsApp es un game changer. Mis leads llegan del anuncio y el bot los cierra automáticamente. Ya no necesito estar pegado al celular.',
    stars: 5,
    initials: 'FG',
  },
]

const PAINS = [
  { emoji: '😩', text: '¿Inviertes en anuncios pero no sabes si están funcionando?' },
  { emoji: '⏰', text: '¿Pasas horas revisando campañas que deberían gestionarse solas?' },
  { emoji: '💸', text: '¿Se te va el presupuesto en campañas malas mientras duermes?' },
  { emoji: '📱', text: '¿Recibes mensajes de clientes y no tienes tiempo de responder?' },
  { emoji: '🎨', text: '¿Gastas fortunas en diseñadores para creativos de anuncios?' },
  { emoji: '📉', text: '¿Tu ROAS cae y no entiendes por qué ni qué hacer?' },
]

export default function Landing() {
  const [activeTab, setActiveTab] = useState(0)
  const [visibleSections, setVisibleSections] = useState({})
  const sectionRefs = useRef({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })
    return () => observer.disconnect()
  }, [])

  const setRef = (id) => (el) => {
    sectionRefs.current[id] = el
  }

  const tabs = ['📊 Campañas', '🤖 Análisis IA', '⚙️ Reglas', '🎨 Imagen IA', '💬 WhatsApp']

  return (
    <>
      <Head>
        <title>MetaFlow.AI — Automatiza tu negocio online con IA</title>
        <meta name="description" content="Gestiona campañas, crea creativos, responde clientes 24/7 y genera landing pages con inteligencia artificial. La plataforma todo-en-uno para vender más online." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --orange: #FF6B2B;
          --orange-dim: #FF6B2B22;
          --dark: #080B14;
          --dark2: #0E1220;
          --dark3: #151A2B;
          --dark4: #1C2236;
          --border: rgba(255,255,255,0.08);
          --text: #F0F2F8;
          --muted: rgba(240,242,248,0.55);
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: var(--text); font-family: var(--font-body); font-size: 16px; line-height: 1.6; overflow-x: hidden; }
        .container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }

        /* NAV */
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 16px 0; background: rgba(8,11,20,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; }
        .nav-logo { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--text); text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .nav-logo span { color: var(--orange); }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-links a { color: var(--muted); text-decoration: none; font-size: 15px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--text); }
        .btn-nav { background: var(--orange); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.2s, transform 0.2s; }
        .btn-nav:hover { opacity: 0.9; transform: translateY(-1px); }

        /* HERO */
        .hero { padding: 160px 0 100px; position: relative; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; z-index: 0; }
        .hero-bg-circle { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,43,0.15) 0%, transparent 70%); top: -100px; left: 50%; transform: translateX(-50%); }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 60px 60px; }
        .hero-content { position: relative; z-index: 1; text-align: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,107,43,0.12); border: 1px solid rgba(255,107,43,0.3); border-radius: 100px; padding: 6px 16px; font-size: 13px; color: var(--orange); margin-bottom: 32px; font-weight: 500; }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--orange); animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }
        h1 { font-family: var(--font-display); font-size: clamp(42px, 6vw, 80px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; margin-bottom: 24px; }
        h1 em { font-style: normal; color: var(--orange); }
        .hero-sub { font-size: clamp(17px, 2vw, 20px); color: var(--muted); max-width: 620px; margin: 0 auto 48px; line-height: 1.6; }
        .hero-ctas { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: var(--orange); color: white; border: none; padding: 16px 36px; border-radius: 10px; font-family: var(--font-body); font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,107,43,0.35); }
        .btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); padding: 16px 36px; border-radius: 10px; font-family: var(--font-body); font-size: 16px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); }
        .hero-meta { margin-top: 20px; font-size: 13px; color: var(--muted); }

        /* PAIN */
        .pain-section { padding: 80px 0; }
        .section-label { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--orange); margin-bottom: 16px; }
        .section-title { font-family: var(--font-display); font-size: clamp(30px, 4vw, 48px); font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; }
        .section-sub { color: var(--muted); font-size: 18px; max-width: 560px; }
        .pain-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-top: 48px; }
        .pain-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; transition: border-color 0.2s, transform 0.2s; }
        .pain-card:hover { border-color: rgba(255,107,43,0.3); transform: translateY(-2px); }
        .pain-emoji { font-size: 28px; flex-shrink: 0; }
        .pain-text { font-size: 15px; color: var(--muted); line-height: 1.5; }

        /* SOLUTION BANNER */
        .solution-banner { background: linear-gradient(135deg, var(--orange) 0%, #FF3D00 100%); border-radius: 20px; padding: 48px; text-align: center; margin: 0 0 80px; position: relative; overflow: hidden; }
        .solution-banner::before { content: ''; position: absolute; top: -40%; right: -10%; width: 400px; height: 400px; border-radius: 50%; background: rgba(255,255,255,0.08); }
        .solution-banner h2 { font-family: var(--font-display); font-size: clamp(26px, 4vw, 42px); font-weight: 800; color: white; margin-bottom: 16px; position: relative; z-index: 1; }
        .solution-banner p { color: rgba(255,255,255,0.85); font-size: 18px; position: relative; z-index: 1; }

        /* FEATURES */
        .features-section { padding: 80px 0; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 56px; }
        .feature-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: all 0.3s; position: relative; overflow: hidden; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-color, var(--orange)); opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-4px); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { font-size: 32px; margin-bottom: 16px; display: block; }
        .feature-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; margin-bottom: 10px; }
        .feature-desc { color: var(--muted); font-size: 14px; line-height: 1.6; }

        /* DEMO TABS */
        .demo-section { padding: 80px 0; }
        .tab-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
        .tab-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 10px 20px; border-radius: 8px; font-family: var(--font-body); font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: var(--orange); border-color: var(--orange); color: white; }
        .tab-btn:not(.active):hover { border-color: rgba(255,255,255,0.2); color: var(--text); }
        .demo-screen { background: var(--dark2); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .demo-topbar { background: var(--dark3); padding: 12px 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); }
        .demo-dot { width: 10px; height: 10px; border-radius: 50%; }
        .demo-url { background: var(--dark4); border-radius: 6px; padding: 4px 16px; font-size: 12px; color: var(--muted); flex: 1; max-width: 300px; }
        .demo-content { padding: 32px; min-height: 320px; }
        .demo-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .demo-stat { background: var(--dark3); border-radius: 10px; padding: 16px; text-align: center; }
        .demo-stat-val { font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--orange); }
        .demo-stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }
        .demo-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .demo-table th { text-align: left; padding: 10px 12px; color: var(--muted); font-weight: 500; border-bottom: 1px solid var(--border); }
        .demo-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
        .status-active { background: #22C55E; }
        .status-paused { background: #6B7280; }
        .ai-card { background: var(--dark3); border-radius: 12px; padding: 20px; margin-bottom: 16px; border-left: 3px solid var(--orange); }
        .ai-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; color: var(--orange); text-transform: uppercase; margin-bottom: 8px; }
        .ai-text { font-size: 14px; color: var(--muted); line-height: 1.6; }
        .rule-row { display: flex; align-items: center; gap: 12px; background: var(--dark3); border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; }
        .rule-icon { font-size: 18px; }
        .rule-text { font-size: 14px; color: var(--muted); flex: 1; }
        .rule-badge { font-size: 11px; padding: 3px 10px; border-radius: 100px; font-weight: 600; }
        .badge-active { background: rgba(34,197,94,0.15); color: #22C55E; }
        .badge-paused { background: rgba(107,114,128,0.15); color: #9CA3AF; }
        .img-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .img-placeholder { background: var(--dark3); border-radius: 10px; aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 1px dashed var(--border); }
        .img-placeholder-icon { font-size: 32px; }
        .img-placeholder-label { font-size: 12px; color: var(--muted); }
        .wa-chat { display: flex; flex-direction: column; gap: 12px; }
        .wa-msg { max-width: 75%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
        .wa-msg.incoming { background: var(--dark3); color: var(--text); align-self: flex-start; border-bottom-left-radius: 4px; }
        .wa-msg.outgoing { background: rgba(255,107,43,0.2); color: var(--text); align-self: flex-end; border-bottom-right-radius: 4px; border: 1px solid rgba(255,107,43,0.3); }
        .wa-sender { font-size: 11px; color: var(--orange); font-weight: 600; margin-bottom: 4px; }
        .wa-time { font-size: 11px; color: var(--muted); margin-top: 4px; text-align: right; }

        /* STATS */
        .stats-section { padding: 80px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; }
        .stat-item { text-align: center; }
        .stat-number { font-family: var(--font-display); font-size: clamp(40px, 5vw, 64px); font-weight: 800; color: var(--orange); line-height: 1; }
        .stat-label { color: var(--muted); font-size: 16px; margin-top: 8px; }

        /* HOW */
        .how-section { padding: 80px 0; }
        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; margin-top: 56px; position: relative; }
        .step { text-align: center; padding: 0 16px; }
        .step-num { width: 52px; height: 52px; border-radius: 50%; background: var(--orange-dim); border: 1px solid rgba(255,107,43,0.4); color: var(--orange); font-family: var(--font-display); font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .step-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; margin-bottom: 10px; }
        .step-desc { color: var(--muted); font-size: 15px; line-height: 1.6; }

        /* TESTIMONIALS */
        .testimonials-section { padding: 80px 0; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 56px; }
        .testimonial-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 16px; padding: 28px; }
        .stars { color: var(--orange); font-size: 16px; letter-spacing: 2px; margin-bottom: 16px; }
        .testimonial-text { color: var(--muted); font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--orange-dim); border: 1px solid rgba(255,107,43,0.3); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: var(--orange); flex-shrink: 0; }
        .author-name { font-size: 14px; font-weight: 600; }
        .author-role { font-size: 13px; color: var(--muted); }

        /* PRICING */
        .pricing-section { padding: 80px 0; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 56px; align-items: start; }
        .pricing-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 20px; padding: 32px; position: relative; transition: transform 0.2s; }
        .pricing-card:hover { transform: translateY(-4px); }
        .pricing-card.featured { border-color: var(--orange); background: linear-gradient(160deg, rgba(255,107,43,0.08) 0%, var(--dark2) 60%); }
        .pricing-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--orange); color: white; font-size: 12px; font-weight: 700; padding: 4px 20px; border-radius: 100px; white-space: nowrap; }
        .pricing-name { font-family: var(--font-display); font-size: 22px; font-weight: 800; margin-bottom: 8px; }
        .pricing-price { font-family: var(--font-display); font-size: 36px; font-weight: 800; color: var(--orange); line-height: 1; }
        .pricing-period { font-size: 14px; color: var(--muted); margin-bottom: 8px; }
        .pricing-highlights { display: flex; gap: 8px; flex-wrap: wrap; margin: 20px 0; }
        .pricing-hl { background: var(--dark3); border-radius: 6px; padding: 4px 12px; font-size: 12px; color: var(--muted); }
        .pricing-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
        .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .pricing-features li { font-size: 14px; color: var(--muted); display: flex; align-items: center; gap: 10px; }
        .pricing-features li::before { content: '✓'; color: var(--orange); font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .btn-plan { width: 100%; padding: 14px; border-radius: 10px; font-family: var(--font-body); font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; display: block; text-align: center; transition: all 0.2s; }
        .btn-plan-primary { background: var(--orange); color: white; border: none; }
        .btn-plan-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-plan-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
        .btn-plan-ghost:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); }

        /* CTA FINAL */
        .cta-section { padding: 100px 0; text-align: center; }
        .cta-box { background: var(--dark2); border: 1px solid var(--border); border-radius: 24px; padding: 72px 48px; position: relative; overflow: hidden; }
        .cta-box::before { content: ''; position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,43,0.12) 0%, transparent 70%); }
        .cta-box h2 { font-family: var(--font-display); font-size: clamp(28px, 5vw, 52px); font-weight: 800; margin-bottom: 20px; letter-spacing: -1px; position: relative; z-index: 1; }
        .cta-box p { color: var(--muted); font-size: 18px; margin-bottom: 40px; position: relative; z-index: 1; }
        .cta-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }

        /* FOOTER */
        footer { border-top: 1px solid var(--border); padding: 40px 0; }
        .footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .footer-copy { font-size: 14px; color: var(--muted); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 14px; color: var(--muted); text-decoration: none; }
        .footer-links a:hover { color: var(--text); }

        /* ANIMATIONS */
        .fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.delay-1 { transition-delay: 0.1s; }
        .fade-up.delay-2 { transition-delay: 0.2s; }
        .fade-up.delay-3 { transition-delay: 0.3s; }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .demo-stat-row { grid-template-columns: repeat(2, 1fr); }
          .img-grid { grid-template-columns: repeat(2, 1fr); }
          .cta-box { padding: 48px 24px; }
          .solution-banner { padding: 36px 24px; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="container">
          <div className="nav-inner">
            <a href="/" className="nav-logo">⚡ Meta<span>Flow</span>.AI</a>
            <div className="nav-links">
              <a href="#features">Funciones</a>
              <a href="#how">Cómo funciona</a>
              <a href="#precios">Precios</a>
              <a href="https://metaflow.tech/?mode=login">Iniciar sesión</a>
              <a href="https://metaflow.tech/?signup=1" className="btn-nav">Comenzar gratis →</a>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-bg-circle" />
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Plataforma todo-en-uno para vender online
            </div>
            <h1>
              Tu negocio online<br />
              funcionando <em>solo</em>
            </h1>
            <p className="hero-sub">
              Gestiona campañas, responde clientes 24/7, crea creativos y genera landing pages — todo con inteligencia artificial. Tú te enfocas en crecer.
            </p>
            <div className="hero-ctas">
              <a href="https://metaflow.tech/?signup=1" className="btn-primary">⚡ Comenzar ahora</a>
              <a href="#features" className="btn-ghost">Ver funciones →</a>
            </div>
            <p className="hero-meta">Desde $99.900 COP/mes · Sin contrato de permanencia</p>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="pain-section">
        <div className="container">
          <div
            id="pain"
            ref={setRef('pain')}
            className={`fade-up ${visibleSections.pain ? 'visible' : ''}`}
          >
            <p className="section-label">¿Te suena familiar?</p>
            <h2 className="section-title">Los problemas que<br />te frenan cada día</h2>
          </div>
          <div className="pain-grid">
            {PAINS.map((p, i) => (
              <div
                key={i}
                id={`pain-${i}`}
                ref={setRef(`pain-${i}`)}
                className={`pain-card fade-up ${visibleSections[`pain-${i}`] ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 0.07}s` }}
              >
                <span className="pain-emoji">{p.emoji}</span>
                <p className="pain-text">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION BANNER */}
      <div className="container">
        <div
          id="sol"
          ref={setRef('sol')}
          className={`solution-banner fade-up ${visibleSections.sol ? 'visible' : ''}`}
        >
          <h2>MetaFlow resuelve todo eso.</h2>
          <p>Una sola plataforma con IA que trabaja por ti las 24 horas, los 7 días de la semana.</p>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="container">
          <div
            id="feat-head"
            ref={setRef('feat-head')}
            className={`fade-up ${visibleSections['feat-head'] ? 'visible' : ''}`}
          >
            <p className="section-label">Funcionalidades</p>
            <h2 className="section-title">Todo lo que necesitas<br />para escalar</h2>
            <p className="section-sub">Ocho módulos conectados entre sí para que tu negocio venda en piloto automático.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                id={`feat-${i}`}
                ref={setRef(`feat-${i}`)}
                className={`feature-card fade-up ${visibleSections[`feat-${i}`] ? 'visible' : ''}`}
                style={{ '--card-color': f.color, transitionDelay: `${(i % 4) * 0.08}s` }}
              >
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO TABS */}
      <section className="demo-section">
        <div className="container">
          <div
            id="demo-head"
            ref={setRef('demo-head')}
            className={`fade-up ${visibleSections['demo-head'] ? 'visible' : ''}`}
          >
            <p className="section-label">La plataforma</p>
            <h2 className="section-title">Ve cómo funciona<br />en tiempo real</h2>
          </div>
          <div className="tab-bar" style={{ marginTop: 40 }}>
            {tabs.map((t, i) => (
              <button key={i} className={`tab-btn ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</button>
            ))}
          </div>
          <div className="demo-screen">
            <div className="demo-topbar">
              <div className="demo-dot" style={{ background: '#FF5F57' }} />
              <div className="demo-dot" style={{ background: '#FFBD2E' }} />
              <div className="demo-dot" style={{ background: '#28CA41' }} />
              <div className="demo-url">app.metaflow.ai</div>
            </div>
            <div className="demo-content">
              {activeTab === 0 && (
                <>
                  <div className="demo-stat-row">
                    {[['$4.820', 'Inversión'], ['$21.390', 'Facturación'], ['4.43x', 'ROAS'], ['6', 'Campañas activas']].map(([v, l]) => (
                      <div key={l} className="demo-stat"><div className="demo-stat-val">{v}</div><div className="demo-stat-label">{l}</div></div>
                    ))}
                  </div>
                  <table className="demo-table">
                    <thead><tr><th>Campaña</th><th>Estado</th><th>Gasto</th><th>ROAS</th><th>CPA</th></tr></thead>
                    <tbody>
                      {[['Colección Verano 2026','active','$18.430','5.2x','$4.80'],['Retargeting Web','active','$12.100','3.8x','$7.20'],['Lookalike Compradores','paused','$8.940','1.9x','$14.50'],['Brand Awareness Q2','active','$9.870','4.1x','$5.90']].map(([n,s,g,r,c]) => (
                        <tr key={n}><td>{n}</td><td><span className={`status-dot status-${s}`}/>{s === 'active' ? 'Activa' : 'Pausada'}</td><td>{g}</td><td style={{color:'var(--orange)',fontWeight:600}}>{r}</td><td>{c}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {activeTab === 1 && (
                <>
                  <div className="ai-card"><div className="ai-label">🤖 Análisis IA — últimos 7 días</div><div className="ai-text">Tu campaña <strong style={{color:'var(--text)'}}>Colección Verano 2026</strong> tiene el mejor rendimiento con ROAS de 5.2x. Recomiendo aumentar el presupuesto diario un 30% para maximizar resultados mientras el algoritmo está optimizado.</div></div>
                  <div className="ai-card"><div className="ai-label">⚠️ Alerta de optimización</div><div className="ai-text"><strong style={{color:'var(--text)'}}>Lookalike Compradores</strong> tiene ROAS de 1.9x y CPA de $14.50 — por debajo del umbral rentable. Considera pausarla y redirigir el presupuesto a Retargeting Web.</div></div>
                  <div className="ai-card"><div className="ai-label">💡 Oportunidad detectada</div><div className="ai-text">El horario entre 7pm y 10pm genera 40% más conversiones. Configura una regla para aumentar presupuesto automáticamente en ese rango horario.</div></div>
                </>
              )}
              {activeTab === 2 && (
                <>
                  {[['Si ROAS < 1.5 por 2 días', '→ Pausar campaña automáticamente', 'active'],['Si CPA > $15 por 24h', '→ Reducir presupuesto 20%', 'active'],['Si gasto diario > $50.000', '→ Notificar al administrador', 'active'],['Si ROAS > 5.0 por 3 días', '→ Aumentar presupuesto 25%', 'paused']].map(([cond, action, s]) => (
                    <div key={cond} className="rule-row">
                      <span className="rule-icon">⚙️</span>
                      <div className="rule-text"><span style={{color:'var(--text)'}}>{cond}</span><br /><span style={{fontSize:13}}>{action}</span></div>
                      <span className={`rule-badge ${s === 'active' ? 'badge-active' : 'badge-paused'}`}>{s === 'active' ? 'Activa' : 'Pausada'}</span>
                    </div>
                  ))}
                </>
              )}
              {activeTab === 3 && (
                <div className="img-grid">
                  {[['🎨','Estilo moderno'],['🌟','Lifestyle'],['📸','Producto puro'],['🔥','Oferta'],['💎','Premium'],['🌿','Natural']].map(([icon, label]) => (
                    <div key={label} className="img-placeholder">
                      <span className="img-placeholder-icon">{icon}</span>
                      <span className="img-placeholder-label">{label}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 4 && (
                <div className="wa-chat">
                  <div className="wa-msg incoming"><div className="wa-sender">Cliente</div>Hola, quiero información sobre los productos 👋<div className="wa-time">10:23 am</div></div>
                  <div className="wa-msg outgoing"><div className="wa-sender">🤖 Agente MetaFlow</div>¡Hola! Bienvenido. Te cuento que nuestros productos son 100% naturales y ayudan a mejorar la calidad de vida de tu mascota. ¿Qué tipo de mascota tienes y qué condición presenta?<div className="wa-time">10:23 am</div></div>
                  <div className="wa-msg incoming"><div className="wa-sender">Cliente</div>Tengo un perro golden de 5 años con dolor articular<div className="wa-time">10:25 am</div></div>
                  <div className="wa-msg outgoing"><div className="wa-sender">🤖 Agente MetaFlow</div>Perfecto, para eso tenemos Plant PWR Full-Spectrum Oil especialmente para dolor articular. Reduce el dolor hasta un 95% sin efectos secundarios. El plan recomendado es 1 gotero x $104.900. ¿Te lo envío hoy?<div className="wa-time">10:25 am</div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <div className="container">
          <div
            id="stats"
            ref={setRef('stats')}
            className={`stats-grid fade-up ${visibleSections.stats ? 'visible' : ''}`}
          >
            {[['4.8x', 'ROAS promedio de usuarios'], ['24/7', 'Tu agente siempre activo'], ['70%', 'Menos tiempo en gestión'], ['5 min', 'Para crear una campaña completa']].map(([n, l]) => (
              <div key={l} className="stat-item">
                <div className="stat-number">{n}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="how-section" id="how">
        <div className="container">
          <div
            id="how-head"
            ref={setRef('how-head')}
            className={`fade-up ${visibleSections['how-head'] ? 'visible' : ''}`}
          >
            <p className="section-label">Cómo funciona</p>
            <h2 className="section-title">De cero a resultados<br />en minutos</h2>
          </div>
          <div className="steps">
            {[['01','Conecta tu cuenta','Conecta Meta Ads con tu token y Ad Account. Configuración única, en menos de 5 minutos.'],['02','Configura tu negocio','Agrega tus productos, define reglas automáticas y personaliza tu agente de WhatsApp.'],['03','Lanza y olvídate','MetaFlow analiza, optimiza, responde clientes y genera creativos. Tú solo ves los resultados.']].map(([n, t, d]) => (
              <div key={n} className="step">
                <div className="step-num">{n}</div>
                <h3 className="step-title">{t}</h3>
                <p className="step-desc">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div
            id="test-head"
            ref={setRef('test-head')}
            className={`fade-up ${visibleSections['test-head'] ? 'visible' : ''}`}
          >
            <p className="section-label">Testimonios</p>
            <h2 className="section-title">Lo que dicen quienes<br />ya lo usan</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                id={`test-${i}`}
                ref={setRef(`test-${i}`)}
                className={`testimonial-card fade-up ${visibleSections[`test-${i}`] ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="stars">{'★'.repeat(t.stars)}</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="avatar">{t.initials}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="precios">
        <div className="container">
          <div
            id="price-head"
            ref={setRef('price-head')}
            className={`fade-up ${visibleSections['price-head'] ? 'visible' : ''}`}
            style={{ textAlign: 'center' }}
          >
            <p className="section-label">Precios</p>
            <h2 className="section-title">Simple, transparente,<br />sin sorpresas</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>Todas las funciones incluidas en cada plan. Sin upgrades ocultos.</p>
          </div>
          <div className="pricing-grid">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                id={`plan-${i}`}
                ref={setRef(`plan-${i}`)}
                className={`pricing-card fade-up ${plan.highlight ? 'featured' : ''} ${visibleSections[`plan-${i}`] ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
                <div className="pricing-name">{plan.name}</div>
                <div className="pricing-price">{plan.price}</div>
                <div className="pricing-period">{plan.period}</div>
                <div className="pricing-highlights">
                  {[plan.meta, plan.credits, plan.images, plan.whatsapp].map((h) => (
                    <span key={h} className="pricing-hl">{h}</span>
                  ))}
                </div>
                <hr className="pricing-divider" />
                <ul className="pricing-features">
                  {plan.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <a
                  href="https://metaflow.tech/?signup=1"
                  className={`btn-plan ${plan.highlight ? 'btn-plan-primary' : 'btn-plan-ghost'}`}
                >
                  Comenzar ahora
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginTop: 24 }}>
            🔒 Pago 100% seguro · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2>¿Listo para que tu negocio<br />trabaje solo?</h2>
            <p>Únete y empieza a automatizar tus ventas con inteligencia artificial hoy mismo.</p>
            <div className="cta-btns">
              <a href="https://metaflow.tech/?signup=1" className="btn-primary">⚡ Comenzar ahora — desde $99.900/mes</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-inner">
            <span className="footer-copy">© 2026 MetaFlow.AI — Todos los derechos reservados.</span>
            <div className="footer-links">
              <a href="/terms">Términos</a>
              <a href="/privacy">Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}