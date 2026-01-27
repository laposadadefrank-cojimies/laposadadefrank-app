'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function CalendarioPMS() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [nuevaReserva, setNuevaReserva] = useState({
    huesped: '',
    habId: '',
    habNombre: '',
    entrada: '',
    salida: ''
  })

  // Generamos los días del mes actual (30 días)
  const dias = Array.from({ length: 30 }, (_, i) => i + 1)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: habs } = await supabase.from('habitaciones').select('*')
    const { data: resv } = await supabase.from('reservas').select('*')
    if (habs) setHabitaciones(habs)
    if (resv) setReservas(resv)
  }

  const handleCeldaClick = (dia: number, hab: any) => {
    const fecha = `2024-05-${dia.toString().padStart(2, '0')}` // Ajustar año/mes según necesites
    setNuevaReserva({
      ...nuevaReserva,
      habId: hab.id,
      habNombre: hab.nombre,
      entrada: fecha,
      salida: fecha
    })
    setModalOpen(true)
  }

  const confirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('reservas').insert([{
      huesped_nombre: nuevaReserva.huesped,
      habitacion_id: nuevaReserva.habId,
      fecha_entrada: nuevaReserva.entrada,
      fecha_salida: nuevaReserva.salida
    }])

    if (!error) {
      setModalOpen(false)
      cargarDatos()
    } else {
      alert("Error: " + error.message)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* HEADER */}
      <header className="bg-black text-white p-4 flex justify-between items-center z-30 shadow-lg">
        <Link href="/dashboard" className="text-xs bg-gray-800 px-3 py-2 rounded-lg font-bold">VOLVER</Link>
        <h1 className="text-sm font-black uppercase tracking-widest">Calendario de Ocupación</h1>
        <div className="w-10"></div>
      </header>

      {/* TABLA TIPO TIMELINE (GANTT) */}
      <div className="flex-1 overflow-auto relative">
        <table className="border-collapse table-fixed min-w-max bg-white">
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-100 shadow-sm">
              <th className="sticky left-0 z-30 bg-gray-100 border-b border-r w-28 p-4 text-[10px] font-black uppercase text-gray-500">
                Habitación
              </th>
              {dias.map(d => (
                <th key={d} className="border-b border-r w-12 p-2 text-[10px] font-bold text-center">
                  {d} <br/> <span className="text-gray-400">MAY</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map(hab => (
              <tr key={hab.id} className="h-16">
                <td className="sticky left-0 z-10 bg-white border-b border-r p-3 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <p className="font-bold text-xs truncate">{hab.nombre}</p>
                  <p className="text-[9px] text-green-600 font-bold">${hab.precio_persona_noche}/p</p>
                </td>
                {dias.map(d => {
                  const fechaActual = `2024-05-${d.toString().padStart(2, '0')}`
                  const ocupa = reservas.find(r => 
                    r.habitacion_id === hab.id && 
                    fechaActual >= r.fecha_entrada && 
                    fechaActual < r.fecha_salida
                  )

                  return (
                    <td 
                      key={d} 
                      onClick={() => handleCeldaClick(d, hab)}
                      className={`border-b border-r relative cursor-pointer active:bg-gray-200 transition-colors ${ocupa ? 'p-0' : ''}`}
                    >
                      {ocupa && (
                        <div className="absolute inset-y-1 left-0 right-0 bg-blue-600 rounded-sm flex items-center justify-center shadow-inner">
                          <span className="text-[8px] text-white font-black uppercase truncate px-1">
                            {ocupa.huesped_nombre}
                          </span>
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

      {/* MODAL PARA MÓVIL (DESLIZA DESDE ABAJO) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-black mb-1 uppercase italic text-blue-900">Nueva Reserva</h2>
            <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{nuevaReserva.habNombre}</p>
            
            <form onSubmit={confirmarReserva} className="space-y-4">
              <input 
                type="text" 
                placeholder="NOMBRE DEL HUÉSPED" 
                className="w-full p-4 bg-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-black"
                onChange={e => setNuevaReserva({...nuevaReserva, huesped: e.target.value})}
                required 
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 ml-2">ENTRADA</label>
                  <input type="date" value={nuevaReserva.entrada} className="w-full p-4 bg-gray-100 rounded-2xl text-xs font-bold" onChange={e => setNuevaReserva({...nuevaReserva, entrada: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 ml-2">SALIDA</label>
                  <input type="date" value={nuevaReserva.salida} className="w-full p-4 bg-gray-100 rounded-2xl text-xs font-bold" onChange={e => setNuevaReserva({...nuevaReserva, salida: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}