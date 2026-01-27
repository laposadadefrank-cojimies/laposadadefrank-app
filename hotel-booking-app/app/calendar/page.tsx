'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function CalendarPage() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarHabitaciones()
  }, [])

  async function cargarHabitaciones() {
    setCargando(true)
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .order('nombre', { ascending: true }) // <--- ESTO ORDENA H01, H02, S04...

    if (!error && data) setHabitaciones(data)
    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      <nav className="bg-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">
          ← VOLVER
        </Link>
        <h1 className="font-black uppercase italic text-gray-800 text-sm tracking-tighter">Calendario Maestro</h1>
        <div className="w-16"></div>
      </nav>

      <div className="p-4 max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-black text-gray-800 uppercase italic leading-none">
              Listado <br/><span className="text-blue-600 text-xs not-italic tracking-widest font-bold">POR NOMBRE (A-Z)</span>
            </h2>
            <div className="text-right">
              <span className="block text-[10px] font-black text-gray-400 uppercase">Total</span>
              <span className="text-2xl font-black text-blue-600 italic">{habitaciones.length}</span>
            </div>
          </div>

          {cargando ? (
            <div className="py-20 text-center animate-pulse">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sincronizando habitaciones...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {habitaciones.map((hab) => (
                <div key={hab.id} className="bg-gray-50 p-4 rounded-3xl flex items-center gap-4 hover:shadow-lg transition-all border border-gray-200/50">
                  <div className="w-16 h-16 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-200 shrink-0 text-xl">
                    {hab.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-800 uppercase text-lg leading-none">{hab.nombre}</h3>
                    <p className="text-green-600 font-bold text-xs mt-1">${hab.precio_persona_noche} p/n</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase">
                    Libre
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}