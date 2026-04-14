'use client'
import { useState, useMemo } from 'react'
import { Modal, Btn, FormField } from '@/components/ui'
import { agregarTransaccion, useCategorias, agregarCategoria } from '@/hooks/useData' 
import { Check, X, Sparkles, Loader2, Mic } from 'lucide-react'
import { analizarTransaccionIA } from '@/lib/gemini'

declare global {
  interface Window { 
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function FormTransaccion({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  
  const [magicInput, setMagicInput] = useState('')
  const [isAnalizando, setIsAnalizando] = useState(false)
  const [isEscuchando, setIsEscuchando] = useState(false)
  const [isCreandoCat, setIsCreandoCat] = useState(false)
  const [nuevoNombreCat, setNuevoNombreCat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: categoriasDB, loading: catLoading, mutate } = useCategorias()

  const categoriasFiltradas = useMemo(() => {
    return (categoriasDB || []).filter(c => c.tipo === tipo)
  }, [categoriasDB, tipo])

  const ejecutarGuardado = async (datosOverride?: any) => {
    setLoading(true)
    setError('')
    try {
      const valorMonto = datosOverride?.monto || monto;
      const { error: err } = await agregarTransaccion({ 
        tipo: datosOverride?.tipo || tipo, 
        descripcion: datosOverride?.descripcion || descripcion, 
        categoria: datosOverride?.categoria || categoria, 
        monto: parseFloat(valorMonto), 
        fecha: datosOverride?.fecha || fecha, 
        notas: datosOverride?.notas || 'Registro manual' 
      })
      if (err) throw err
      onSuccess(); 
      onClose();
      return true;
    } catch (err: any) {
      setError('Error: ' + err.message)
      setLoading(false)
      return false;
    }
  }

  const iniciarEscucha = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta voz. Usa Safari en iPhone o Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsEscuchando(true);
      setError('');
    };

    recognition.onend = () => setIsEscuchando(false);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript) return;

      setMagicInput(transcript);
      setIsAnalizando(true);

      try {
        const info = await analizarTransaccionIA(transcript);
        await ejecutarGuardado({
          tipo: info.tipo,
          descripcion: info.descripcion,
          categoria: info.categoria,
          monto: info.monto.toString(),
          notas: 'Voz ✨'
        });
      } catch (err) {
        setError("La IA no entendió. Ajusta los datos.");
        setIsAnalizando(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsEscuchando(false);
    };

    recognition.start();
  }

  return (
    <Modal title="Nueva transacción" onClose={onClose}>
      {/* ASISTENTE MÁGICO */}
      <div className="p-4 mb-6 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              className="w-full bg-[#1a1b23] border border-white/10 rounded-lg py-2 px-3 pr-10 text-sm text-white"
              placeholder={isEscuchando ? "Escuchando..." : "Habla para registrar..."}
              value={magicInput}
              onChange={e => setMagicInput(e.target.value)}
            />
            <button 
              type="button" 
              onClick={iniciarEscucha} 
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${isEscuchando ? 'bg-red-500 text-white' : 'text-emerald-500'}`}
            >
              <Mic size={18} className={isEscuchando ? 'animate-pulse' : ''} />
            </button>
          </div>
          {isAnalizando && <Loader2 size={20} className="animate-spin text-emerald-500 self-center" />}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ejecutarGuardado(); }}>
        {/* SELECTOR TIPO */}
        <div className="flex gap-2 mb-5">
          {(['gasto', 'ingreso'] as const).map(t => (
            <button 
              key={t} type="button" 
              onClick={() => { setTipo(t); setCategoria(''); }}
              className={`flex-1 py-3 rounded-xl font-semibold border transition-all ${tipo === t ? (t === 'gasto' ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-emerald-500 bg-emerald-500/10 text-emerald-500') : 'border-white/10 bg-[#1a1b23] text-gray-400'}`}
            >
              {t === 'gasto' ? 'Egreso' : 'Ingreso'}
            </button>
          ))}
        </div>

        <FormField label="Descripción *">
          <input 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)} 
            placeholder="Ej: Mercado" 
            className="w-full bg-[#1a1b23] border border-white/10 rounded-lg p-2 text-white" 
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Categoría *">
            {!isCreandoCat ? (
              <select 
                value={categoria} 
                onChange={e => e.target.value === "NEW" ? setIsCreandoCat(true) : setCategoria(e.target.value)} 
                className="w-full bg-[#1a1b23] border border-white/10 rounded-lg p-2 text-white"
              >
                <option value="">Seleccionar...</option>
                {categoriasFiltradas.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                <option value="NEW" className="text-emerald-500 font-bold">+ Nueva...</option>
              </select>
            ) : (
              <div className="flex gap-1">
                <input 
                  autoFocus 
                  value={nuevoNombreCat} 
                  onChange={e => setNuevoNombreCat(e.target.value)} 
                  className="flex-1 bg-[#1a1b23] border border-emerald-500 rounded-lg p-1 text-sm text-white" 
                />
                <button 
                  type="button" 
                  onClick={async () => {
                    if (!nuevoNombreCat) return;
                    setLoading(true);
                    await agregarCategoria({ nombre: nuevoNombreCat, tipo, color: tipo === 'gasto' ? '#ff4d6a' : '#00d4aa' });
                    await mutate(); 
                    setCategoria(nuevoNombreCat); 
                    setIsCreandoCat(false); 
                    setLoading(false);
                  }} 
                  className="bg-emerald-500 p-1 rounded text-white"
                >
                  <Check size={14}/>
                </button>
                <button type="button" onClick={() => setIsCreandoCat(false)} className="bg-white/10 p-1 rounded text-white">
                  <X size={14}/>
                </button>
              </div>
            )}
          </FormField>
          
          <FormField label="Monto *">
            <input 
              type="number" 
              value={monto} 
              onChange={e => setMonto(e.target.value)} 
              className="w-full bg-[#1a1b23] border border-white/10 rounded-lg p-2 text-white" 
            />
          </FormField>
        </div>

        <FormField label="Fecha">
          <input 
            type="date" 
            value={fecha} 
            onChange={e => setFecha(e.target.value)} 
            className="w-full bg-[#1a1b23] border border-white/10 rounded-lg p-2 text-white" 
          />
        </FormField>

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

        <div className="flex gap-2 justify-end mt-4">
          <Btn variant="ghost" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit" disabled={loading}>{loading ? '...' : 'Guardar manual'}</Btn>
        </div>
      </form>
    </Modal>
  )
}