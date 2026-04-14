'use client'
import { useState } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
// Usamos @/ para que no importe dónde muevas el archivo, siempre encuentre la ruta
import { useCategorias, agregarCategoria, eliminarCategoria } from '@/hooks/useData'
import { Panel, Btn, FormField, EmptyState } from '@/components/ui'

export default function CategoriesPage() {
  const { data: categorias, loading, refetch } = useCategorias()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'gasto' | 'ingreso'>('gasto')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre) return
    setIsSubmitting(true)
    
    // Añadimos una validación de tipo simple aquí
    const res: any = await agregarCategoria({ nombre, tipo })
    const { data, error } = res
    
    if (error) {
      console.error("Error al crear:", error.message)
      alert("Error: " + error.message) 
    } else {
      setNombre('')
      refetch() 
    }
    setIsSubmitting(false)
  }
  async function handleDelete(id: string) {
    if (confirm('¿Seguro que quieres borrar esta categoría?')) {
      await eliminarCategoria(id)
      refetch()
    }
  }

  return (
    <div style={{ padding: 28 }}> {/* Quitamos el Sidebar de aquí porque ya está en el Layout */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Gestionar Categorías</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>Personaliza tus fuentes de ingreso y tipos de gasto</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
        {/* Formulario para Crear */}
        <Panel title="Nueva Categoría">
          <form onSubmit={handleAdd}>
            <FormField label="Nombre de categoría">
              <input 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                placeholder="Ej: Suscripciones, Mascotas..." 
              />
            </FormField>
            <FormField label="Tipo">
              <select value={tipo} onChange={e => setTipo(e.target.value as any)}>
                <option value="gasto">Egreso</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </FormField>
            <Btn type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: 10 }}>
              <Plus size={16} style={{ marginRight: 8 }} />
              {isSubmitting ? 'Guardando...' : 'Crear Categoría'}
            </Btn>
          </form>
        </Panel>

        {/* Lista de Categorías */}
        <Panel title="Tus Categorías actuales">
          {loading ? (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Cargando...</div>
          ) : categorias.length === 0 ? (
            <EmptyState icon="🏷️" text="No tienes categorías aún" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categorias.map(cat => (
                <div key={cat.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg3)',
                  borderRadius: 8,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      padding: 6, 
                      borderRadius: 6, 
                      background: cat.tipo === 'ingreso' ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,106,0.1)',
                      color: cat.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)'
                    }}>
                      <Tag size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{cat.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>{cat.tipo}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 6 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}