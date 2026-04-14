'use client'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useMetas, useInversiones, usePerfil, eliminarMeta, actualizarMeta } from '@/hooks/useData'
import { calcIFI, fmt, progresoPct, simularPatrimonio } from '@/lib/calculos'
import { KpiCard, Panel, Btn, EmptyState } from '@/components/ui'
import FormMeta from '@/components/forms/FormMeta'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import type { Meta } from '@/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function MetasPage() {
  const { data: metas, loading, refetch } = useMetas()
  const { data: inversiones } = useInversiones()
  const { perfil } = usePerfil()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Meta | undefined>()

  const ifi = useMemo(() => calcIFI(inversiones, perfil?.gastos_mensual ?? 2500), [inversiones, perfil])

  const ifiProyeccion = useMemo(() => simularPatrimonio({
    ahorro_mensual: 500,
    tasa_retorno_anual: 8,
    anios: 15,
    capital_inicial: inversiones.reduce((s, i) => s + i.valor_actual, 0),
    inflacion_anual: 4,
  }), [inversiones])

  const tickStyle = { color: '#555b6a', font: { family: 'JetBrains Mono', size: 10 } }
  const gridStyle = { color: 'rgba(255,255,255,0.04)' }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta meta?')) return
    await eliminarMeta(id)
    refetch()
  }

  async function abonarMeta(meta: Meta, monto: number) {
    await actualizarMeta(meta.id, { monto_actual: Math.min(meta.monto_actual + monto, meta.monto_meta) })
    refetch()
  }

  const metasCompletas = metas.filter(m => m.monto_actual >= m.monto_meta).length

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Metas & IFI</h1>
          <div className="text-sm text-gray-400 mt-1">
            {metasCompletas} de {metas.length} completadas · Independencia Financiera
          </div>
        </div>
        <Btn onClick={() => { setEditando(undefined); setShowForm(true) }} className="w-full md:w-auto">
          <Plus size={16} /> Nueva meta
        </Btn>
      </div>

      {/* IFI HERO RESPONSIVO */}
      <div className="bg-[#111318] border border-white/5 rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Círculo IFI */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="64" fill="none" stroke="#1a1f2a" strokeWidth="12" />
                <circle cx="80" cy="80" r="64" fill="none" stroke={ifi.ratio >= 100 ? '#00d4aa' : '#9b6dff'} strokeWidth="12"
                  strokeDasharray="402" strokeDashoffset={402 - (402 * Math.min(ifi.ratio, 100)) / 100}
                  strokeLinecap="round" transform="rotate(-90 80 80)" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: ifi.ratio >= 100 ? '#00d4aa' : '#9b6dff' }}>{ifi.ratio.toFixed(0)}%</span>
                <span className="text-xs text-gray-500 font-mono uppercase">IFI</span>
              </div>
            </div>
          </div>
          
          {/* Grid de Datos IFI */}
          <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 text-center lg:text-left uppercase tracking-widest">Desglose de Independencia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                { label: 'Renta pasiva / mes', value: fmt(ifi.renta_pasiva), color: '#00d4aa' },
                { label: 'Gastos mensuales', value: fmt(ifi.gastos_mensuales), color: 'white' },
                { label: 'Capital requerido', value: fmt(ifi.capital_requerido, true), color: '#f5a623' },
                { label: 'Capital actual', value: fmt(ifi.capital_actual, true), color: '#4a9eff' },
                { label: 'Tiempo estimado', value: `~${ifi.anios_para_libertad.toFixed(0)} años`, color: '#9b6dff' },
                { label: 'Brecha faltante', value: fmt(Math.max(0, ifi.capital_requerido - ifi.capital_actual), true), color: '#ff4d6a' },
              ].map(s => (
                <div key={s.label} className="bg-[#181b22] rounded-xl p-3 border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase">{s.label}</div>
                  <div className="font-mono text-sm font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* COLUMNA METAS */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Metas Activas</h3>
          {loading ? (
            <div className="text-gray-500 text-sm">Cargando...</div>
          ) : metas.length === 0 ? (
            <Panel><EmptyState icon="🎯" text="Sin metas" /></Panel>
          ) : (
            metas.map(meta => {
              const pct = progresoPct(meta.monto_actual, meta.monto_meta)
              const color = pct >= 100 ? '#00d4aa' : pct >= 50 ? '#4a9eff' : '#f5a623'
              return (
                <div key={meta.id} className="bg-[#111318] border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <span className="text-3xl">{meta.emoji}</span>
                      <div>
                        <div className="font-bold text-base">{meta.nombre}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {fmt(meta.monto_actual)} de {fmt(meta.monto_meta)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl font-bold" style={{ color }}>{pct}%</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#181b22] rounded-full h-2 mb-5 overflow-hidden">
                    <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-4">
                    {pct < 100 ? (
                      <div className="flex gap-2">
                        {[100, 500].map(monto => (
                          <button key={monto} onClick={() => abonarMeta(meta, monto)}
                            className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-[#181b22] text-gray-300 active:scale-95 transition-all">
                            +{fmt(monto, true)}
                          </button>
                        ))}
                      </div>
                    ) : <span className="text-xs text-emerald-400 font-bold">✓ COMPLETADA</span>}
                    
                    <div className="flex gap-2">
                      <button onClick={() => { setEditando(meta); setShowForm(true) }} className="p-2 text-gray-500"><Pencil size={14} /></button>
                      <button onClick={() => handleEliminar(meta.id)} className="p-2 text-gray-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* PROYECCIÓN IFI */}
        <Panel title="Crecimiento Proyectado">
          <div className="h-[250px] w-full mb-6">
            <Line data={{
              labels: ifiProyeccion.map(r => r.anio),
              datasets: [
                { label: 'IFI %', data: ifiProyeccion.map(r => Math.min(r.ifi, 100)), borderColor: '#9b6dff', backgroundColor: 'rgba(155,109,255,0.07)', fill: true, tension: 0.4, pointRadius: 0 },
                { label: 'Objetivo', data: ifiProyeccion.map(() => 100), borderColor: 'rgba(0,212,170,0.3)', borderDash: [5, 5], fill: false, pointRadius: 0 }
              ]
            }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: gridStyle, ticks: tickStyle }, y: { grid: gridStyle, max: 110, ticks: { ...tickStyle, callback: (v: any) => v + '%' } } } }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ifiProyeccion.filter((_, i) => [0, 4, 9, 14].includes(i)).map(r => (
              <div key={r.anio} className="bg-[#181b22] rounded-xl p-3 border border-white/5">
                <div className="text-[10px] text-gray-500 uppercase">{r.anio}</div>
                <div className="font-mono text-sm font-bold mt-1 text-white">{fmt(r.capital, true)}</div>
                <div className="text-[10px] text-emerald-400 mt-1">IFI {r.ifi}%</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {showForm && <FormMeta onClose={() => { setShowForm(false); setEditando(undefined) }} onSuccess={refetch} editando={editando} />}
    </div>
  )
}