import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

const PLANS = [
  {
    key: 'pro',
    label: 'Pro',
    price: '99.900',
    highlight: false,
    accounts: 1,
    aiCredits: 700,
    images: 60,
    features: [
      '1 cuenta publicitaria conectada',
      '700 créditos IA al mes',
      '60 imágenes generadas al mes',
      'Los 11 ángulos publicitarios',
      'Dashboard de campañas en tiempo real',
      'Análisis y recomendaciones con IA',
      'Optimización automática de reglas',
    ],
  },
  {
    key: 'business',
    label: 'Business',
    price: '209.900',
    highlight: true,
    badge: 'Más popular',
    accounts: 3,
    aiCredits: 1800,
    images: 150,
    features: [
      '3 cuentas publicitarias conectadas',
      '1.800 créditos IA al mes',
      '150 imágenes generadas al mes',
      'Los 11 ángulos publicitarios',
      'Dashboard de campañas en tiempo real',
      'Análisis y recomendaciones con IA',
      'Optimización automática de reglas',
      'Soporte prioritario',
    ],
  },
  {
    key: 'agency',
    label: 'Agency',
    price: '359.900',
    highlight: false,
    accounts: 10,
    aiCredits: 4000,
    images: 350,
    features: [
      '10 cuentas publicitarias conectadas',
      '4.000 créditos IA al mes',
      '350 imágenes generadas al mes',
      'Los 11 ángulos publicitarios',
      'Dashboard de campañas en tiempo real',
      'Análisis y recomendaciones con IA',
      'Optimización automática de reglas',
      'Soporte prioritario',
      'Acceso anticipado a nuevas funciones',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const { ref } = router.query;

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('metaflow_user'));
      if (u) setUser(u);
    } catch {}
  }, []);

  useEffect(() => {
    if (!ref) return;
    const checkPayment = async () => {
      if (!user?.email) return;
      try {
        await new Promise(r => setTimeout(r, 3000));
        const { data } = await axios.get(`/api/payments/status?email=${encodeURIComponent(user.email)}`);
        if (data.isActive) router.replace('/');
      } catch {}
    };
    checkPayment();
  }, [ref, user]);

  const handleSubscribe = async (planKey) => {
    if (!user) { router.push('/'); return; }
    setLoadingPlan(planKey);
    setError('');
    try {
      const { data } = await axios.post('/api/payments/create-transaction', {
        userId: user.id,
        userEmail: user.email,
        plan: planKey,
      });

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.setAttribute('data-render', 'button');
      script.setAttribute('data-public-key', data.publicKey);
      script.setAttribute('data-currency', data.currency);
      script.setAttribute('data-amount-in-cents', String(data.amountInCents));
      script.setAttribute('data-reference', data.reference);
      script.setAttribute('data-signature:integrity', data.signature);
      script.setAttribute('data-customer-data:email', data.userEmail);
      script.setAttribute('data-redirect-url', data.redirectUrl);

      const container = document.getElementById(`wompi-${planKey}`);
      if (container) {
        container.innerHTML = '';
        container.appendChild(script);
      }
    } catch {
      setError('Error iniciando el pago. Intenta de nuevo.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Head>
        <title>MetaFlow.AI — Planes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="pricing-shell">
        <div className="pricing-bg-glow" />

        <div className="pricing-header">
          <div className="pricing-brand">
            <div className="brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span>MetaFlow.AI</span>
          </div>
        </div>

        <div className="pricing-hero">
          <h1>Elige tu plan</h1>
          <p>Creativos con IA + gestión de Meta Ads en una sola plataforma</p>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan) => (
            <div key={plan.key} className={`plan-card ${plan.highlight ? 'plan-card--highlight' : ''}`}>
              {plan.badge && <div className="plan-badge">{plan.badge}</div>}

              <div className="plan-top">
                <span className="plan-label">{plan.label}</span>
                <div className="plan-price">
                  <span className="plan-currency">$</span>
                  <span className="plan-amount">{plan.price}</span>
                  <span className="plan-period">COP/mes</span>
                </div>
              </div>

              <div className="plan-quotas">
                <div className="quota-item">
                  <span className="quota-num">{plan.accounts}</span>
                  <span className="quota-label">cuenta{plan.accounts > 1 ? 's' : ''} Meta</span>
                </div>
                <div className="quota-divider" />
                <div className="quota-item">
                  <span className="quota-num">{plan.aiCredits.toLocaleString('es-CO')}</span>
                  <span className="quota-label">créditos IA</span>
                </div>
                <div className="quota-divider" />
                <div className="quota-item">
                  <span className="quota-num">{plan.images}</span>
                  <span className="quota-label">imágenes</span>
                </div>
              </div>

              <ul className="plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <span className="plan-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div id={`wompi-${plan.key}`} className="wompi-container">
                <button
                  className={`plan-cta ${plan.highlight ? 'plan-cta--primary' : 'plan-cta--secondary'}`}
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loadingPlan === plan.key}
                >
                  {loadingPlan === plan.key ? 'Preparando pago…' : `Suscribirme a ${plan.label}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="pricing-error">{error}</p>}
        <p className="pricing-guarantee">🔒 Pago 100% seguro · Cancela cuando quieras</p>
      </div>

      <style jsx>{`
        .pricing-shell {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 10%, rgba(59,130,246,0.2), transparent 30%),
                      radial-gradient(circle at 80% 15%, rgba(168,85,247,0.16), transparent 28%),
                      #030509;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px 60px;
          position: relative;
          overflow: hidden;
          gap: 0;
        }
        .pricing-bg-glow {
          position: absolute;
          top: -120px; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 400px;
          background: radial-gradient(ellipse, rgba(99,102,241,0.15), transparent 70%);
          pointer-events: none;
        }
        .pricing-header {
          width: 100%; max-width: 1080px;
          margin-bottom: 32px;
        }
        .pricing-brand {
          display: flex; align-items: center; gap: 10px;
          font-size: 20px; font-weight: 700; color: #f8fafc;
        }
        .brand-mark {
          width: 36px; height: 36px;
          display: grid; place-items: center;
          background: linear-gradient(135deg,#2563eb,#7c3aed 58%,#ef4444);
          border-radius: 10px;
        }
        .pricing-hero {
          text-align: center; margin-bottom: 48px;
        }
        .pricing-hero h1 {
          margin: 0 0 8px;
          font-size: 38px; font-weight: 800; color: #f8fafc;
        }
        .pricing-hero p {
          margin: 0; color: #94a3b8; font-size: 16px;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          width: 100%; max-width: 1080px;
          position: relative; z-index: 1;
        }
        .plan-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 28px 24px;
          display: flex; flex-direction: column; gap: 20px;
          position: relative;
        }
        .plan-card--highlight {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.07);
          box-shadow: 0 0 40px rgba(99,102,241,0.15);
        }
        .plan-badge {
          position: absolute; top: -13px; left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg,#6366f1,#a855f7);
          color: #fff; font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 4px 14px; border-radius: 100px;
          white-space: nowrap;
        }
        .plan-top { display: flex; flex-direction: column; gap: 6px; }
        .plan-label { font-size: 13px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.06em; }
        .plan-price { display: flex; align-items: baseline; gap: 3px; }
        .plan-currency { font-size: 20px; font-weight: 700; color: #f8fafc; }
        .plan-amount { font-size: 42px; font-weight: 900; color: #f8fafc; line-height: 1; }
        .plan-period { font-size: 14px; color: #64748b; margin-left: 4px; }
        .plan-quotas {
          display: flex; align-items: center;
          background: rgba(255,255,255,0.04);
          border-radius: 12px; padding: 12px 8px;
          gap: 4px;
        }
        .quota-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 2px;
        }
        .quota-num { font-size: 20px; font-weight: 800; color: #f8fafc; }
        .quota-label { font-size: 10px; color: #64748b; text-align: center; }
        .quota-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.08); }
        .plan-features {
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 10px;
          flex: 1;
        }
        .plan-features li {
          display: flex; align-items: flex-start; gap: 8px;
          color: #e2e8f0; font-size: 13px; line-height: 1.4;
        }
        .plan-check { color: #6366f1; font-weight: 700; flex-shrink: 0; }
        .wompi-container { display: flex; justify-content: center; }
        .plan-cta {
          width: 100%; padding: 14px;
          font-size: 14px; font-weight: 700; border: none;
          border-radius: 12px; cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .plan-cta--primary {
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          color: #fff;
          box-shadow: 0 6px 24px rgba(99,102,241,0.35);
        }
        .plan-cta--secondary {
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .plan-cta:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .plan-cta:disabled { opacity: 0.55; cursor: not-allowed; }
        .pricing-error { color: #f87171; font-size: 13px; text-align: center; margin: 16px 0 0; }
        .pricing-guarantee { color: #475569; font-size: 12px; margin-top: 24px; }
        @media (max-width: 860px) {
          .plans-grid { grid-template-columns: 1fr; max-width: 420px; }
          .pricing-hero h1 { font-size: 28px; }
        }
      `}</style>
    </>
  );
}
