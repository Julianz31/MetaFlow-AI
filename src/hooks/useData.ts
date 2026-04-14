'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Transaccion, Presupuesto, Inversion, Deuda, Meta, Perfil } from '@/types'

// --- CONFIGURACIÓN DE BYPASS ---
const MI_USER_ID_REAL = '85cc72e8-692f-4a8b-ae68-6333039e6147'; 

function useSupabaseTable<T>(table: string, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const sb = createClient()
    const { data: rows, error: err } = await sb
      .from(table)
      .select('*')
      .eq('user_id', MI_USER_ID_REAL) 
      .order('created_at', { ascending: false })
      
    if (err) setError(err.message)
    else setData((rows ?? []) as T[])
    setLoading(false)
  }, [table])

  useEffect(() => { refetch() }, [refetch, ...deps])
  return { data, loading, error, refetch, mutate: refetch }
}

// --- Hooks de Lectura ---
export function useTransacciones() { return useSupabaseTable<Transaccion>('transacciones') }
export function useInversiones() { return useSupabaseTable<Inversion>('inversiones') }
export function useDeudas() { return useSupabaseTable<Deuda>('deudas') }
export function useMetas() { return useSupabaseTable<Meta>('metas') }
export function useCategorias() { return useSupabaseTable<any>('categorias') }
export function usePresupuestos(mes: number, anio: number) {
  return useSupabaseTable<Presupuesto>('presupuestos', [mes, anio])
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const refetch = useCallback(async () => {
    setLoading(true)
    const sb = createClient()
    const { data } = await sb.from('perfiles').select('*').eq('id', MI_USER_ID_REAL).single()
    setPerfil(data)
    setLoading(false)
  }, [])
  useEffect(() => { refetch() }, [refetch])
  return { perfil, loading, refetch }
}

// --- Mutations (ESCRITURA) ---

export async function agregarTransaccion(tx: Omit<Transaccion, 'id' | 'user_id' | 'created_at'>) {
  return createClient().from('transacciones').insert({ ...tx, user_id: MI_USER_ID_REAL })
}

export async function eliminarTransaccion(id: string) {
  return createClient().from('transacciones').delete().eq('id', id).eq('user_id', MI_USER_ID_REAL)
}

export async function agregarCategoria(cat: any) {
  return createClient().from('categorias').insert({ ...cat, user_id: MI_USER_ID_REAL })
}

export async function eliminarCategoria(id: string) {
  return createClient().from('categorias').delete().eq('id', id).eq('user_id', MI_USER_ID_REAL)
}

export async function agregarInversion(data: any) {
  return createClient().from('inversiones').insert({ ...data, user_id: MI_USER_ID_REAL })
}

export async function actualizarInversion(id: string, data: any) {
  return createClient().from('inversiones').update(data).eq('id', id).eq('user_id', MI_USER_ID_REAL)
}

export async function eliminarInversion(id: string) {
  return createClient().from('inversiones').delete().eq('id', id).eq('user_id', MI_USER_ID_REAL)
}

export async function agregarMeta(data: any) {
  return createClient().from('metas').insert({ ...data, user_id: MI_USER_ID_REAL })
}

export async function actualizarMeta(id: string, data: any) {
  return createClient().from('metas').update(data).eq('id', id).eq('user_id', MI_USER_ID_REAL)
}

export async function eliminarMeta(id: string) {
  return createClient().from('metas').delete().eq('id', id).eq('user_id', MI_USER_ID_REAL)
}

export async function agregarDeuda(data: any) {
  return createClient().from('deudas').insert({ ...data, user_id: MI_USER_ID_REAL })
}

export async function actualizarDeuda(id: string, data: any) {
  return createClient().from('deudas').update(data).eq('id', id).eq('user_id', MI_USER_ID_REAL)
}

export async function upsertPresupuesto(p: any) {
  return createClient().from('presupuestos').upsert({ ...p, user_id: MI_USER_ID_REAL })
}