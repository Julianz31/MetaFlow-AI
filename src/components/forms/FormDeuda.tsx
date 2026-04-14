'use client'
import { useState } from 'react'
import { Modal, Btn, FormField } from '@/components/ui'
import { agregarDeuda, actualizarDeuda } from '@/hooks/useData'
import type { Deuda, TipoDeuda } from '@/types'

interface Props { onClose: () => void; onSuccess: () => void; editando?: Deuda }

const TIPOS: { value: TipoDeuda; label: string }[] = [
  { value: 'tarjeta', label: 'Tarjeta de crédito' },
  { value: 'credito_hipotecario', label: 'Crédito hipotecario' },
  { value: 'credito_vehiculo', label: 'Crédito de vehículo' },
  { value: 'personal', label: 'Préstamo personal' },
  { value: 'otro', label: 'Otro' },
]

export default function FormDeuda({ onClose, onSuccess, editando }: Props) {
  const [form, setForm] = useState({
    nombre: editando?.nombre ?? '',
    entidad: editando?.entidad ?? '',
    tipo: editando?.tipo ?? 'personal' as TipoDeuda,
    saldo_inicial: editando?.saldo_inicial?.toString() ?? '',
    saldo_actual: editando?.saldo_actual?.toString() ?? '',
    tasa_ea: editando?.tasa_ea?.toString() ?? '',
    cuota_mensual: editando?.cuota_mensual?.toString() ?? '',
    fecha_inicio: editando?.fecha_inicio ?? new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.saldo_actual || !form.tasa_ea || !form.cuota_mensual) {
      setError('Completa todos los campos requeridos')
      return
    }
    setLoading(true)
    const data = {
      ...form,
      saldo_inicial: parseFloat(form.saldo_inicial || form.saldo_actual),
      saldo_actual: parseFloat(form.saldo_actual),
      tasa_ea: parseFloat(form.tasa_ea),
      cuota_mensual: parseFloat(form.cuota_mensual),
    }
    const { error: err } = editando
      ? await actualizarDeuda(editando.id, data)
      : await agregarDeuda(data)
    if (err) { setError(err.message); setLoading(false); return }
    onSuccess(); onClose()
  }

  return (
    <Modal title={editando ? 'Editar deuda' : 'Registrar deuda'} onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Nombre *">
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Tarjeta Visa" />
          </FormField>
          <FormField label="Entidad">
            <input value={form.entidad} onChange={e => setForm(f => ({ ...f, entidad: e.target.value }))} placeholder="Ej: Bancolombia" />
          </FormField>
        </div>

        <FormField label="Tipo de deuda">
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoDeuda }))}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Saldo inicial (USD)">
            <input type="number" step="0.01" min="0" value={form.saldo_inicial} onChange={e => setForm(f => ({ ...f, saldo_inicial: e.target.value }))} placeholder="0.00" />
          </FormField>
          <FormField label="Saldo actual (USD) *">
            <input type="number" step="0.01" min="0" value={form.saldo_actual} onChange={e => setForm(f => ({ ...f, saldo_actual: e.target.value }))} placeholder="0.00" />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Tasa EA (%) *">
            <input type="number" step="0.1" min="0" value={form.tasa_ea} onChange={e => setForm(f => ({ ...f, tasa_ea: e.target.value }))} placeholder="Ej: 28.5" />
          </FormField>
          <FormField label="Cuota mensual (USD) *">
            <input type="number" step="0.01" min="0" value={form.cuota_mensual} onChange={e => setForm(f => ({ ...f, cuota_mensual: e.target.value }))} placeholder="0.00" />
          </FormField>
        </div>

        <FormField label="Fecha de inicio">
          <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
        </FormField>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit" disabled={loading}>{loading ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar deuda'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
