'use client'
import { useMemo } from 'react'
import { useTransacciones, useCategorias } from '@/hooks/useData'
import { Panel, KpiCard } from '@/components/ui'
import { fmt } from '@/lib/calculos'
import { Bar } from 'react-chartjs-2'
// IMPORTANTE: Añadimos el registro de ChartJS
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js'
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

// REGISTRO OBLIGATORIO: Esto le dice a la app cómo dibujar el gráfico
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function EstadoMensualPage() {
  const { data: txs } = useTransacciones()
  const { data: categorias } = useCategorias()
  const now = new Date()

  const analisis = useMemo(() => {
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    
    const gastosMes = txs.filter(t => 
      t.tipo === 'gasto' && 
      isWithinInterval(parseISO(t.fecha), { start, end })
    )

    const grupos: Record<string, number> = {}
    gastosMes.forEach(g => {
      grupos[g.categoria] = (grupos[g.categoria] || 0) + g.monto
    })

    const dataSorted = Object.entries(grupos)
      .sort((a, b) => b[1] - a[1])
    
    const totalGastos = dataSorted.reduce((acc, [, val]) => acc + val, 0)

    return {
      labels: dataSorted.map(([name]) => name),
      valores: dataSorted.map(([, val]) => val),
      porcentajes: dataSorted.map(([, val]) => totalGastos > 0 ? (val / totalGastos) * 100 : 0),
      totalGastos,
      categoriaMayor: dataSorted[0] || ['Ninguna', 0]
    }
  }, [txs])

  const chartData = {
    labels: analisis.labels,
    datasets: [{
      label: 'Gasto Total',
      data: analisis.valores,
      backgroundColor: 'rgba(255, 77, 106, 0.8)',
      borderRadius: 6,
      borderSkipped: false,
    }]
  }

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${fmt(ctx.raw, true)} (${analisis.porcentajes[ctx.dataIndex].toFixed(1)}%)`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#666' } 
      },
      y: { 
        grid: { display: false }, 
        ticks: { 
          color: '#fff', 
          font: { 
            size: 13, 
            weight: 'bold' as const // <--- Cambiamos '500' por 'bold' y añadimos 'as const'
          } 
        } 
      }
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Estado Mensual de Gastos</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>Análisis profundo de dónde se va tu dinero este mes</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Gasto Total Mes" value={fmt(analisis.totalGastos, true)} accent="var(--red)" />
        <KpiCard label="Mayor Gasto en" value={analisis.categoriaMayor[0]} accent="var(--gold)" />
        <KpiCard label="% del Mayor Gasto" value={`${((analisis.categoriaMayor[1] / analisis.totalGastos) * 100 || 0).toFixed(1)}%`} accent="var(--blue)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <Panel title="Distribución de Gastos por Categoría">
          <div style={{ height: 400 }}>
            {analisis.labels.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
            ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>No hay gastos registrados este mes.</div>
            )}
          </div>
        </Panel>

        <Panel title="Insights de Optimización">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {analisis.labels.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13 }}>Registra transacciones para ver el análisis.</p>}
            {analisis.labels.map((label, i) => (
              <div key={label} style={{ padding: 12, background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
                  <span style={{ fontSize: 14 }}>{fmt(analisis.valores[i], true)}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${analisis.porcentajes[i]}%`, 
                    background: analisis.porcentajes[i] > 30 ? 'var(--red)' : 'var(--blue)',
                    transition: 'width 1s ease-in-out'
                  }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                  Representa el <b>{analisis.porcentajes[i].toFixed(1)}%</b> de tus gastos totales.
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}