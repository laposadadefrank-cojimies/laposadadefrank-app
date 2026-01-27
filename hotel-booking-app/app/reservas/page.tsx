'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ReservasPage() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [fechaBase, setFechaBase] = useState(new Date())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Generamos 30 días para la cuadrícula
  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(fechaBase)
    d.setDate(d.getDate() + i)
    return d
  })

  useEffect(() => {
    cargarDatos()
  }, [fechaBase])

  async function cargarDatos() {
    setCargando(true)
    try {
      // 1. Traer habitaciones ordenadas H01, H02, S04...
      const { data: habs } = await supabase
        .from('habitaciones')
        .select('*')
        .order('nombre', { ascending: true })

      // 2. Traer las reservas existentes
      const { data: reser } = await supabase
        .from('reservas')
        .select('*')

      if (habs) setHabitaciones(habs)
      if (reser) setReservas(reser)
    } catch (error) {
      console.error("Error cargando datos:", error)
    }
    setCargando(false)
  }

  const handleCrearReserva = async (habId: string, dia: Date) => {
    const nombre = prompt("Escribe el nombre del cliente para esta reserva:")
    if (!nombre) return

    // Formatear fecha para la base de datos (YYYY-MM-DD)
    const fechaStr = dia.toISOString().split('T')[0]

    // Generar un color aleatorio brillante
    const colorAzar = `hsl(${Math.random() * 360}, 70%, 50%)`

    const { error } = await supabase
      .from('reservas')
      .insert([
        { 
          habitacion_id: habId, 
          nombre_cliente: nombre.toUpperCase(), 
          fecha_inicio: fechaStr, 
          fecha_fin: fechaStr,
          color: colorAzar
        }
      ])

    if (error) {
      alert("Error al guardar la reserva: " + error.message)
    } else {
      cargarDatos() // Recargar para mostrar la nueva reserva
    }
  }

  // Función para buscar si una habitación tiene reserva en un día específico
  const buscarReserva = (habId: string, dia: Date) => {
    const fechaStr = dia.toISOString().split('T')[0]
    return reservas.find(r => r.habitacion_id === habId && r.fecha_inicio === fechaStr)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
        <Link href="/dashboard" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic border border-gray-700 transition-all">
          ← VOLVER
        </Link>
        <div className="text-center">
          <h1 className="font-black text-xs uppercase italic tracking-tighter">Calendario de Ocupación</h1>
          <p className="text-[7px] text-blue-400 font-bold uppercase tracking-[0.3em]">La Posada de Frank</p>
        </div>
        <input 
          type="date" 
          className="bg-gray-800 text-white text-[10px] p-2 rounded-lg font-bold border border-gray-700 outline-none focus:border-blue-500"
          onChange={(e) => setFechaBase(new Date(e.target.value))}
        />
      </nav>

      {cargando ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 italic font-black text-gray-400 text-xs">
          <div className="animate-spin mb-2">🌀</div>
          SINCRONIZANDO RESERVAS...
        </div>
      ) : (
        <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 shadow-sm">
                <th className="sticky left-0 z-40 bg-gray-100 border-r border-b p-4 w-[140px] min-w-[140px] text-[10px] font-black uppercase text-gray-600 italic">
                  Habitación
                </th>
                {dias.map((dia, i) => {
                  const esHoy = dia.toDateString() === new Date().toDateString()
                  return (
                    <th key={i} className={`border-r border-b p-2 w-[90px] min-w-[90px] text-center ${esHoy ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>
                      <span className="block text-[8px] uppercase font-black opacity-80">
                        {dia.toLocaleDateString('es', { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-black italic">{dia.getDate()}</span>
                      <span className="block text-[7px] uppercase font-bold opacity-60">
                        {dia.toLocaleDateString('es', { month: 'short' })}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {habitaciones.map((hab) => (
                <tr key={hab.id} className="group">
                  <td className="sticky left-0 z-30 bg-white border-r border-b p-4 font-black text-xs uppercase italic text-gray-800 shadow-md group-hover:bg-blue-50 transition-colors">
                    {hab.nombre}
                  </td>
                  {dias.map((dia, i) => {
                    const reserva = buscarReserva(hab.id, dia)
                    return (
                      <td 
                        key={i} 
                        onClick={() => !reserva && handleCrearReserva(hab.id, dia)}
                        className={`border-r border-b min-w-[90px] h-20 cursor-pointer relative transition-all ${!reserva ? 'hover:bg-blue-50' : ''}`}
                        style={{ backgroundColor: reserva ? reserva.color : '' }}
                      >
                        {reserva ? (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <span className="text-[9px] font-black text-white uppercase text-center leading-tight drop-shadow-md break-all">
                              {reserva.nombre_cliente}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                             <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg">+</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LEYENDA */}
      <footer className="bg-white border-t p-3 flex gap-6 justify-center items-center shadow-inner z-50">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase italic text-gray-600">
          <div className="w-4 h-4 bg-blue-600 rounded shadow-sm"></div> Hoy
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase italic text-gray-600">
          <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded shadow-sm"></div> Disponible
        </div>
        <div className="text-[9px] font-black uppercase italic text-gray-400">
          Haz clic en un cuadro vacío para reservar
        </div>
      </footer>
    </main>
  )
}