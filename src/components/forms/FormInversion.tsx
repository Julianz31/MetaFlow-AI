'use client'
import { useState } from 'react'
import { Modal, Btn, FormField } from '@/components/ui'
import { agregarInversion, actualizarInversion } from '@/hooks/useData'
import { TIPO_INVERSION_LABEL, type Inversion, type TipoInversion } from '@/types'

interface Props { onClose: () => void; onSuccess: () => void; editando?: Inversion }

export default function FormInversion({ onClose, onSuccess, editando }: Props) {
  const [form, setForm] = useState({
    nombre: editando?.nombre ?? '',
    ticker: editando?.ticker ?? '',
    tipo: editando?.tipo ?? 'etf' as TipoInversion,
    valor_actual: editando?.valor_actual?.toString() ?? '',
    costo_base: editando?.costo_base?.toString() ?? '',
    fecha_inicio: editando?.fecha_inicio ?? new Date().toISOString().split('T')[0],
    notas: editando?.notas ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.valor_actual || !form.costo_base) { setError('Nombre y montos son requeridos'); return }
    setLoading(true)
    const data = { ...form, valor_actual: parseFloat(form.valor_actual), costo_base: parseFloat(form.costo_base) }
    const { error: err } = editando
      ? await actualizarInversion(editando.id, data)
      : await agregarInversion(data)
    if (err) { setError(err.message); setLoading(false); return }
    onSuccess(); onClose()
  }

  return (
    <Modal title={editando ? 'Editar inversión' : 'Nueva inversión'} onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Nombre / Activo *">
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: ETF S&P 500" />
          </FormField>
          <FormField label="Ticker (opcional)">
            <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))} placeholder="Ej: VOO" style={{ textTransform: 'uppercase' }} />
          </FormField>
        </div>

        <FormField label="Tipo de activo">
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoInversion }))}>
            {Object.entries(TIPO_INVERSION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Valor actual (USD) *">
            <input type="number" step="0.01" min="0" value={form.valor_actual} onChange={e => setForm(f => ({ ...f, valor_actual: e.target.value }))} placeholder="0.00" />
          </FormField>
          <FormField label="Costo base / invertido *">
            <input type="number" step="0.01" min="0" value={form.costo_base} onChange={e => setForm(f => ({ ...f, costo_base: e.target.value }))} placeholder="0.00" />
          </FormField>
        </div>

        <FormField label="Fecha de inicio">
          <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
        </FormField>

        <FormField label="Notas">
          <textarea rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Plataforma, cuenta, observaciones..." style={{ resize: 'none' }} />
        </FormField>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Guardando...' : editando ? 'Actualizar' : 'Agregar inversión'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
