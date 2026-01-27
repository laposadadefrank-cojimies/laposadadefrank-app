'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ReservasPage() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [fechaBase, setFechaBase] = useState(new Date())
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  
  const [nuevaReserva, setNuevaReserva] = useState({
    cliente_id: '', huesped_nombre: '', cliente_telefono: '', 
    cliente_ciudad: '', habitacion_id: '', fecha_entrada: '', 
    fecha_salida: '', num_personas: 1, precio_persona: 0, 
    anticipo: 0, forma_pago: 'Efectivo', observaciones: ''
  })

  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(fechaBase); d.setDate(d.getDate() + i); return d
  })

  useEffect(() => { cargarDatos() }, [fechaBase])

  async function cargarDatos() {
    setCargando(true)
    const { data: habs } = await supabase.from('habitaciones').select('*').order('nombre')
    const { data: reser } = await supabase.from('reservas').select('*')
    const { data: cls } = await supabase.from('clientes').select('*').order('nombre')
    setHabitaciones(habs || [])
    setReservas(reser || [])
    setClientes(cls || [])
    setCargando(false)
  }

  const obtenerEstiloCelda = (habId: string, fechaStr: string) => {
    const reservaAqui = reservas.filter(r => r.habitacion_id === habId && fechaStr >= r.fecha_entrada && fechaStr <= r.fecha_salida)
    
    if (reservaAqui.length === 0) return {}

    const saliendo = reservaAqui.find(r => r.fecha_salida === fechaStr)
    const entrando = reservaAqui.find(r => r.fecha_entrada === fechaStr)
    const ocupadoTotal = reservaAqui.find(r => fechaStr > r.fecha_entrada && fechaStr < r.fecha_salida)

    const colorSaliendo = saliendo?.color || '#3b82f6'
    const colorEntrando = entrando?.color || '#10b981'

    // LÓGICA DIAGONAL
    if (saliendo && entrando) {
      return { background: `linear-gradient(to overflow-wrap, ${colorSaliendo} 50%, ${colorEntrando} 50%)` }
    }
    if (saliendo) {
      return { background: `linear-gradient(45deg, transparent 50%, ${colorSaliendo} 50%)` }
    }
    if (entrando) {
      return { background: `linear-gradient(45deg, ${colorEntrando} 50%, transparent 50%)` }
    }
    if (ocupadoTotal) {
      return { backgroundColor: ocupadoTotal.color || '#3b82f6' }
    }
    return {}
  }

  const guardarReserva = async () => {
    const total = nuevaReserva.num_personas * nuevaReserva.precio_persona * Math.max(1, Math.ceil((new Date(nuevaReserva.fecha_salida).getTime() - new Date(nuevaReserva.fecha_entrada).getTime()) / 86400000))
    
    const datos = {
      ...nuevaReserva,
      huesped_nombre: nuevaReserva.huesped_nombre.toUpperCase(),
      valor_total: total,
      saldo_pendiente: total - nuevaReserva.anticipo,
      color: editandoId ? undefined : `hsl(${Math.random() * 360}, 65%, 45%)`
    }
    delete (datos as any).cliente_telefono; delete (datos as any).cliente_ciudad

    const { error } = editandoId 
      ? await supabase.from('reservas').update(datos).eq('id', editandoId)
      : await supabase.from('reservas').insert([datos])

    if (error) alert(error.message)
    else { setMostrarModal(false); cargarDatos() }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-black uppercase text-xs italic text-blue-400 tracking-tighter">Cojimíes Booking Engine</h1>
        <input type="date" className="bg-gray-800 p-2 rounded text-[10px]" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      <div className="flex-1 overflow-auto p-4">
        <table className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-50 uppercase text-[9px] font-black text-gray-400">
              <th className="p-4 border-b sticky left-0 bg-gray-50 z-10">Hab.</th>
              {dias.map((d, i) => (
                <th key={i} className="p-2 border-b min-w-[80px] text-center border-r">
                  {d.getDate()} <br/> <span className="text-[7px]">{d.toLocaleDateString('es', {weekday:'short'})}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map(hab => (
              <tr key={hab.id}>
                <td className="p-4 font-black text-[10px] uppercase border-b border-r sticky left-0 bg-white z-10 shadow-sm">{hab.nombre}</td>
                {dias.map((dia, i) => {
                  const fStr = dia.toISOString().split('T')[0]
                  return (
                    <td 
                      key={i} 
                      onClick={() => {
                        const r = reservas.find(res => res.habitacion_id === hab.id && fStr >= res.fecha_entrada && fStr <= res.fecha_salida)
                        setEditandoId(r?.id || null)
                        setNuevaReserva(r || { ...nuevaReserva, habitacion_id: hab.id, fecha_entrada: fStr, fecha_salida: fStr })
                        setMostrarModal(true)
                      }}
                      className="border-b border-r h-16 cursor-pointer hover:opacity-80 transition-opacity"
                      style={obtenerEstiloCelda(hab.id, fStr)}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl border-t-[15px] border-blue-600">
            <h2 className="text-3xl font-black italic uppercase mb-8 text-gray-800">Check-In / Out</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Nombre del Huésped</label>
                <input type="text" value={nuevaReserva.huesped_nombre} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 font-bold" onChange={e => setNuevaReserva({...nuevaReserva, huesped_nombre: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-blue-500">Entrada</label>
                <input type="date" value={nuevaReserva.fecha_entrada} className="w-full p-3 bg-blue-50 rounded-xl font-bold border-2 border-blue-100" onChange={e => setNuevaReserva({...nuevaReserva, fecha_entrada: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-red-500">Salida</label>
                <input type="date" value={nuevaReserva.fecha_salida} className="w-full p-3 bg-red-50 rounded-xl font-bold border-2 border-red-100" onChange={e => setNuevaReserva({...nuevaReserva, fecha_salida: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400">Huéspedes</label>
                <input type="number" value={nuevaReserva.num_personas} className="w-full p-3 border-2 rounded-xl font-bold" onChange={e => setNuevaReserva({...nuevaReserva, num_personas: parseInt(e.target.value)})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase">Forma de Pago</label>
                <select className="w-full p-3 border-2 rounded-xl font-bold bg-white" value={nuevaReserva.forma_pago} onChange={e => setNuevaReserva({...nuevaReserva, forma_pago: e.target.value})}>
                  <option>Efectivo</option>
                  <option>Transferencia</option>
                  <option>Deposito</option>
                  <option>Airbnb</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black text-green-600">Anticipo</label>
                <input type="number" value={nuevaReserva.anticipo} className="w-full p-5 bg-green-50 border-2 border-green-200 rounded-3xl font-black text-3xl text-green-600" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button className="flex-1 p-5 rounded-full font-black uppercase text-xs bg-gray-100" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="flex-1 p-5 rounded-full font-black uppercase text-xs bg-blue-600 text-white shadow-lg" onClick={guardarReserva}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}