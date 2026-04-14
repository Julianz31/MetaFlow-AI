'use client'
import { useState, useMemo } from 'react'
import { useInversiones } from '@/hooks/useData'
import { simularPatrimonio, fmt, calcIFI } from '@/lib/calculos'
import { KpiCard, Panel } from '@/components/ui'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend)

export default function SimuladorPage() {
  const { data: inversiones } = useInversiones()
  const capitalActual = inversiones.reduce((s, i) => s + i.valor_actual, 0)

  const [params, setParams] = useState({
    ahorro_mensual: 500,
    tasa_retorno_anual: 8,
    anios: 20,
    capital_inicial: Math.round(capitalActual) || 10000,
    inflacion_anual: 4,
    gastos_mensuales: 2500,
  })

  const resultados = useMemo(() => simularPatrimonio({
    ahorro_mensual: params.ahorro_mensual,
    tasa_retorno_anual: params.tasa_retorno_anual,
    anios: params.anios,
    capital_inicial: params.capital_inicial,
    inflacion_anual: params.inflacion_anual,
  }), [params])

  const conservador = useMemo(() => simularPatrimonio({ ...params, tasa_retorno_anual: params.tasa_retorno_anual - 3, ahorro_mensual: params.ahorro_mensual * 0.7 }), [params])
  const agresivo = useMemo(() => simularPatrimonio({ ...params, tasa_retorno_anual: params.tasa_retorno_anual + 3, ahorro_mensual: params.ahorro_mensual * 1.3 }), [params])

  const ultimo = resultados[resultados.length - 1]
  const anioLibertad = resultados.find(r => r.ifi >= 100)?.anio

  const tickStyle = { color: '#555b6a', font: { family: 'JetBrains Mono', size: 10 } }
  const gridStyle = { color: 'rgba(255,255,255,0.04)' }

  function Slider({ label, param, min, max, step, suffix = '' }: { label: string; param: keyof typeof params; min: number; max: number; step: number; suffix?: string }) {
    return (
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          <span className="font-mono text-sm text-emerald-400 font-bold">
            {suffix === '$' ? fmt(params[param] as number, true) : `${params[param]}${suffix}`}
          </span>
        </div>
        <input type="range" min={min} max={max} step={step} value={params[param] as number}
          onChange={e => setParams(p => ({ ...p, [param]: parseFloat(e.target.value) }))}
          className="w-full h-1.5 bg-[#181b22] rounded-lg appearance-none cursor-pointer accent-emerald-500" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Simulador</h1>
        <p className="text-sm text-gray-400 mt-1">Proyecta tu futuro financiero</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Patrimonio Final" value={fmt(ultimo?.capital ?? 0, true)} accent="var(--green)" change={`${params.anios} años`} />
        <KpiCard label="Interés Ganado" value={fmt(ultimo?.ganancia ?? 0, true)} accent="var(--blue)" change="Compuesto" />
        <KpiCard label="IFI Final" value={`${ultimo?.ifi ?? 0}%`} accent={(ultimo?.ifi ?? 0) >= 100 ? 'var(--green)' : 'var(--amber)'} change="Independencia" />
        <KpiCard label="Año Libertad" value={anioLibertad ? String(anioLibertad) : 'N/A'} accent="var(--gold)" change={anioLibertad ? 'Alcanzado' : 'Sigue ahorrando'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PARÁMETROS: 1 columna en móvil */}
        <div className="lg:col-span-1">
          <Panel title="Configuración">
            <Slider label="Ahorro mensual" param="ahorro_mensual" min={100} max={5000} step={50} suffix="$" />
            <Slider label="Capital inicial" param="capital_inicial" min={0} max={200000} step={1000} suffix="$" />
            <Slider label="Retorno anual" param="tasa_retorno_anual" min={2} max={20} step={0.5} suffix="%" />
            <Slider label="Horizonte (años)" param="anios" min={5} max={40} step={1} suffix="" />
            
            <div className="p-4 bg-[#181b22] border border-white/5 rounded-xl mt-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Objetivo 100% IFI</div>
              <div className="text-lg font-mono font-bold text-emerald-400">{fmt(params.gastos_mensuales * 12 / 0.04, true)}</div>
            </div>
          </Panel>
        </div>

        {/* GRÁFICAS: 2 columnas en PC */}
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Proyección Patrimonial">
            <div className="h-[280px] w-full">
              <Line data={{
                labels: resultados.map(r => r.anio),
                datasets: [
                  { label: 'Base', data: resultados.map(r => r.capital), borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.06)', fill: true, tension: 0.4, pointRadius: 0 },
                  { label: 'Cons.', data: conservador.map(r => r.capital), borderColor: '#555b6a', borderDash: [5, 5], fill: false, tension: 0.4, pointRadius: 0 },
                  { label: 'Agresivo', data: agresivo.map(r => r.capital), borderColor: '#9b6dff', borderDash: [2, 2], fill: false, tension: 0.4, pointRadius: 0 },
                ]
              }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: gridStyle, ticks: tickStyle }, y: { grid: gridStyle, ticks: { ...tickStyle, callback: (v: any) => '$' + (Number(v) / 1000).toFixed(0) + 'k' } } } }} />
            </div>
          </Panel>

          <Panel title="Evolución del IFI %">
            <div className="h-[180px] w-full">
              <Line data={{
                labels: resultados.map(r => r.anio),
                datasets: [
                  { label: 'IFI', data: resultados.map(r => Math.min(r.ifi, 100)), borderColor: '#9b6dff', backgroundColor: 'rgba(155,109,255,0.07)', fill: true, tension: 0.4, pointRadius: 0 },
                  { label: 'Meta', data: resultados.map(() => 100), borderColor: 'rgba(0,212,170,0.2)', borderDash: [5, 5], fill: false, pointRadius: 0 }
                ]
              }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: gridStyle, ticks: tickStyle }, y: { grid: gridStyle, max: 110, ticks: { ...tickStyle, callback: (v: any) => v + '%' } } } }} />
            </div>

            {/* TABLA DE RESUMEN: Scroll horizontal en móvil */}
            <div className="overflow-x-auto -mx-4 px-4 mt-6">
              <div className="flex gap-3 min-w-[600px] pb-2">
                {resultados.filter((_, i) => i % 4 === 0).map(r => (
                  <div key={r.anio} className="flex-1 bg-[#181b22] border border-white/5 rounded-xl p-4 text-center">
                    <div className="text-[10px] text-gray-500 mb-1">{r.anio}</div>
                    <div className="font-mono text-sm font-bold text-white">{fmt(r.capital, true)}</div>
                    <div className={`text-[10px] mt-1 font-bold ${r.ifi >= 100 ? 'text-emerald-400' : 'text-gray-400'}`}>IFI {r.ifi}%</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}