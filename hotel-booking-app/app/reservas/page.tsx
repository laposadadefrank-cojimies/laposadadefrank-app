'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function CalendarioGanttPro() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [infoTooltip, setInfoTooltip] = useState<{ nombre: string, fechas: string, visible: boolean, x: number, y: number }>({
    nombre: '', fechas: '', visible: false, x: 0, y: 0
  })
  
  const [nuevaReserva, setNuevaReserva] = useState({
    huesped: '', habId: '', habNombre: '', habCapacidad: 0,
    entrada: '', salida: '', numPersonas: 1
  })

  const dias = Array.from({ length: 31 }, (_, i) => i + 1)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const { data: habs } = await supabase.from('habitaciones').select('*')
    const { data: resv } = await supabase.from('reservas').select('*')
    if (habs) setHabitaciones(habs)
    if (resv) setReservas(resv)
  }

  // Genera un color fijo basado en el nombre del cliente
  const getHuespedColor = (nombre: string) => {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 45%)`;
  };

  const handleCeldaClick = (dia: number, hab: any) => {
    const fecha = `2026-02-${dia.toString().padStart(2, '0')}`
    setNuevaReserva({
      ...nuevaReserva,
      habId: hab.id, habNombre: hab.nombre, habCapacidad: hab.capacidad,
      entrada: fecha, salida: fecha, numPersonas: 1
    })
    setModalOpen(true)
  }

  const mostrarDetalle = (e: any, reserva: any) => {
    setInfoTooltip({
      nombre: reserva.huesped_nombre,
      fechas: `${reserva.fecha_entrada} al ${reserva.fecha_salida}`,
      visible: true,
      x: e.clientX,
      y: e.clientY
    })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans select-none" onClick={() => setInfoTooltip({...infoTooltip, visible: false})}>
      <header className="bg-black text-white p-4 flex justify-between items-center z-40 shadow-xl">
        <Link href="/dashboard" className="text-[10px] bg-white/10 px-3 py-2 rounded-lg font-black tracking-widest">VOLVER</Link>
        <h1 className="text-xs font-black uppercase tracking-[0.2em] flex-1 text-center">Calendario de Ocupación</h1>
      </header>

      {/* TOOLTIP FLOTANTE */}
      {infoTooltip.visible && (
        <div 
          className="fixed z-50 bg-black text-white p-3 rounded-xl shadow-2xl text-[10px] pointer-events-none border border-white/20 animate-in fade-in zoom-in duration-200"
          style={{ left: infoTooltip.x + 10, top: infoTooltip.y - 40 }}
        >
          <p className="font-black uppercase">{infoTooltip.nombre}</p>
          <p className="text-gray-400 font-bold">{infoTooltip.fechas}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto relative scrollbar-hide">
        <table className="border-collapse table-fixed min-w-max bg-white">
          <thead className="sticky top-0 z-30">
            <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-500">
              <th className="sticky left-0 z-40 bg-gray-100 border-b border-r w-28 p-4 shadow-[5px_0_10px_rgba(0,0,0,0.05)]">Habitación</th>
              {dias.map(d => (
                <th key={d} className="border-b border-r w-14 p-2 text-center">{d}<br/>FEB</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map(hab => (
              <tr key={hab.id} className="h-14">
                <td className="sticky left-0 z-20 bg-white border-b border-r p-3 shadow-[5px_0_10px_rgba(0,0,0,0.05)]">
                  <p className="font-black text-[10px] truncate uppercase text-black">{hab.nombre}</p>
                  <p className="text-[8px] text-blue-500 font-black tracking-tighter">CAP: {hab.capacidad} PERS</p>
                </td>
                {dias.map(d => {
                  const fechaActual = `2026-02-${d.toString().padStart(2, '0')}`
                  const reservaSalida = reservas.find(r => r.habitacion_id === hab.id && r.fecha_salida === fechaActual)
                  const reservaEntrada = reservas.find(r => r.habitacion_id === hab.id && r.fecha_entrada === fechaActual)
                  const reservaEnMedio = reservas.find(r => r.habitacion_id === hab.id && fechaActual > r.fecha_entrada && fechaActual < r.fecha_salida)

                  let bgStyle = {};
                  if (reservaSalida && reservaEntrada) {
                    bgStyle = { background: `linear-gradient(to bottom right, ${getHuespedColor(reservaSalida.huesped_nombre)} 49%, white 49% 51%, ${getHuespedColor(reservaEntrada.huesped_nombre)} 51%)` };
                  } else if (reservaSalida) {
                    bgStyle = { background: `linear-gradient(to bottom right, ${getHuespedColor(reservaSalida.huesped_nombre)} 49.5%, #f9fafb 50.5%)` };
                  } else if (reservaEntrada) {
                    bgStyle = { background: `linear-gradient(to bottom right, #f9fafb 49.5%, ${getHuespedColor(reservaEntrada.huesped_nombre)} 50.5%)` };
                  } else if (reservaEnMedio) {
                    bgStyle = { backgroundColor: getHuespedColor(reservaEnMedio.huesped_nombre) };
                  }

                  return (
                    <td 
                      key={d} 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (reservaEnMedio || reservaSalida || reservaEntrada) {
                          mostrarDetalle(e, reservaEnMedio || reservaSalida || reservaEntrada);
                        } else {
                          handleCeldaClick(d, hab);
                        }
                      }}
                      style={bgStyle}
                      className="border-b border-r relative cursor-pointer active:scale-95 transition-transform overflow-hidden"
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE RESERVA - SE QUEDA IGUAL AL QUE TENÍAMOS */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
             <h2 className="text-xl font-black mb-1 uppercase text-black">Nueva Reserva</h2>
             {/* ... (resto del formulario que ya tenias) ... */}
          </div>
        </div>
      )}
    </div>
  )
}