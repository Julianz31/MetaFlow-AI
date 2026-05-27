import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, Trash2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="landing-body" style={{ minHeight: '100vh', background: '#090d16', color: '#cbd5e1', padding: '60px 20px' }}>
      <Head>
        <title>Política de Privacidad | MetaFlow.AI</title>
        <meta name="description" content="Política de privacidad oficial de MetaFlow.AI. Información sobre el uso de Meta APIs, encriptación y protección de datos." />
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
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc', margin: '0 0 10px 0' }}>Política de Privacidad</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Última actualización: 27 de Mayo, 2026</p>
        </header>

        {/* Content Panel */}
        <main className="card" style={{ padding: '40px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: '16px', lineHeight: '1.7', fontSize: '15px' }}>
          
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={18} style={{ color: '#a78bfa' }} /> 1. Introducción y Compromiso de Seguridad
            </h2>
            <p>
              En <strong>MetaFlow.AI</strong>, la privacidad y seguridad de tu información comercial y publicitaria es nuestra máxima prioridad. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos tus datos cuando conectas tus cuentas a través de las APIs oficiales de Meta (Facebook Login for Business).
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} style={{ color: '#a78bfa' }} /> 2. Información que Recopilamos mediante Meta APIs
            </h2>
            <p>
              Cuando autorizas la conexión de Meta Ads a través de nuestro Onboarding de 1 clic, accedemos estrictamente a los siguientes datos bajo tu consentimiento explícito:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
              <li><strong>Tokens de Acceso de Usuario (User Access Tokens):</strong> Claves temporales y de larga duración extendidas a 60 días otorgadas por Meta para autenticar las peticiones a la API.</li>
              <li><strong>Datos de Campañas Publicitarias (Ads Insights):</strong> Estadísticas de rendimiento (Inversión, ROAS, facturación, impresiones, CTR, clics, CPM, CPC) correspondientes a los últimos 7 días de pauta.</li>
              <li><strong>Identificadores de Activos de Marca:</strong> IDs de Cuentas Publicitarias, Fan Pages de Facebook, Cuentas de Instagram y Pixeles de Conversión para sincronizar e instrumentar el dashboard.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} style={{ color: '#a78bfa' }} /> 3. ¿Cómo Protegemos y Encriptamos tu Token?
            </h2>
            <p>
              Bajo ninguna circunstancia almacenamos tus credenciales de acceso de Meta en texto plano. 
              Antes de guardarse en nuestras bases de datos en la nube (Supabase), tu Token de Acceso de larga duración es encriptado en el servidor web de Next.js utilizando un algoritmo criptográfico avanzado de grado militar: <strong>AES-256-CBC con vectores de inicialización (IV) aleatorios</strong> y un secreto cifrado único resguardado en variables de entorno.
            </p>
            <p>
              Tu token solo se desencripta temporalmente en memoria del servidor cuando es estrictamente necesario para jalar las métricas que verás en tu Dashboard o para evaluar las reglas automáticas que configures.
            </p>
          </section>

          <section id="data-deletion" style={{ marginBottom: '30px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '25px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={18} style={{ color: '#ef4444' }} /> 4. Revocación de Accesos e Instrucciones de Eliminación de Datos
            </h2>
            <p>
              Tú tienes el control absoluto de tus datos en todo momento. Si deseas desvincular tus cuentas de Meta y eliminar por completo toda tu información publicitaria de nuestros servidores, puedes hacerlo de forma autónoma siguiendo estos pasos:
            </p>
            <ol style={{ paddingLeft: '20px', margin: '15px 0' }}>
              <li>Inicia sesión en tu cuenta de <strong>MetaFlow.AI</strong>.</li>
              <li>Ve a la pestaña de <strong>Ajustes (Settings)</strong> en la barra lateral.</li>
              <li>En el recuadro de conexión de Meta, haz clic en el botón <strong>"Eliminar Conexión / Desconectar"</strong>.</li>
              <li>Esto borrará de inmediato y de forma permanente tu token cifrado, tu ID de cuenta publicitaria y todos tus activos en caché de nuestras bases de datos de Supabase.</li>
            </ol>
            <p style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '14px', borderRadius: '10px', fontSize: '14px', color: '#fca5a5' }}>
              <strong>Instrucciones desde Facebook:</strong> También puedes revocar los accesos directamente desde tu perfil de Facebook. Ve a <em>Configuración y Privacidad &gt; Configuración &gt; Aplicaciones y sitios web</em>, busca <strong>MetaFlow.AI</strong> y haz clic en <strong>Eliminar</strong>. Al hacer esto, Meta nos notificará de forma segura y eliminaremos cualquier dato residual de inmediato.
            </p>
          </section>

          <section style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '25px' }}>
            <h2 style={{ fontSize: '18px', color: '#f8fafc', fontWeight: '700', marginBottom: '12px' }}>5. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de privacidad, la seguridad de tus datos, o deseas solicitar una eliminación manual y expedita de tu información de usuario, escríbenos directamente a: <strong>julianzuluagaduque@gmail.com</strong>.
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
