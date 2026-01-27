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
    // Ordenamos por el campo 'nombre' de forma ascendente
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .order('nombre', { ascending: true }) 

    if (error) {
      console.error('Error cargando datos:', error)
    } else {
      setHabitaciones(data || [])
    }
    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Barra superior de navegación */}
      <nav className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="text-blue-600 font-black text-[10px] uppercase italic border-b-2 border-blue-600">
          ← VOLVER AL PANEL
        </Link>
        <h1 className="font-black text-gray-800 uppercase italic text-sm">Calendario de Disponibilidad</h1>
        <div className="w-20"></div>
      </nav>

      <div className="p-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 border border-gray-100">
          
          <div className="mb-8 flex justify-between items-end border-b-2 border-gray-50 pb-4">
            <div>
              <h2 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter">
                Habitaciones <span className="text-blue-600">Activas</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Orden Alfanumérico Ascendente</p>
            </div>
            <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl font-black italic text-xl">
              {habitaciones.length}
            </div>
          </div>

          {cargando ? (
            <div className="py-20 text-center">
              <div className="animate-spin text-5xl mb-4 inline-block">⏳</div>
              <p className="font-black text-gray-300 uppercase text-xs tracking-widest">Sincronizando con Supabase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {habitaciones.map((hab) => (
                <div key={hab.id} className="group bg-gray-50 p-5 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all shadow-sm hover:shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                      {hab.nombre.substring(0, 3)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-gray-800 uppercase text-lg leading-none mb-1">{hab.nombre}</h3>
                      <p className="text-green-600 font-black text-sm">${hab.precio_persona_noche} <span className="text-[10px] text-gray-400 font-bold">/ NOCHE</span></p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Capacidad: {hab.capacidad} pers.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-50 px-3 py-1 rounded-full">Disponible</span>
                    <button className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-600 transition-colors">Ver Detalles →</button>
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