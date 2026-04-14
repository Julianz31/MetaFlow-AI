'use client'
import { X } from 'lucide-react'
import { colorPresupuesto } from '@/lib/calculos'

// ── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { title: string; onClose: () => void; children: React.ReactNode }
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}
export function Btn({ variant = 'primary', size = 'md', children, style, ...rest }: BtnProps) {
  const bg = variant === 'primary' ? 'var(--green)' : variant === 'danger' ? 'var(--red)' : 'var(--bg3)'
  const color = variant === 'ghost' ? 'var(--text2)' : '#000'
  const pad = size === 'sm' ? '6px 14px' : '10px 20px'
  return (
    <button style={{ background: bg, color, border: 'none', borderRadius: 8, padding: pad, fontSize: size === 'sm' ? 13 : 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'opacity 0.15s', ...style }} {...rest}>
      {children}
    </button>
  )
}

// ── KpiCard ──────────────────────────────────────────────────────────────────
interface KpiProps { label: string; value: string; change?: string; changeUp?: boolean; accent: string }
export function KpiCard({ label, value, change, changeUp, accent }: KpiProps) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ fontSize: 11, letterSpacing: '0.8px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, letterSpacing: '-1px', color: accent }}>{value}</div>
      {change && (
        <div style={{ fontSize: 12, marginTop: 6, color: changeUp === undefined ? 'var(--text2)' : changeUp ? 'var(--green)' : 'var(--red)' }}>
          {changeUp === true ? '▲' : changeUp === false ? '▼' : ''} {change}
        </div>
      )}
    </div>
  )
}

// ── Panel ────────────────────────────────────────────────────────────────────
interface PanelProps { title?: string; sub?: string; children: React.ReactNode; style?: React.CSSProperties; action?: React.ReactNode }
export function Panel({ title, sub, children, style, action }: PanelProps) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.3px' }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
interface ProgProps { value: number; max: number; label: string; sublabel?: string }
export function ProgressBar({ value, max, label, sublabel }: ProgProps) {
  const pct = Math.min((value / max) * 100, 100)
  const color = colorPresupuesto(pct)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)' }}>{sublabel ?? `${value.toLocaleString()} / ${max.toLocaleString()}`}</span>
      </div>
      <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────
interface FieldProps { label: string; children: React.ReactNode }
export function FormField({ label, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label>{label}</label>
      {children}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, text, cta }: { icon: string; text: string; cta?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
      <div style={{ fontSize: 36 }}>{icon}</div>
      <div style={{ fontSize: 14, color: 'var(--text3)' }}>{text}</div>
      {cta}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{ background: color ? `${color}22` : 'var(--bg3)', color: color ?? 'var(--text2)', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
      {label}
    </span>
  )
}
