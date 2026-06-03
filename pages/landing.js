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
  { icon: '📊', title: 'Dashboard en tiempo real', desc: 'ROAS, inversión y facturación de los últimos 7 días en una sola pantalla. Sin abrir el Administrador de Meta.', color: '#8b5cf6' },
  { icon: '🤖', title: 'Análisis experto con IA', desc: 'Un experto en Meta Ads analiza tus campañas y te dice exactamente qué pausar, escalar o cambiar.', color: '#6366f1' },
  { icon: '🎨', title: 'Generador de imágenes IA', desc: 'Sube la foto de tu producto y obtén creativos de alto nivel listos para publicar en segundos.', color: '#0EA5E9' },
  { icon: '💬', title: 'Agente WhatsApp 24/7', desc: 'Tu bot responde, califica y cierra ventas mientras duermes. Conectado directamente a tus campañas.', color: '#10b981' },
  { icon: '🛍️', title: 'Vitrina de productos', desc: 'Tu catálogo siempre disponible. Agrega precio, link y descripción para crear anuncios en segundos.', color: '#a78bfa' },
  { icon: '⚙️', title: 'Reglas automáticas', desc: 'Si el ROAS baja de X, pausa la campaña. Si el CPA sube, ajusta el presupuesto. Sin trabajo manual.', color: '#f59e0b' },
  { icon: '🚀', title: 'Constructor de campañas', desc: 'Crea campañas completas con copy generado por IA y múltiples creativos desde la misma plataforma.', color: '#8b5cf6' },
  { icon: '🌐', title: 'Generador de landing pages', desc: 'Genera páginas de venta optimizadas para conversión en segundos, listas para conectar a tus anuncios.', color: '#6366f1' },
]

