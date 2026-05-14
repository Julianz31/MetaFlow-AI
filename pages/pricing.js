import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSupabaseBrowser } from '../lib/supabase-browser';
import axios from 'axios';

const FEATURES = [
  'Generación ilimitada de creativos con IA',
  'Los 11 ángulos publicitarios',
  'Integración directa con Meta Ads',
  'Dashboard de campañas en tiempo real',
  'Optimización automática con IA',
  'Análisis y recomendaciones de campaña',
  'Soporte prioritario',
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { ref } = router.query;

  useEffect(() => {
    // Leer usuario desde localStorage
    try {
      const u = JSON.parse(localStorage.getItem('metaflow_user'));
      if (u) setUser(u);
    } catch {}
  }, []);

  // Si viene de un pago exitoso, verificar y redirigir
  useEffect(() => {
    if (!ref) return;
    const checkPayment = async () => {
      if (!user?.email) return;
      try {
        // Esperar unos segundos para que el webhook procese
        await new Promise(r => setTimeout(r, 3000));
        const { data } = await axios.get(`/api/payments/status?email=${encodeURIComponent(user.email)}`);
        if (data.isActive) {
          router.replace('/');
        }
      } catch {}
    };
    checkPayment();
  }, [ref, user]);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/payments/create-transaction', {
        userId: user.id,
        userEmail: user.email,
      });

      // Cargar widget de Wompi dinámicamente
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

      const container = document.getElementById('wompi-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(script);
      }
    } catch (err) {
      setError('Error iniciando el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>MetaFlow.AI — Suscripción Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="pricing-shell">
        <div className="pricing-bg-glow" />

        <div className="pricing-header">
          <div className="pricing-brand">
            <div className="brand-mark" style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#2563eb,#7c3aed 58%,#ef4444)', borderRadius: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span>MetaFlow.AI</span>
          </div>
        </div>

        <div className="pricing-content">
          <div className="pricing-hero">
            <span className="pricing-badge">Plan Pro</span>
            <h1 className="pricing-title">Lanza anuncios que<br />realmente convierten</h1>
            <p className="pricing-subtitle">Creativos con IA + gestión de Meta Ads en una sola plataforma</p>
          </div>

          <div className="pricing-card">
            <div className="pricing-card-top">
              <div className="pricing-price">
                <span className="pricing-currency">$</span>
                <span className="pricing-amount">99.900</span>
                <span className="pricing-period">COP / mes</span>
              </div>
              <p className="pricing-desc">Todo lo que necesitas para escalar tus campañas de Meta Ads</p>
            </div>

            <ul className="pricing-features">
              {FEATURES.map((f, i) => (
                <li key={i} className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <div id="wompi-container" className="wompi-container">
              <button
                className="pricing-cta"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? 'Preparando pago…' : 'Suscribirme ahora'}
              </button>
            </div>

            {error && <p className="pricing-error">{error}</p>}

            <p className="pricing-guarantee">
              🔒 Pago 100% seguro · Cancela cuando quieras
            </p>
          </div>
        </div>
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
        }
        .pricing-bg-glow {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(99,102,241,0.18), transparent 70%);
          pointer-events: none;
        }
        .pricing-header {
          width: 100%;
          max-width: 480px;
          margin-bottom: 40px;
        }
        .pricing-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #f8fafc;
        }
        .pricing-content {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: relative;
          z-index: 1;
        }
        .pricing-hero {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .pricing-badge {
          display: inline-block;
          background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2));
          border: 1px solid rgba(99,102,241,0.4);
          color: #a78bfa;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 100px;
        }
        .pricing-title {
          margin: 0;
          font-size: 36px;
          font-weight: 800;
          color: #f8fafc;
          line-height: 1.2;
        }
        .pricing-subtitle {
          margin: 0;
          color: #94a3b8;
          font-size: 16px;
        }
        .pricing-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .pricing-card-top {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pricing-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .pricing-currency {
          font-size: 24px;
          font-weight: 700;
          color: #f8fafc;
        }
        .pricing-amount {
          font-size: 52px;
          font-weight: 900;
          color: #f8fafc;
          line-height: 1;
        }
        .pricing-period {
          font-size: 16px;
          color: #94a3b8;
          margin-left: 4px;
        }
        .pricing-desc {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
        }
        .pricing-features {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 20px 0;
        }
        .pricing-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
          font-size: 14px;
        }
        .pricing-check {
          color: #6366f1;
          font-weight: 700;
          font-size: 15px;
          flex-shrink: 0;
        }
        .wompi-container {
          display: flex;
          justify-content: center;
        }
        .pricing-cta {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 8px 32px rgba(99,102,241,0.4);
        }
        .pricing-cta:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .pricing-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pricing-error {
          color: #f87171;
          font-size: 13px;
          text-align: center;
          margin: 0;
        }
        .pricing-guarantee {
          text-align: center;
          color: #64748b;
          font-size: 12px;
          margin: 0;
        }
        @media (max-width: 480px) {
          .pricing-title { font-size: 28px; }
          .pricing-amount { font-size: 42px; }
          .pricing-card { padding: 20px; }
        }
      `}</style>
    </>
  );
}
