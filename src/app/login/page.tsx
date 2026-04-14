'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Btn } from '@/components/ui'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ email: '', password: '', nombre: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    if (mode === 'login') {
      const { error: err } = await sb.auth.signInWithPassword({ email: form.email, password: form.password })
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await sb.auth.signUp({ email: form.email, password: form.password, options: { data: { nombre: form.nombre } } })
      if (err) { setError(err.message); setLoading(false); return }
    }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,170,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', marginBottom: 8 }}>
            VAULT<span style={{ color: 'var(--green)' }}>.</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Tu panel de independencia financiera</div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg3)', borderRadius: 10, padding: 4 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', background: mode === m ? 'var(--bg2)' : 'transparent', color: mode === m ? 'var(--text)' : 'var(--text2)', fontSize: 14, fontWeight: mode === m ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <label>Nombre</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Tu nombre" />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" required />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label>Contraseña</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar a VAULT' : 'Crear cuenta'}
            </Btn>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          Tus datos son privados y encriptados con Supabase
        </div>
      </div>
    </div>
  )
}
