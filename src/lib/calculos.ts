import type { SimuladorParams, SimuladorResultado, IFI, Inversion } from '@/types'

/** Formatea número como moneda COP/USD */
export function fmt(v: number, c = false) {
  return new Intl.NumberFormat('es-CO', {
    style: c ? 'currency' : 'decimal',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}
/** Porcentaje con 1 decimal */
export function pct(n: number): string {
  return n.toFixed(1) + '%'
}

/** Calcula IFI basado en regla del 4% (SWR) */
export function calcIFI(inversiones: Inversion[], gastos_mensual: number): IFI {
  const capital_actual = inversiones.reduce((s, i) => s + i.valor_actual, 0)
  // Renta pasiva = capital * 4% / 12
  const renta_pasiva = capital_actual * 0.04 / 12
  const ratio = gastos_mensual > 0 ? Math.min((renta_pasiva / gastos_mensual) * 100, 100) : 0
  const capital_requerido = gastos_mensual * 12 / 0.04
  // Estimación simple de años (7% retorno anual)
  const anios_para_libertad = capital_requerido > capital_actual
    ? Math.log(capital_requerido / Math.max(capital_actual, 1)) / Math.log(1.07)
    : 0
  return { renta_pasiva, gastos_mensuales: gastos_mensual, ratio, capital_requerido, capital_actual, anios_para_libertad }
}

/** Simulador de crecimiento patrimonial compuesto */
export function simularPatrimonio(p: SimuladorParams): SimuladorResultado[] {
  const results: SimuladorResultado[] = []
  let capital = p.capital_inicial
  const tasa_mensual = Math.pow(1 + p.tasa_retorno_anual / 100, 1 / 12) - 1
  const gastos_base = 3000 // estimado fijo para IFI en simulador

  for (let anio = 0; anio <= p.anios; anio++) {
    const aporte_acumulado = p.capital_inicial + p.ahorro_mensual * 12 * anio
    const ganancia = capital - aporte_acumulado
    const renta_pasiva = capital * 0.04 / 12
    const ifi = Math.min((renta_pasiva / gastos_base) * 100, 100)
    results.push({ anio: new Date().getFullYear() + anio, capital: Math.round(capital), aporte_acumulado: Math.round(aporte_acumulado), ganancia: Math.round(ganancia), ifi: Math.round(ifi) })
    // Proyectar siguiente año
    for (let m = 0; m < 12; m++) {
      capital = capital * (1 + tasa_mensual) + p.ahorro_mensual
    }
    // Ajuste inflación en aportes
    capital = capital / (1 + p.inflacion_anual / 100)
  }
  return results
}

/** Estrategia avalancha de deudas */
export function proyectarAvalanche(
  deudas: { saldo: number; tasa: number; cuota: number }[],
  extra_mensual = 0
): { mes: number; total: number }[] {
  let saldos = deudas.map(d => d.saldo)
  const tasas = deudas.map(d => d.tasa / 100 / 12)
  const cuotas = deudas.map(d => d.cuota)
  const resultado: { mes: number; total: number }[] = []
  let mes = 0

  while (saldos.some(s => s > 0) && mes < 360) {
    let extra = extra_mensual
    // Pagar intereses primero (mayor tasa primero = avalancha)
    const idx_mayor = saldos
      .map((s, i) => ({ s, t: tasas[i], i }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.t - a.t)[0]?.i ?? -1

    saldos = saldos.map((s, i) => {
      if (s <= 0) return 0
      const interes = s * tasas[i]
      let pago = cuotas[i]
      if (i === idx_mayor) pago += extra
      return Math.max(0, s + interes - pago)
    })
    mes++
    resultado.push({ mes, total: Math.round(saldos.reduce((a, b) => a + b, 0)) })
  }
  return resultado
}

/** Porcentaje de progreso de meta */
export function progresoPct(actual: number, meta: number): number {
  return Math.min(Math.round((actual / meta) * 100), 100)
}

/** Clase de color según porcentaje de presupuesto usado */
export function colorPresupuesto(usado_pct: number): string {
  if (usado_pct >= 100) return '#ff4d6a'
  if (usado_pct >= 80) return '#f5a623'
  return '#00d4aa'
}
