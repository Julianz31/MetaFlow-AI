'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  TrendingUp, 
  CreditCard, 
  Target, 
  FlaskConical, 
  LogOut, 
  Tag, 
  ReceiptText, 
  PieChart 
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/movimientos', label: 'Movimientos', icon: ReceiptText },
  { href: '/estado-mensual', label: 'Estado Mensual', icon: PieChart },
  { href: '/categories', label: 'Categorías', icon: Tag },
  { href: '/inversiones', label: 'Inversiones', icon: TrendingUp },
  { href: '/deudas', label: 'Deudas', icon: CreditCard },
  { href: '/metas', label: 'Metas & IFI', icon: Target },
  { href: '/simulador', label: 'Simulador', icon: FlaskConical },
]

interface SidebarProps {
  ifi?: number
}

export default function Sidebar({ ifi = 0 }: SidebarProps) {
  const path = usePathname()
  const router = useRouter()

  async function logout() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ 
      width: '100%',
      minHeight: '100vh',
      display: 'flex', 
      flexDirection: 'column', 
      padding: '24px 16px',
      background: '#0f1115',
      position: 'relative',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '0 12px 24px', fontSize: 20, fontWeight: 700, color: 'white' }}>
        VAULT<span style={{ color: '#00d4aa' }}>.</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link 
              key={href} 
              href={href} 
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: '12px',
                borderRadius: 12, 
                fontSize: 14, 
                textDecoration: 'none',
                color: active ? 'white' : '#8a8f9e',
                background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={20} color={active ? '#00d4aa' : '#555b6a'} />
              <span style={{ color: active ? 'white' : '#8a8f9e' }}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Relleno para empujar el botón de logout al fondo */}
      <div style={{ flex: 1, minHeight: 40 }} />

      <button 
        onClick={logout} 
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          padding: '12px',
          background: 'none', 
          border: 'none', 
          color: '#555b6a', 
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <LogOut size={20} /> 
        <span style={{ color: '#8a8f9e' }}>Cerrar sesión</span>
      </button>
    </div>
  );
}