'use client'
import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Mic, Loader2, X } from 'lucide-react'
import { useTransacciones, usePresupuestos, usePerfil, agregarTransaccion } from '@/hooks/useData'
import { analizarTransaccionIA } from '@/lib/gemini'
import { fmt } from '@/lib/calculos'
import { KpiCard, Panel } from '@/components/ui'
import FormTransaccion from '@/components/forms/FormTransaccion'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function Page() {
  const [fechaFiltro, setFechaFiltro] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [isEscuchando, setIsEscuchando] = useState(false)
  const [isAnalizando, setIsAnalizando] = useState(false)
  const [comandoVoz, setComandoVoz] = useState('')

  const { data: txs, refetch: refetchTx } = useTransacciones()
  const { perfil } = usePerfil()

  const iniciarAsistenteVoz = () => {
    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRecognition) return alert("Navegador no soportado");
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onstart = () => { setIsEscuchando(true); setComandoVoz(''); };
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setComandoVoz(transcript);
      setIsAnalizando(true);
      try {
        const info = await analizarTransaccionIA(transcript);
        const montoFinal = parseInt(String(info.monto).replace(/[^0-9]/g, ''));
        await agregarTransaccion({
          tipo: info.tipo,
          descripcion: info.descripcion,
          categoria: info.categoria || 'Otros',
          monto: montoFinal,
          fecha: new Date().toISOString().split('T')[0],
          notas: `Voz: ${transcript}`
        });
        await refetchTx();
      } catch (err) { console.error(err); } finally { setIsAnalizando(false); setIsEscuchando(false); }
    };
    recognition.start();
  }

  const navegarMes = (dir: 'atras' | 'adelante') => 
    setFechaFiltro(prev => dir === 'atras' ? subMonths(prev, 1) : addMonths(prev, 1))

  const flujoCajaGlobal = useMemo(() => {
    const ing = (txs || []).filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
    const gas = (txs || []).filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0)
    return ing - gas
  }, [txs])

  const resumenMes = useMemo(() => {
    const start = startOfMonth(fechaFiltro); const end = endOfMonth(fechaFiltro)
    const txMes = (txs || []).filter(tx => isWithinInterval(parseISO(tx.fecha), { start, end }))
    const ing = txMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
    const gas = txMes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0)
    return { ingresos: ing, gastos: gas }
  }, [txs, fechaFiltro])

  const flujo6m = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const mes = subMonths(fechaFiltro, 5 - i); const start = startOfMonth(mes); const end = endOfMonth(mes)
      const txMes = (txs || []).filter(tx => isWithinInterval(parseISO(tx.fecha), { start, end }))
      return { label: format(mes, 'MMM', { locale: es }), ingresos: txMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0), gastos: txMes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0) }
    })
  }, [txs, fechaFiltro])

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white pb-32">
      {isEscuchando && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <button onClick={() => setIsEscuchando(false)} className="absolute top-10 right-6 text-white/30"><X size={32} /></button>
          {isAnalizando ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={64} className="animate-spin text-emerald-500" />
              <p className="text-emerald-500 font-black uppercase text-[10px]">Analizando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="p-10 rounded-full bg-emerald-500/10 border-2 border-emerald-500">
                <Mic size={56} className="text-emerald-500" />
              </div>
              <h2 className="text-5xl font-black uppercase italic text-center">TE <br/> ESCUCHO</h2>
              <p className="text-gray-400 italic">"{comandoVoz || '¿Qué gastaste hoy?'}"</p>
            </div>
          )}
        </div>
      )}

      <div className="p-6 max-w-xl mx-auto">
        <header className="flex justify-between items-start mb-8 pt-4">
          <div>
            <p className="text-emerald-500 text-[9px] font-black tracking-widest uppercase mb-1">Vault Status</p>
            <h1 className="text-4xl font-black italic uppercase leading-[0.85]">Buenas, <br/> {perfil?.nombre?.split(' ')[0] ?? 'Julian'} ⚡️</h1>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1b23] p-2 rounded-xl border border-white/5">
            <button onClick={() => navegarMes('atras')} className="text-gray-400"><ChevronLeft size={18}/></button>
            <span className="text-[10px] font-bold uppercase">{format(fechaFiltro, "MMM yy", { locale: es })}</span>
            <button onClick={() => navegarMes('adelante')} className="text-gray-400"><ChevronRight size={18}/></button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <KpiCard label="Flujo de caja total" value={fmt(flujoCajaGlobal, true)} accent="#00d4aa" />
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Ingresos" value={fmt(resumenMes.ingresos, true)} accent="#4a9eff" />
            <KpiCard label="Gastos" value={fmt(resumenMes.gastos, true)} accent="#ff4d6a" />
          </div>
        </div>

        <div className="space-y-6">
          <Panel title="Tendencia">
            <div className="h-[200px]">
              <Bar 
                data={{ 
                  labels: flujo6m.map(m => m.label), 
                  datasets: [
                    { label: 'In', data: flujo6m.map(m => m.ingresos), backgroundColor: '#00d4aa', borderRadius: 4 }, 
                    { label: 'Out', data: flujo6m.map(m => m.gastos), backgroundColor: '#ff4d6a', borderRadius: 4 }
                  ] 
                }} 
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
              />
            </div>
          </Panel>
          <Panel title="Movimientos">
             <div className="divide-y divide-white/5">
                {(txs || []).slice(0, 5).map(tx => (
                  <div key={tx.id} className="py-3 flex justify-between items-center text-sm">
                    <span className="font-bold">{tx.descripcion}</span>
                    <span className={`font-black italic ${tx.tipo === 'ingreso' ? 'text-emerald-500' : 'text-white'}`}>
                      {tx.tipo === 'ingreso' ? '+' : '-'} {fmt(tx.monto, true)}
                    </span>
                  </div>
                ))}
             </div>
          </Panel>
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6">
        <button onClick={() => setShowForm(true)} className="p-5 rounded-2xl bg-[#1a1b23] border border-white/10"><Plus size={24} /></button>
        <button onClick={iniciarAsistenteVoz} className="p-8 rounded-full bg-[#1a1b23] border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]"><Mic size={36} className="text-emerald-500" /></button>
      </div>

      {showForm && <FormTransaccion onClose={() => setShowForm(false)} onSuccess={refetchTx} />}
    </div>
  )
}