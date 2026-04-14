'use client'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useInversiones, eliminarInversion, usePerfil } from '@/hooks/useData'
import { calcIFI, fmt } from '@/lib/calculos'
import { KpiCard, Panel, Btn, EmptyState, Badge } from '@/components/ui'
import FormInversion from '@/components/forms/FormInversion'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend } from 'chart.js'
import type { Inversion } from '@/types'
import { TIPO_INVERSION_LABEL } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend)

const COLORS = ['#00d4aa','#4a9eff','#f5a623','#9b6dff','#c9a84c','#ff4d6a','#5dcaa5']

export default function InversionesPage() {
  const { data: inversiones, loading, refetch } = useInversiones()
  const { perfil } = usePerfil()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Inversion | undefined>()

  const ifi = useMemo(() => calcIFI(inversiones, perfil?.gastos_mensual ?? 2500), [inversiones, perfil])

  const totales = useMemo(() => ({
    valor: inversiones.reduce((s, i) => s + i.valor_actual, 0),
    costo: inversiones.reduce((s, i) => s + i.costo_base, 0),
  }), [inversiones])

  const ganancia = totales.valor - totales.costo
  const rendimientoPct = totales.costo > 0 ? (ganancia / totales.costo) * 100 : 0

  const porTipo = useMemo(() => {
    const map: Record<string, number> = {}
    inversiones.forEach(i => { map[i.tipo] = (map[i.tipo] || 0) + i.valor_actual })
    return Object.entries(map)
  }, [inversiones])

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta inversión?')) return
    await eliminarInversion(id)
    refetch()
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Inversiones</h1>
          <div className="text-sm text-gray-400 mt-1">Portafolio completo · {inversiones.length} posiciones</div>
        </div>
        <Btn onClick={() => { setEditando(undefined); setShowForm(true) }} className="w-full md:w-auto">
          <Plus size={16} /> Agregar activo
        </Btn>
      </div>

      {/* KPI CARDS: 1 col móvil, 2 tablet, 4 PC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Valor portafolio" value={fmt(totales.valor, true)} accent="var(--green)" change="Valor actual total" />
        <KpiCard label="Ganancia / Pérdida" value={fmt(ganancia, true)} accent={ganancia >= 0 ? 'var(--blue)' : 'var(--red)'} change={`${rendimientoPct.toFixed(1)}% retorno total`} />
        <KpiCard label="Renta pasiva / mes" value={fmt(ifi.renta_pasiva, true)} accent="var(--gold)" change="Regla del 4% anual" />
        <KpiCard label="IFI actual" value={`${ifi.ratio.toFixed(1)}%`} accent={ifi.ratio >= 100 ? 'var(--green)' : 'var(--purple)'} change={ifi.ratio >= 100 ? '¡Independiente!' : `~${ifi.anios_para_libertad.toFixed(0)} años`} />
      </div>

      {/* GRÁFICOS Y DISTRIBUCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel title="Distribución por tipo">
          {porTipo.length > 0 ? (
            <div className="h-[250px] w-full flex justify-center">
              <Doughnut data={{
                labels: porTipo.map(([tipo]) => TIPO_INVERSION_LABEL[tipo as keyof typeof TIPO_INVERSION_LABEL] ?? tipo),
                datasets: [{ data: porTipo.map(([, v]) => v), backgroundColor: COLORS, borderWidth: 0 }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8a8f9e', padding: 20 } } } }} />
            </div>
          ) : <EmptyState icon="🥧" text="Agrega inversiones" />}
        </Panel>

        <Panel title="Libertad Financiera (IFI)">
          <div className="flex flex-col items-center py-4 text-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1f2a" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={ifi.ratio >= 100 ? '#00d4aa' : '#9b6dff'} strokeWidth="8"
                  strokeDasharray="283" strokeDashoffset={283 - (283 * Math.min(ifi.ratio, 100)) / 100}
                  strokeLinecap="round" transform="rotate(-90 50 50)" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: ifi.ratio >= 100 ? '#00d4aa' : '#9b6dff' }}>{ifi.ratio.toFixed(0)}%</span>
                <span className="text-[10px] text-gray-500 uppercase">IFI</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">{fmt(ifi.renta_pasiva)} / mes generados</p>
            <p className="text-xs text-gray-500 mt-1">Capital requerido: {fmt(ifi.capital_requerido, true)}</p>
          </div>
        </Panel>
      </div>

      {/* TABLA DE POSICIONES: Con scroll horizontal en móvil */}
      <Panel title="Posiciones Detalladas">
        <div className="overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b border-white/5">
                <th className="py-3 px-2">Activo</th>
                <th className="py-3 px-2 text-right">Valor</th>
                <th className="py-3 px-2 text-right">Costo</th>
                <th className="py-3 px-2 text-right">Ganancia</th>
                <th className="py-3 px-2 text-right">% Port.</th>
                <th className="py-3 px-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {inversiones.map((inv, idx) => {
                const gan = inv.valor_actual - inv.costo_base
                const ganPct = inv.costo_base > 0 ? (gan / inv.costo_base) * 100 : 0
                const pctPortafolio = totales.valor > 0 ? (inv.valor_actual / totales.valor) * 100 : 0
                return (
                  <tr key={inv.id} className="border-b border-white/5 last:border-0">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                        <div>
                          <div className="font-medium">{inv.nombre}</div>
                          <div className="text-[10px] text-gray-500">{inv.ticker || 'ACTIVO'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right font-mono">{fmt(inv.valor_actual)}</td>
                    <td className="py-4 px-2 text-right font-mono text-gray-500">{fmt(inv.costo_base)}</td>
                    <td className={`py-4 px-2 text-right font-mono ${gan >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {fmt(gan)} <span className="text-[10px]">({ganPct.toFixed(1)}%)</span>
                    </td>
                    <td className="py-4 px-2 text-right font-mono text-gray-400">{pctPortafolio.toFixed(1)}%</td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setEditando(inv); setShowForm(true) }} className="p-1.5 text-gray-500 hover:text-white"><Pencil size={14} /></button>
                        <button onClick={() => eliminar(inv.id)} className="p-1.5 text-gray-500 hover:text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {showForm && <FormInversion onClose={() => { setShowForm(false); setEditando(undefined) }} onSuccess={refetch} editando={editando} />}
    </div>
  )
}