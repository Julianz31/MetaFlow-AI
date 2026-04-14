'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, X } from 'lucide-react'

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  // No mostramos menú en login o landing
  const isAuthPage = pathname === '/login' || pathname === '/'

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  if (isAuthPage) return <>{children}</>

  return (
    <>
      {/* BOTÓN MÓVIL */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-5 left-5 z-[50] p-3 bg-[#1a1c23]/80 backdrop-blur-md border border-white/10 rounded-xl"
      >
        <Menu className="w-6 h-6 text-emerald-400" />
      </button>

      {/* SIDEBAR MÓVIL */}
      {isOpen && (
        <div className="fixed inset-0 z-[600] md:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-[280px] h-full bg-[#0f1115] shadow-2xl flex flex-col transition-all">
            <div className="p-5 flex justify-between items-center border-b border-white/5">
              <span className="font-bold text-emerald-400 text-xl tracking-tighter">VAULT.</span>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-[#1a1c23] rounded-lg">
                <X size={20} className="text-emerald-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
               <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR PC */}
      <div className="hidden md:block w-[240px] h-screen sticky top-0 flex-shrink-0 bg-[#0f1115] border-r border-white/5">
        <Sidebar />
      </div>

      <main className="flex-1 min-w-0 min-h-screen relative">
        <div className="p-6 md:p-10 pt-24 md:pt-10">
          {children}
        </div>
      </main>
    </>
  )
}