'use client'
import { useState } from 'react'
import { Modal, Btn, FormField } from '@/components/ui'
import { agregarMeta, actualizarMeta } from '@/hooks/useData'
import type { Meta } from '@/types'

interface Props { onClose: () => void; onSuccess: () => void; editando?: Meta }

const EMOJIS = ['🎯','🏠','✈️','🚗','💻','📚','🏋️','🛡️','💎','🌴','🎓','👶']

export default function FormMeta({ onClose, onSuccess, editando }: Props) {
  const [form, setForm] = useState({
    nombre: editando?.nombre ?? '',
    emoji: editando?.emoji ?? '🎯',
    monto_meta: editando?.monto_meta?.toString() ?? '',
    monto_actual: editando?.monto_actual?.toString() ?? '0',
    fecha_meta: editando?.fecha_meta ?? '',
    ahorro_mensual: editando?.ahorro_mensual?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.monto_meta) { setError('Nombre y monto son requeridos'); return }
    setLoading(true)
    const data = {
      ...form,
      monto_meta: parseFloat(form.monto_meta),
      monto_actual: parseFloat(form.monto_actual || '0'),
      ahorro_mensual: form.ahorro_mensual ? parseFloat(form.ahorro_mensual) : undefined,
      fecha_meta: form.fecha_meta || undefined,
    }
    const { error: err } = editando
      ? await actualizarMeta(editando.id, data)
      : await agregarMeta(data)
    if (err) { setError(err.message); setLoading(false); return }
    onSuccess(); onClose()
  }

  return (
    <Modal title={editando ? 'Editar meta' : 'Nueva meta'} onClose={onClose}>
      <form onSubmit={submit}>
        <FormField label="Elige un emoji">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
            {EMOJIS.map(em => (
              <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))}
                style={{ fontSize: 22, padding: '6px 10px', borderRadius: 8, border: `1px solid ${form.emoji === em ? 'var(--green)' : 'var(--border)'}`, background: form.emoji === em ? 'rgba(0,212,170,0.1)' : 'var(--bg3)', cursor: 'pointer' }}>
                {em}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Nombre de la meta *">
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Fondo de emergencia" />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Monto objetivo (USD) *">
            <input type="number" step="0.01" min="0" value={form.monto_meta} onChange={e => setForm(f => ({ ...f, monto_meta: e.target.value }))} placeholder="0.00" />
          </FormField>
          <FormField label="Monto actual (USD)">
            <input type="number" step="0.01" min="0" value={form.monto_actual} onChange={e => setForm(f => ({ ...f, monto_actual: e.target.value }))} placeholder="0.00" />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Ahorro mensual (USD)">
            <input type="number" step="0.01" min="0" value={form.ahorro_mensual} onChange={e => setForm(f => ({ ...f, ahorro_mensual: e.target.value }))} placeholder="0.00" />
          </FormField>
          <FormField label="Fecha objetivo">
            <input type="date" value={form.fecha_meta} onChange={e => setForm(f => ({ ...f, fecha_meta: e.target.value }))} />
          </FormField>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear meta'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
