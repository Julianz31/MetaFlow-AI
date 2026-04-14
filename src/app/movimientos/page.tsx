'use client'
import { useState, useMemo } from 'react'
import { Trash2, ArrowUpCircle, ArrowDownCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransacciones, eliminarTransaccion } from '@/hooks/useData'
import { Panel, EmptyState } from '@/components/ui'
import { fmt } from '@/lib/calculos'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'

export default function MovimientosPage() {
  const { data: txs, loading, refetch } = useTransacciones()
  const [fechaFiltro, setFechaFiltro] = useState(new Date()) // Estado para el mes
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'gasto'>('todos')

  // Funciones para navegar entre meses
  const navegarMes = (direccion: 'atras' | 'adelante') => {
    setFechaFiltro(prev => direccion === 'atras' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const movimientosFiltrados = useMemo(() => {
    const start = startOfMonth(fechaFiltro)
    const end = endOfMonth(fechaFiltro)

    return txs.filter(t => {
      const fechaTx = parseISO(t.fecha)
      const coincideMes = isWithinInterval(fechaTx, { start, end })
      const coincideBusqueda = t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || 
                               t.categoria.toLowerCase().includes(busqueda.toLowerCase())
      const coincideTipo = filtroTipo === 'todos' || t.tipo === filtroTipo
      
      return coincideMes && coincideBusqueda && coincideTipo
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [txs, busqueda, filtroTipo, fechaFiltro])

  async function handleDelete(id: string) {
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
      await eliminarTransaccion(id)
      refetch()
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Historial</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>Gestiona tus registros de {format(fechaFiltro, 'MMMM yyyy', { locale: es })}</p>
        </div>

        {/* NAVEGACIÓN DE MESES */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          background: 'var(--bg2)', 
          padding: '8px 16px', 
          borderRadius: 12, 
          border: '1px solid var(--border)' 
        }}>
          <button onClick={() => navegarMes('atras')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text1)', display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', minWidth: 110, textAlign: 'center' }}>
            {format(fechaFiltro, "MMMM yyyy", { locale: es })}
          </span>
          <button onClick={() => navegarMes('adelante')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text1)', display: 'flex' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* HERRAMIENTAS */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 12, 
        marginBottom: 20 
      }}>
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input 
            style={{ 
              width: '100%', 
              padding: '12px 12px 12px 40px', 
              borderRadius: 10, 
              background: 'var(--bg2)', 
              border: '1px solid var(--border)', 
              fontSize: 14,
              color: 'white'
            }}
            placeholder="Buscar en este mes..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <select 
          style={{ 
            flex: '1 1 140px',
            padding: '12px', 
            borderRadius: 10, 
            background: 'var(--bg2)', 
            border: '1px solid var(--border)', 
            fontSize: 14,
            color: 'white'
          }}
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value as any)}
        >
          <option value="todos">Todos los tipos</option>
          <option value="ingreso">Solo Ingresos</option>
          <option value="gasto">Solo Egresos</option>
        </select>
      </div>

      <Panel title={`${movimientosFiltrados.length} Movimientos`}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Cargando...</div>
        ) : movimientosFiltrados.length === 0 ? (
          <EmptyState icon="💸" text={`No hay registros en ${format(fechaFiltro, 'MMMM', { locale: es })}`} />
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: 11, color: 'var(--text3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '12px 10px' }}>Fecha</th>
                  <th style={{ padding: '12px 10px' }}>Descripción</th>
                  <th style={{ padding: '12px 10px' }}>Categoría</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <td style={{ padding: '16px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {format(parseISO(t.fecha), 'dd MMM', { locale: es })}
                    </td>
                    <td style={{ padding: '16px 10px', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {t.tipo === 'ingreso' ? <ArrowUpCircle size={16} color="#00d4aa" /> : <ArrowDownCircle size={16} color="#ff4d6a" />}
                        {t.descripcion}
                      </div>
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--bg3)', fontSize: 12, border: '1px solid var(--border)' }}>
                        {t.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: 600, color: t.tipo === 'ingreso' ? '#00d4aa' : 'inherit', whiteSpace: 'nowrap' }}>
                      {t.tipo === 'gasto' ? '-' : '+'} {fmt(t.monto, true)}
                    </td>
                    <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        style={{ background: 'none', border: 'none', color: '#ff4d6a', cursor: 'pointer', padding: 8, opacity: 0.7 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}