import Head from 'next/head';
import Link from 'next/link';
import { FileText, ArrowLeft, ShieldAlert, Award, HelpCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="landing-body" style={{ minHeight: '100vh', background: '#090d16', color: '#cbd5e1', padding: '60px 20px' }}>
      <Head>
        <title>Términos del Servicio | MetaFlow.AI</title>
        <meta name="description" content="Términos y condiciones de servicio oficiales de MetaFlow.AI. Información sobre el uso de la plataforma de automatización." />
      </Head>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header Navigation */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)', paddingBottom: '20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            <ArrowLeft size={16} /> Volver al Inicio
          </Link>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.05em' }}>METAFLOW.AI</span>
        </nav>

        {/* Hero Section */}
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', marginBottom: '16px' }}>
            <FileText size={28} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc', margin: '0 0 10px 0' }}>Términos del Servicio</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Última actualización: 27 de Mayo, 2026</p>
        </header>

        {/* Content Panel */}
        <main className="card" style={{ padding: '40px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '16px', lineHeight: '1.7', fontSize: '15px' }}>
          
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={18} style={{ color: '#a78bfa' }} /> 1. Aceptación de los Términos
            </h2>
            <p>
              Al registrarte, iniciar sesión, pagar una suscripción o utilizar las herramientas y servicios de <strong>MetaFlow.AI</strong>, estás aceptando de forma explícita regirte por los presentes Términos de Servicio y por nuestra Política de Privacidad. Si no estás de acuerdo con alguno de estos términos, debes abstenerte de utilizar la plataforma.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={18} style={{ color: '#a78bfa' }} /> 2. Propósito y Uso de la Plataforma
            </h2>
            <p>
              MetaFlow.AI es una suite de automatización publicitaria y copiloto estratégico diseñada para ayudarte a optimizar, diagnosticar y programar campañas en redes sociales. La plataforma se integra de manera oficial con el servicio de Meta Ads APIs para:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li>Visualizar reportes interactivos agregados de rendimiento comercial.</li>
              <li>Crear anuncios multimedia (imágenes y copys inteligentes) para subirse directamente a tus cuentas.</li>
              <li>Evaluar métricas contra reglas preestablecidas para emitir alertas o pausar/escalar presupuestos de forma ágil bajo tu supervisión.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} style={{ color: '#a78bfa' }} /> 3. Responsabilidad sobre las Cuentas Publicitarias
            </h2>
            <p>
              Como usuario de MetaFlow.AI, comprendes y aceptas que:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li><strong>Presupuestos y Costos:</strong> Eres el único responsable del presupuesto publicitario asignado a tus campañas en Meta. MetaFlow.AI no asume ninguna responsabilidad sobre los cobros que te realice Meta por tus pautas.</li>
              <li><strong>Aprobaciones de Automatización:</strong> Aunque el motor de IA o las reglas automáticas recomienden acciones, tú tienes la potestad final de autorizar o programar las decisiones mediante el panel de aprobaciones.</li>
              <li><strong>Cumplimiento de Políticas de Meta:</strong> Tu contenido publicitario debe cumplir 100% con los términos y políticas comerciales oficiales de Meta. MetaFlow.AI no se hace responsable por penalizaciones, suspensiones o inhabilitaciones de tus perfiles comerciales.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HelpCircle size={18} style={{ color: '#a78bfa' }} /> 4. Pagos y Cancelación de Membresías
            </h2>
            <p>
              La facturación de los planes Pro, Business y Agency se realiza en modalidad de suscripción periódica recurrente mensual a través de pasarelas de pago cifradas seguras. Puedes cancelar tu membresía en cualquier momento desde tu panel de usuario o escribiendo a nuestro correo de soporte, lo cual detendrá los cobros futuros a partir de tu siguiente período de facturación.
            </p>
          </section>

          <section style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '25px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px' }}>5. Soporte y Consultas</h2>
            <p>
              Para cualquier duda, aclaración legal o soporte prioritario sobre el alcance y uso de la plataforma, escríbenos directamente a: <strong>julianzuluagaduque@gmail.com</strong>.
            </p>
          </section>

        </main>

        <footer style={{ marginTop: '40px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          &copy; {new Date().getFullYear()} MetaFlow.AI. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
