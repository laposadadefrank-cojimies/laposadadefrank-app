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
    // El secreto del orden H01, H02, S04... está en esta línea:
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .order('nombre', { ascending: true }) 

    if (!error && data) setHabitaciones(data)
    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">
          ← VOLVER AL PANEL
        </Link>
        <h1 className="font-black uppercase italic text-gray-800 text-sm tracking-tighter">Calendario Maestro</h1>
        <div className="w-20"></div>
      </nav>

      <div className="p-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-8 border-b-2 border-gray-50 pb-4">
            <h2 className="text-2xl font-black text-gray-800 uppercase italic">
              Habitaciones <span className="text-blue-600">Ordenadas</span>
            </h2>
            <span className="bg-gray-100 px-4 py-2 rounded-2xl font-black text-gray-500 text-xs">
              {habitaciones.length} TOTAL
            </span>
          </div>

          {cargando ? (
            <div className="py-20 text-center animate-pulse">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sincronizando con Supabase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {habitaciones.map((hab) => (
                <div key={hab.id} className="bg-gray-50 p-5 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all shadow-sm hover:shadow-xl group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl shadow-lg group-hover:rotate-6 transition-transform">
                      {hab.nombre.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 uppercase text-lg leading-none">{hab.nombre}</h3>
                      <p className="text-green-600 font-bold text-sm mt-1">${hab.precio_persona_noche}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[9px] font-black text-blue-500 uppercase">Estado</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter">Disponible</span>
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