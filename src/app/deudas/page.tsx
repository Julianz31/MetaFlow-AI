'use client'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useDeudas, useInversiones, usePerfil } from '@/hooks/useData'
import { calcIFI, fmt, proyectarAvalanche } from '@/lib/calculos'
import { KpiCard, Panel, Btn, EmptyState, Badge } from '@/components/ui'
import FormDeuda from '@/components/forms/FormDeuda'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import type { Deuda } from '@/types'
import { createClient } from '@/lib/supabase'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const TIPO_LABEL: Record<string, string> = {
  tarjeta: 'Tarjeta', credito_hipotecario: 'Hipotecario', credito_vehiculo: 'Vehículo', personal: 'Personal', otro: 'Otro'
}

export default function DeudasPage() {
  const { data: deudas, loading, refetch } = useDeudas()
  const { data: inversiones } = useInversiones()
  const { perfil } = usePerfil()
  const ifi = useMemo(() => calcIFI(inversiones, perfil?.gastos_mensual ?? 2500), [inversiones, perfil])

  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Deuda | undefined>()

  const totales = useMemo(() => ({
    saldo: deudas.reduce((s, d) => s + d.saldo_actual, 0),
    cuota: deudas.reduce((s, d) => s + d.cuota_mensual, 0),
    intereses_anuales: deudas.reduce((s, d) => s + d.saldo_actual * (d.tasa_ea / 100), 0),
  }), [deudas])

  const proyeccion = useMemo(() => {
    if (!deudas.length) return []
    return proyectarAvalanche(deudas.map(d => ({ saldo: d.saldo_actual, tasa: d.tasa_ea, cuota: d.cuota_mensual })))
  }, [deudas])

  const proyMinimos = useMemo(() => {
    if (!deudas.length) return []
    return proyectarAvalanche(deudas.map(d => ({ saldo: d.saldo_actual, tasa: d.tasa_ea, cuota: d.cuota_mensual * 0.6 })))
  }, [deudas])

  const mesesLibre = proyeccion.findIndex(p => p.total === 0) + 1 || proyeccion.length

  const tickStyle = { color: '#555b6a', font: { family: 'JetBrains Mono', size: 10 } }
  const gridStyle = { color: 'rgba(255,255,255,0.04)' }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta deuda?')) return
    const sb = createClient()
    await sb.from('deudas').delete().eq('id', id)
    refetch()
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Deudas</h1>
          <div className="text-sm text-gray-400 mt-1">Estrategia avalancha activa · {deudas.length} registros</div>
        </div>
        <Btn onClick={() => { setEditando(undefined); setShowForm(true) }} className="w-full md:w-auto">
          <Plus size={16} /> Registrar deuda
        </Btn>
      </div>

      {/* KPI CARDS: Responsivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Deuda total" value={fmt(totales.saldo, true)} accent="var(--red)" change={`${deudas.length} activas`} />
        <KpiCard label="Cuota mensual" value={fmt(totales.cuota, true)} accent="var(--blue)" change="Pago total" />
        <KpiCard label="Intereses / año" value={fmt(totales.intereses_anuales, true)} accent="var(--amber)" change="Costo anual" />
        <KpiCard label="Libre en" value={mesesLibre > 0 ? `${mesesLibre} m` : '-'} accent="var(--green)" change={mesesLibre > 0 ? `~${(mesesLibre / 12).toFixed(1)} años` : '¡Libre!'} />
      </div>

      {/* CONTENIDO PRINCIPAL: Cards de deuda y Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* LISTA DE DEUDAS */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tus Obligaciones</h3>
          {loading ? (
            <div className="text-gray-500 text-sm py-4">Cargando...</div>
          ) : deudas.length === 0 ? (
            <Panel><EmptyState icon="🎉" text="¡Sin deudas!" /></Panel>
          ) : (
            deudas.sort((a, b) => b.tasa_ea - a.tasa_ea).map((deuda, i) => {
              const progreso = deuda.saldo_inicial > 0 ? ((deuda.saldo_inicial - deuda.saldo_actual) / deuda.saldo_inicial) * 100 : 0
              const color = deuda.tasa_ea > 25 ? '#ff4d6a' : deuda.tasa_ea > 15 ? '#f5a623' : '#4a9eff'
              return (
                <div key={deuda.id} className="bg-[#111318] border border-white/5 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base">{deuda.nombre}</span>
                        {i === 0 && <Badge label="Prioridad" color="var(--red)" />}
                      </div>
                      <div className="text-xs text-gray-500">{deuda.entidad} · {TIPO_LABEL[deuda.tipo]}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold" style={{ color }}>{fmt(deuda.saldo_actual)}</div>
                      <div className="text-[10px] text-gray-500">{deuda.tasa_ea}% EA</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#181b22] rounded-full h-2 mb-4 overflow-hidden">
                    <div className="h-full transition-all duration-700" style={{ width: `${progreso}%`, backgroundColor: color }} />
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <div className="flex gap-4">
                      <span>Cuota: <b className="text-white font-mono">{fmt(deuda.cuota_mensual)}</b></span>
                      <span>Pagado: <b className="text-white font-mono">{progreso.toFixed(0)}%</b></span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditando(deuda); setShowForm(true) }} className="p-2 hover:text-white transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => eliminar(deuda.id)} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* PROYECCIÓN */}
        <Panel title="Estrategia de Salida">
          {proyeccion.length > 0 ? (
            <div className="space-y-6">
              <div className="h-[220px] w-full">
                <Line data={{
                  labels: proyeccion.filter((_, i) => i % 3 === 0).map(p => `M${p.mes}`),
                  datasets: [
                    { label: 'Avalancha', data: proyeccion.filter((_, i) => i % 3 === 0).map(p => p.total), borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.06)', fill: true, tension: 0.4, pointRadius: 0 },
                    { label: 'Mínimos', data: proyMinimos.filter((_, i) => i % 3 === 0).map(p => p.total), borderColor: '#ff4d6a', borderDash: [4, 4], fill: false, tension: 0.4, pointRadius: 0 },
                  ]
                }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: gridStyle, ticks: tickStyle }, y: { grid: gridStyle, ticks: { ...tickStyle, callback: (v: any) => '$' + Number(v) / 1000 + 'k' } } } }} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tiempo Avalancha', value: `${mesesLibre} m`, color: '#00d4aa' },
                  { label: 'Tiempo Mínimos', value: `${proyMinimos.findIndex(p => p.total === 0) + 1 || proyMinimos.length} m`, color: '#ff4d6a' },
                  { label: 'D/I Ratio', value: `${((totales.cuota / 5800) * 100).toFixed(1)}%`, color: 'white' },
                  { label: 'Ahorro Interés', value: fmt(totales.intereses_anuales, true), color: '#f5a623' },
                ].map(s => (
                  <div key={s.label} className="bg-[#181b22] rounded-xl p-3 border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-tight">{s.label}</div>
                    <div className="font-mono text-sm font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState icon="📊" text="Agrega deudas para proyectar" />}
        </Panel>
      </div>

      {showForm && <FormDeuda onClose={() => { setShowForm(false); setEditando(undefined) }} onSuccess={refetch} editando={editando} />}
    </div>
  )
}