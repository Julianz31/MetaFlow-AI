export type TipoTransaccion = 'ingreso' | 'gasto'
export type TipoInversion = 'etf' | 'accion' | 'crypto' | 'renta_fija' | 'inmueble' | 'otro'
export type TipoDeuda = 'tarjeta' | 'credito_hipotecario' | 'credito_vehiculo' | 'personal' | 'otro'

export interface Transaccion {
  id: string
  user_id: string
  tipo: TipoTransaccion
  categoria: string
  descripcion: string
  monto: number
  fecha: string
  notas?: string
  created_at: string
}

export interface Presupuesto {
  id: string
  user_id: string
  categoria: string
  limite: number
  mes: number
  anio: number
}

export interface Inversion {
  id: string
  user_id: string
  nombre: string
  ticker?: string
  tipo: TipoInversion
  valor_actual: number
  costo_base: number
  fecha_inicio: string
  notas?: string
}

export interface Deuda {
  id: string
  user_id: string
  nombre: string
  entidad?: string
  tipo: TipoDeuda
  saldo_inicial: number
  saldo_actual: number
  tasa_ea: number
  cuota_mensual: number
  fecha_inicio: string
}

export interface Meta {
  id: string
  user_id: string
  nombre: string
  emoji: string
  monto_meta: number
  monto_actual: number
  fecha_meta?: string
  ahorro_mensual?: number
}

export interface Perfil {
  id: string
  nombre?: string
  gastos_mensual: number
}

// ── Derived / computed ──────────────────────────────────────────────────────

export interface ResumenMes {
  ingresos: number
  gastos: number
  ahorro: number
  tasa_ahorro: number
}

export interface IFI {
  renta_pasiva: number
  gastos_mensuales: number
  ratio: number           // 0-100
  capital_requerido: number
  capital_actual: number
  anios_para_libertad: number
}

// ── Simulator ───────────────────────────────────────────────────────────────

export interface SimuladorParams {
  ahorro_mensual: number
  tasa_retorno_anual: number  // %
  anios: number
  capital_inicial: number
  inflacion_anual: number     // %
}

export interface SimuladorResultado {
  anio: number
  capital: number
  aporte_acumulado: number
  ganancia: number
  ifi: number
}

export const CATEGORIAS_GASTO = [
  'Vivienda', 'Alimentación', 'Transporte', 'Salud',
  'Educación', 'Ocio', 'Suscripciones', 'Ropa',
  'Tecnología', 'Viajes', 'Deudas', 'Otro'
]

export const CATEGORIAS_INGRESO = [
  'Salario', 'Freelance', 'Dividendos', 'Arriendo',
  'Bonus', 'Venta activo', 'Otro ingreso'
]

export const TIPO_INVERSION_LABEL: Record<TipoInversion, string> = {
  etf: 'ETF / Fondo',
  accion: 'Acción',
  crypto: 'Cripto',
  renta_fija: 'Renta Fija / CDT',
  inmueble: 'Inmueble',
  otro: 'Otro'
}