const TESTIMONIALS = [
  { name: 'Carolina Restrepo', role: 'Fundadora · Tienda de moda online', text: 'Antes perdía horas revisando campañas. Con MetaFlow mi ROAS subió de 2.1x a 4.8x en el primer mes. El análisis automático me dice exactamente qué hacer.', stars: 5, initials: 'CR' },
  { name: 'Andrés Mejía', role: 'Director de Marketing · E-commerce', text: 'El generador de imágenes es increíble. En minutos tengo creativos profesionales. Antes pagaba $500 USD al mes a un diseñador — ahora lo hago en segundos.', stars: 5, initials: 'AM' },
  { name: 'Valentina Torres', role: 'CEO · Marca de cosméticos', text: 'Las reglas automáticas me salvaron el presupuesto. Una campaña se estaba comiendo la plata sin conversiones y MetaFlow la pausó sola.', stars: 5, initials: 'VT' },
  { name: 'Felipe Gómez', role: 'Growth Manager · SaaS B2B', text: 'El agente de WhatsApp es un game changer. Mis leads llegan del anuncio y el bot los cierra automáticamente. Ya no necesito estar pegado al celular.', stars: 5, initials: 'FG' },
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
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Particle network animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h, particles

    function resize() {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }

    function initParticles() {
      particles = Array.from({ length: 65 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.8,
        pulse: Math.random() * Math.PI * 2,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.25
            const grad = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y)
            grad.addColorStop(0, `rgba(139,92,246,${alpha})`)
            grad.addColorStop(1, `rgba(99,102,241,${alpha})`)
            ctx.beginPath()
            ctx.strokeStyle = grad
            ctx.lineWidth = 0.8
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.pulse += 0.03
        const pAlpha = 0.5 + Math.sin(p.pulse) * 0.2

        // Glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        grd.addColorStop(0, `rgba(139,92,246,${pAlpha * 0.4})`)
        grd.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167,139,250,${pAlpha})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      })

      animRef.current = requestAnimationFrame(draw)
    }

    resize()
    initParticles()
    draw()

    const ro = new ResizeObserver(() => {
      resize()
      initParticles()
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [])

  // Scroll animations
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

  const setRef = (id) => (el) => { sectionRefs.current[id] = el }
  const tabs = ['📊 Campañas', '🤖 Análisis IA', '⚙️ Reglas', '🎨 Imagen IA', '💬 WhatsApp']

  return (
    <>
      <Head>
        <title>MetaFlow.AI — Automatiza tu negocio online con IA</title>
        <meta name="description" content="Gestiona campañas, crea creativos, responde clientes 24/7 y genera landing pages con inteligencia artificial. La plataforma todo-en-uno para vender más online." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --purple: #8b5cf6;
          --purple-light: #a78bfa;
          --indigo: #6366f1;
          --purple-dim: rgba(139,92,246,0.12);
          --purple-glow: rgba(139,92,246,0.25);
          --dark: #0b0f19;
          --dark2: #111827;
          --dark3: #151d2e;
          --dark4: #1a2236;
          --border: rgba(255,255,255,0.07);
          --border-purple: rgba(139,92,246,0.25);
          --text: #f3f4f6;
          --muted: rgba(243,244,246,0.5);
          --font: 'Inter', system-ui, sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: var(--text); font-family: var(--font); font-size: 16px; line-height: 1.6; overflow-x: hidden; }
        .container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }

        /* NAV */
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 14px 0; background: rgba(11,15,25,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
        .nav-inner { display: flex; align-items: center; justify-content: space-between; }
        .nav-logo { font-size: 20px; font-weight: 800; color: var(--text); text-decoration: none; display: flex; align-items: center; gap: 10px; letter-spacing: -0.5px; }
        .nav-logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .nav-logo span { color: var(--purple-light); }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-links a { color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: var(--text); }
        .btn-nav { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; padding: 9px 22px; border-radius: 8px; font-family: var(--font); font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.2s, transform 0.2s; }
        .btn-nav:hover { opacity: 0.9; transform: translateY(-1px); }

        /* HERO */
        .hero { padding: 160px 0 110px; position: relative; overflow: hidden; min-height: 100vh; display: flex; align-items: center; }
        .hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
        .hero-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(139,92,246,0.08) 0%, transparent 70%); z-index: 1; }
        .hero-overlay-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 200px; background: linear-gradient(to bottom, transparent, var(--dark)); z-index: 2; }
        .hero-content { position: relative; z-index: 3; text-align: center; width: 100%; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 100px; padding: 6px 16px; font-size: 13px; color: var(--purple-light); margin-bottom: 32px; font-weight: 500; }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--purple-light); animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }
        h1 { font-size: clamp(40px, 6vw, 76px); font-weight: 900; line-height: 1.04; letter-spacing: -2.5px; margin-bottom: 24px; }
        h1 em { font-style: normal; background: linear-gradient(135deg, #a78bfa, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { font-size: clamp(16px, 2vw, 19px); color: var(--muted); max-width: 580px; margin: 0 auto 48px; line-height: 1.65; font-weight: 400; }
        .hero-ctas { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; padding: 15px 34px; border-radius: 10px; font-family: var(--font); font-size: 15px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; letter-spacing: -0.2px; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(139,92,246,0.4); }
        .btn-ghost { background: rgba(255,255,255,0.04); color: var(--text); border: 1px solid var(--border-purple); padding: 15px 34px; border-radius: 10px; font-family: var(--font); font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-ghost:hover { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.06); }
        .hero-meta { margin-top: 20px; font-size: 13px; color: var(--muted); font-weight: 500; }

        /* SECTION COMMON */
        .section-label { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--purple-light); margin-bottom: 14px; }
        .section-title { font-size: clamp(28px, 4vw, 46px); font-weight: 800; line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 16px; }
        .section-sub { color: var(--muted); font-size: 17px; max-width: 540px; line-height: 1.65; }

        /* PAIN */
        .pain-section { padding: 80px 0; }
        .pain-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; margin-top: 48px; }
        .pain-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 12px; padding: 18px 22px; display: flex; align-items: center; gap: 16px; transition: border-color 0.2s, transform 0.2s; }
        .pain-card:hover { border-color: var(--border-purple); transform: translateY(-2px); }
        .pain-emoji { font-size: 26px; flex-shrink: 0; }
        .pain-text { font-size: 14px; color: var(--muted); line-height: 1.55; font-weight: 500; }

        /* SOLUTION */
        .solution-banner { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 20px; padding: 52px 48px; text-align: center; margin: 0 0 80px; position: relative; overflow: hidden; }
        .solution-banner::before { content: ''; position: absolute; top: -30%; right: -8%; width: 360px; height: 360px; border-radius: 50%; background: rgba(255,255,255,0.07); }
        .solution-banner::after { content: ''; position: absolute; bottom: -20%; left: -5%; width: 260px; height: 260px; border-radius: 50%; background: rgba(255,255,255,0.05); }
        .solution-banner h2 { font-size: clamp(24px, 4vw, 40px); font-weight: 800; color: white; margin-bottom: 14px; position: relative; z-index: 1; letter-spacing: -1px; }
        .solution-banner p { color: rgba(255,255,255,0.85); font-size: 17px; position: relative; z-index: 1; font-weight: 500; }

        /* FEATURES */
        .features-section { padding: 80px 0; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: 18px; margin-top: 56px; }
        .feature-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 16px; padding: 26px; transition: all 0.3s; position: relative; overflow: hidden; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--card-color, var(--purple)); opacity: 0; transition: opacity 0.3s; }
        .feature-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top left, rgba(139,92,246,0.05), transparent 60%); opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover { border-color: rgba(139,92,246,0.25); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .feature-card:hover::before { opacity: 1; }
        .feature-card:hover::after { opacity: 1; }
        .feature-icon { font-size: 30px; margin-bottom: 14px; display: block; }
        .feature-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.3px; }
        .feature-desc { color: var(--muted); font-size: 13px; line-height: 1.65; }

        /* DEMO */
        .demo-section { padding: 80px 0; }
        .tab-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
        .tab-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 9px 18px; border-radius: 8px; font-family: var(--font); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: var(--purple); border-color: var(--purple); color: white; font-weight: 600; }
        .tab-btn:not(.active):hover { border-color: var(--border-purple); color: var(--text); }
        .demo-screen { background: var(--dark2); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.4); }
        .demo-topbar { background: var(--dark3); padding: 12px 18px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border); }
        .demo-dot { width: 10px; height: 10px; border-radius: 50%; }
        .demo-url { background: var(--dark4); border-radius: 6px; padding: 4px 14px; font-size: 12px; color: var(--muted); flex: 1; max-width: 280px; }
        .demo-content { padding: 28px; min-height: 320px; }
        .demo-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .demo-stat { background: var(--dark3); border-radius: 10px; padding: 16px; text-align: center; }
        .demo-stat-val { font-size: 22px; font-weight: 800; color: var(--purple-light); letter-spacing: -0.5px; }
        .demo-stat-label { font-size: 11px; color: var(--muted); margin-top: 4px; font-weight: 500; }
        .demo-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .demo-table th { text-align: left; padding: 10px 12px; color: var(--muted); font-weight: 600; border-bottom: 1px solid var(--border); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .demo-table td { padding: 11px 12px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
        .status-active { background: #10b981; }
        .status-paused { background: #4b5563; }
        .ai-card { background: var(--dark3); border-radius: 12px; padding: 18px; margin-bottom: 14px; border-left: 3px solid var(--purple); }
        .ai-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: var(--purple-light); text-transform: uppercase; margin-bottom: 8px; }
        .ai-text { font-size: 14px; color: var(--muted); line-height: 1.65; }
        .rule-row { display: flex; align-items: center; gap: 12px; background: var(--dark3); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
        .rule-icon { font-size: 17px; }
        .rule-text { font-size: 13px; color: var(--muted); flex: 1; line-height: 1.5; }
        .rule-badge { font-size: 11px; padding: 3px 10px; border-radius: 100px; font-weight: 700; }
        .badge-active { background: rgba(16,185,129,0.12); color: #10b981; }
        .badge-paused { background: rgba(75,85,99,0.2); color: #9CA3AF; }
        .img-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        /* IMG AI DEMO */
        .img-ai-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .img-ai-panel { background: var(--dark3); border-radius: 12px; padding: 18px; }
        .img-ai-panel-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: var(--purple-light); text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
        .img-upload-box { border: 1px dashed rgba(139,92,246,0.3); border-radius: 10px; padding: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; background: rgba(139,92,246,0.04); }
        .img-upload-thumb { width: 56px; height: 56px; background: var(--dark4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .img-upload-meta { font-size: 12px; }
        .img-upload-name { color: var(--text); font-weight: 600; }
        .img-upload-hint { color: var(--muted); margin-top: 2px; }
        .img-field-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .img-field-label span { color: var(--muted); font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 4px; }
        .img-field-input { background: var(--dark4); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: var(--text); font-family: var(--font); font-weight: 500; width: 100%; margin-bottom: 10px; }
        .img-field-textarea { background: var(--dark4); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: var(--muted); font-family: var(--font); width: 100%; resize: none; line-height: 1.55; margin-bottom: 8px; }
        .img-tip { font-size: 11px; color: rgba(167,139,250,0.7); line-height: 1.55; }
        .img-tip strong { color: var(--purple-light); }
        .img-result-box { border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; margin-bottom: 12px; position: relative; }
        .img-result-inner { background: white; padding: 0; aspect-ratio: 4/5; display: flex; flex-direction: column; align-items: stretch; }
        .img-ad-top { display: grid; grid-template-columns: 1fr 1fr; flex: 1; }
        .img-ad-left { background: #f0f0f0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; position: relative; }
        .img-ad-right { background: #1a0a2e; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; }
        .img-ad-badge-before { font-size: 8px; font-weight: 800; color: #666; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .img-ad-badge-after { background: #e91e8c; color: white; font-size: 8px; font-weight: 800; text-align: center; padding: 3px 6px; border-radius: 4px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
        .img-ad-dog { font-size: 36px; }
        .img-ad-features { background: #2d1b5e; width: 100%; }
        .img-ad-feature-row { display: flex; align-items: center; gap: 4px; padding: 2px 6px; font-size: 8px; color: rgba(255,255,255,0.7); }
        .img-ad-feature-row.bad { color: #ef4444; }
        .img-ad-feature-row.good { color: #22c55e; }
        .img-ad-cta { background: #e91e8c; padding: 7px; text-align: center; font-size: 9px; font-weight: 800; color: white; letter-spacing: 1px; text-transform: uppercase; }
        .img-result-label { font-size: 11px; font-weight: 600; color: var(--muted); padding: 4px 0; }
        .img-action-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .img-action-btn { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: default; }
        .img-action-primary { background: linear-gradient(135deg,#8b5cf6,#6366f1); color: white; }
        .img-action-ghost { background: var(--dark4); border: 1px solid rgba(255,255,255,0.08); color: var(--muted); }
        @media (max-width: 600px) { .img-ai-layout { grid-template-columns: 1fr; } }
        .wa-chat { display: flex; flex-direction: column; gap: 12px; }
        .wa-msg { max-width: 72%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.55; }
        .wa-msg.incoming { background: var(--dark3); color: var(--text); align-self: flex-start; border-bottom-left-radius: 4px; }
        .wa-msg.outgoing { background: rgba(139,92,246,0.15); color: var(--text); align-self: flex-end; border-bottom-right-radius: 4px; border: 1px solid rgba(139,92,246,0.25); }
        .wa-sender { font-size: 11px; color: var(--purple-light); font-weight: 700; margin-bottom: 4px; }
        .wa-time { font-size: 11px; color: var(--muted); margin-top: 4px; text-align: right; }

        /* STATS */
        .stats-section { padding: 80px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; }
        .stat-item { text-align: center; }
        .stat-number { font-size: clamp(38px, 5vw, 60px); font-weight: 900; letter-spacing: -2px; line-height: 1; background: linear-gradient(135deg, #a78bfa, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-label { color: var(--muted); font-size: 15px; margin-top: 10px; font-weight: 500; }

        /* HOW */
        .how-section { padding: 80px 0; }
        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; margin-top: 56px; }
        .step { text-align: center; padding: 0 16px; }
        .step-num { width: 52px; height: 52px; border-radius: 50%; background: var(--purple-dim); border: 1px solid var(--border-purple); color: var(--purple-light); font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .step-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.3px; }
        .step-desc { color: var(--muted); font-size: 14px; line-height: 1.65; }

        /* TESTIMONIALS */
        .testimonials-section { padding: 80px 0; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin-top: 56px; }
        .testimonial-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: border-color 0.2s, transform 0.2s; }
        .testimonial-card:hover { border-color: var(--border-purple); transform: translateY(-2px); }
        .stars { color: var(--purple-light); font-size: 15px; letter-spacing: 2px; margin-bottom: 16px; }
        .testimonial-text { color: var(--muted); font-size: 14px; line-height: 1.75; margin-bottom: 20px; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--purple-dim); border: 1px solid var(--border-purple); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: var(--purple-light); flex-shrink: 0; }
        .author-name { font-size: 14px; font-weight: 700; letter-spacing: -0.2px; }
        .author-role { font-size: 12px; color: var(--muted); margin-top: 1px; }

        /* PRICING */
        .pricing-section { padding: 80px 0; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 56px; align-items: start; }
        .pricing-card { background: var(--dark2); border: 1px solid var(--border); border-radius: 20px; padding: 32px; position: relative; transition: transform 0.2s; }
        .pricing-card:hover { transform: translateY(-4px); }
        .pricing-card.featured { border-color: var(--border-purple); background: linear-gradient(160deg, rgba(139,92,246,0.08) 0%, var(--dark2) 60%); box-shadow: 0 0 60px rgba(139,92,246,0.1); }
        .pricing-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; font-size: 12px; font-weight: 700; padding: 4px 20px; border-radius: 100px; white-space: nowrap; letter-spacing: 0.3px; }
        .pricing-name { font-size: 22px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        .pricing-price { font-size: 36px; font-weight: 900; color: var(--purple-light); line-height: 1; letter-spacing: -1.5px; }
        .pricing-period { font-size: 14px; color: var(--muted); margin-bottom: 8px; font-weight: 500; }
        .pricing-highlights { display: flex; gap: 8px; flex-wrap: wrap; margin: 20px 0; }
        .pricing-hl { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15); border-radius: 6px; padding: 3px 10px; font-size: 12px; color: var(--purple-light); font-weight: 500; }
        .pricing-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
        .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .pricing-features li { font-size: 14px; color: var(--muted); display: flex; align-items: center; gap: 10px; font-weight: 500; }
        .pricing-features li::before { content: '✓'; color: var(--purple-light); font-weight: 800; font-size: 13px; flex-shrink: 0; }
        .btn-plan { width: 100%; padding: 14px; border-radius: 10px; font-family: var(--font); font-size: 15px; font-weight: 700; cursor: pointer; text-decoration: none; display: block; text-align: center; transition: all 0.2s; letter-spacing: -0.2px; }
        .btn-plan-primary { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; }
        .btn-plan-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(139,92,246,0.35); }
        .btn-plan-ghost { background: transparent; color: var(--text); border: 1px solid var(--border-purple); }
        .btn-plan-ghost:hover { border-color: var(--purple); background: var(--purple-dim); }

        /* CTA FINAL */
        .cta-section { padding: 100px 0; text-align: center; }
        .cta-box { background: var(--dark2); border: 1px solid var(--border-purple); border-radius: 24px; padding: 72px 48px; position: relative; overflow: hidden; }
        .cta-box::before { content: ''; position: absolute; bottom: -80px; left: 50%; transform: translateX(-50%); width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); }
        .cta-box::after { content: ''; position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%); }
        .cta-box h2 { font-size: clamp(26px, 5vw, 50px); font-weight: 900; margin-bottom: 20px; letter-spacing: -1.5px; position: relative; z-index: 1; line-height: 1.1; }
        .cta-box p { color: var(--muted); font-size: 17px; margin-bottom: 40px; position: relative; z-index: 1; font-weight: 500; }
        .cta-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }

        /* FOOTER */
        footer { border-top: 1px solid var(--border); padding: 40px 0; }
        .footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .footer-copy { font-size: 13px; color: var(--muted); font-weight: 500; }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; font-weight: 500; }
        .footer-links a:hover { color: var(--text); }

        /* ANIMATIONS */
        .fade-up { opacity: 0; transform: translateY(28px); transition: opacity 0.55s ease, transform 0.55s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .demo-stat-row { grid-template-columns: repeat(2, 1fr); }
          .img-grid { grid-template-columns: repeat(2, 1fr); }
          .cta-box { padding: 48px 24px; }
          .solution-banner { padding: 40px 28px; }
          h1 { letter-spacing: -1.5px; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="container">
          <div className="nav-inner">
            <a href="/" className="nav-logo">
              <div className="nav-logo-mark">⚡</div>
              Meta<span>Flow</span>.AI
            </a>
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
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-overlay" />
        <div className="hero-overlay-bottom" />
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
              <a href="#precios" className="btn-primary">⚡ Comenzar ahora</a>
              <a href="#features" className="btn-ghost">Ver funciones →</a>
            </div>
            <p className="hero-meta">Desde $99.900 COP/mes · Sin contrato de permanencia</p>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="pain-section">
        <div className="container">
          <div id="pain" ref={setRef('pain')} className={`fade-up ${visibleSections.pain ? 'visible' : ''}`}>
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

      {/* SOLUTION */}
      <div className="container">
        <div id="sol" ref={setRef('sol')} className={`solution-banner fade-up ${visibleSections.sol ? 'visible' : ''}`}>
          <h2>MetaFlow resuelve todo eso.</h2>
          <p>Una sola plataforma con IA que trabaja por ti las 24 horas, los 7 días de la semana.</p>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="container">
          <div id="feat-head" ref={setRef('feat-head')} className={`fade-up ${visibleSections['feat-head'] ? 'visible' : ''}`}>
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

      {/* DEMO */}
      <section className="demo-section">
        <div className="container">
          <div id="demo-head" ref={setRef('demo-head')} className={`fade-up ${visibleSections['demo-head'] ? 'visible' : ''}`}>
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
                        <tr key={n}>
                          <td>{n}</td>
                          <td><span className={`status-dot status-${s}`}/>{s === 'active' ? 'Activa' : 'Pausada'}</td>
                          <td>{g}</td>
                          <td style={{ color: 'var(--purple-light)', fontWeight: 700 }}>{r}</td>
                          <td>{c}</td>
                        </tr>
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
                      <div className="rule-text"><span style={{color:'var(--text)',fontWeight:600}}>{cond}</span><br /><span style={{fontSize:13}}>{action}</span></div>
                      <span className={`rule-badge ${s === 'active' ? 'badge-active' : 'badge-paused'}`}>{s === 'active' ? 'Activa' : 'Pausada'}</span>
                    </div>
                  ))}
                </>
              )}
              {activeTab === 3 && (
                <div className="img-ai-layout">
                  {/* Left: config panel */}
                  <div className="img-ai-panel">
                    <div className="img-ai-panel-title">🎨 Configurar creativos</div>

                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                      Imagen del producto <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>PNG · JPG · WEBP</span>
                    </div>
                    <div className="img-upload-box">
                      <div className="img-upload-thumb">🐾</div>
                      <div className="img-upload-meta">
                        <div className="img-upload-name">Gotero Spets.png</div>
                        <div className="img-upload-hint">Gemini analiza la imagen para generar creativos fieles al producto.</div>
                      </div>
                    </div>

                    <div className="img-field-label">Nombre del producto</div>
                    <div className="img-field-input">Omega Spets</div>

                    <div className="img-field-label">Descripción <span>opcional pero recomendada</span></div>
                    <div className="img-field-textarea" style={{ display: 'block', padding: '9px 12px', background: 'var(--dark4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 8 }}>
                      Suplemento nutricional con omegas, minerales y aceites funcionales. Ayuda a mantener piel sana y pelaje brillante en perros y gatos.
                    </div>
                    <div className="img-tip">
                      Para mejores resultados incluye: <strong>qué es · qué problema resuelve · a quién va dirigido · resultado principal.</strong>
                    </div>
                  </div>

                  {/* Right: result panel */}
                  <div className="img-ai-panel">
                    <div className="img-ai-panel-title" style={{ justifyContent: 'space-between' }}>
                      <span>🖼️ Creativos generados</span>
                      <div className="img-action-btn img-action-primary" style={{ fontSize: 11, padding: '5px 10px' }}>✦ Nueva generación</div>
                    </div>

                    <div className="img-result-box">
                      {/* Ad creative mock */}
                      <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden' }}>
                        {/* Two-panel ad */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 180 }}>
                          {/* Before */}
                          <div style={{ background: '#f3f3f3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Pelaje opaco?</div>
                            <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>Otros productos</div>
                            <div style={{ fontSize: 40 }}>🐕</div>
                          </div>
                          {/* After */}
                          <div style={{ background: '#1a0a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6 }}>
                            <div style={{ background: '#e91e8c', color: 'white', fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>¡Transformación 15 días!</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fórmula Premium</div>
                            <div style={{ fontSize: 40 }}>🐕‍🦺</div>
                          </div>
                        </div>
                        {/* Feature bullets */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f8f8f8', borderTop: '1px solid #eee' }}>
                          <div style={{ padding: '6px 10px', borderRight: '1px solid #eee' }}>
                            {['Pelaje sin brillo','Piel seca y sin vitalidad'].map(t => (
                              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: '#ef4444', marginBottom: 2 }}>✕ {t}</div>
                            ))}
                          </div>
                          <div style={{ padding: '6px 10px' }}>
                            {['Pelaje suave brillante','Piel sana y nutrida'].map(t => (
                              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: '#22c55e', marginBottom: 2 }}>✓ {t}</div>
                            ))}
                          </div>
                        </div>
                        {/* CTA */}
                        <div style={{ background: '#e91e8c', padding: '8px', textAlign: 'center', fontSize: 9, fontWeight: 800, color: 'white', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                          Comprar ahora
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>Comparativa · Ángulo transformación</div>

                    {/* Action buttons */}
                    <div className="img-action-row" style={{ marginBottom: 14 }}>
                      <div className="img-action-btn img-action-ghost">⚖️ Comparativa</div>
                      <div className="img-action-btn img-action-ghost">↓ Descargar</div>
                      <div className="img-action-btn img-action-ghost">✏️ Ajustar</div>
                    </div>
                    <div className="img-action-row">
                      <div className="img-action-btn img-action-primary">🚀 Lanzar en Meta</div>
                      <div className="img-action-btn img-action-ghost">💾 Guardar</div>
                    </div>

                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>Titular</span>
                        <span style={{ fontSize: 11, color: 'var(--purple-light)', fontWeight: 600, cursor: 'default' }}>📋 Copiar</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Pelaje opaco? ¡Transformación en 15 días!</div>
                    </div>
                  </div>
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
          <div id="stats" ref={setRef('stats')} className={`stats-grid fade-up ${visibleSections.stats ? 'visible' : ''}`}>
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
          <div id="how-head" ref={setRef('how-head')} className={`fade-up ${visibleSections['how-head'] ? 'visible' : ''}`}>
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
          <div id="test-head" ref={setRef('test-head')} className={`fade-up ${visibleSections['test-head'] ? 'visible' : ''}`}>
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
          <div id="price-head" ref={setRef('price-head')} className={`fade-up ${visibleSections['price-head'] ? 'visible' : ''}`} style={{ textAlign: 'center' }}>
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
                <a href="https://metaflow.tech/?signup=1" className={`btn-plan ${plan.highlight ? 'btn-plan-primary' : 'btn-plan-ghost'}`}>
                  Comenzar ahora
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 24, fontWeight: 500 }}>
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
