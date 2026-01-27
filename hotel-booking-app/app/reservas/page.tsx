'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ReservasPage() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [fechaBase, setFechaBase] = useState(new Date())
  
  // Estado para el formulario de nueva reserva
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevaReserva, setNuevaReserva] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    habitacion_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    num_personas: 1,
    precio_persona: 0,
    anticipo: 0,
    forma_pago: 'efectivo',
    observaciones: ''
  })

  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(fechaBase); d.setDate(d.getDate() + i); return d
  })

  useEffect(() => { cargarDatos() }, [fechaBase])

  async function cargarDatos() {
    setCargando(true)
    const { data: habs } = await supabase.from('habitaciones').select('*').order('nombre', { ascending: true })
    const { data: reser } = await supabase.from('reservas').select('*, clientes(nombre)')
    if (habs) setHabitaciones(habs)
    if (reser) setReservas(reser)
    setCargando(false)
  }

  const abrirReserva = (hab: any, dia: Date) => {
    setNuevaReserva({
      ...nuevaReserva,
      habitacion_id: hab.id,
      precio_persona: hab.precio_persona_noche || 0,
      fecha_inicio: dia.toISOString().split('T')[0],
      fecha_fin: dia.toISOString().split('T')[0]
    })
    setMostrarModal(true)
  }

  const guardarReserva = async () => {
    // Cálculo de noches
    const inicio = new Date(nuevaReserva.fecha_inicio)
    const fin = new Date(nuevaReserva.fecha_fin)
    const noches = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)))
    
    const total = nuevaReserva.num_personas * nuevaReserva.precio_persona * noches
    const saldo = total - nuevaReserva.anticipo

    // 1. Manejar Cliente (Buscar o Crear)
    let clienteId;
    const { data: clienteExistente } = await supabase.from('clientes').select('id').eq('nombre', nuevaReserva.cliente_nombre).single()
    
    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: nuevoCliente } = await supabase.from('clientes').insert([{ nombre: nuevaReserva.cliente_nombre, telefono: nuevaReserva.cliente_telefono }]).select().single()
      clienteId = nuevoCliente?.id
    }

    // 2. Insertar Reserva
    const { error } = await supabase.from('reservas').insert([{
      habitacion_id: nuevaReserva.habitacion_id,
      cliente_id: clienteId,
      nombre_cliente: nuevaReserva.cliente_nombre,
      fecha_inicio: nuevaReserva.fecha_inicio,
      fecha_fin: nuevaReserva.fecha_fin,
      num_personas: nuevaReserva.num_personas,
      precio_persona: nuevaReserva.precio_persona,
      valor_total: total,
      anticipo: nuevaReserva.anticipo,
      saldo_pendiente: saldo,
      forma_pago: nuevaReserva.forma_pago,
      observaciones: nuevaReserva.observaciones,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    }])

    if (error) alert("Error: " + error.message)
    else { setMostrarModal(false); cargarDatos() }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* HEADER */}
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="text-[10px] font-black uppercase bg-gray-800 px-3 py-2 rounded">← Volver</Link>
        <h1 className="font-black italic uppercase text-sm">Reserva Maestro</h1>
        <input type="date" className="bg-gray-800 text-[10px] p-2 rounded" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      {/* GRID CALENDARIO */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="sticky left-0 z-40 bg-gray-100 border-r border-b p-4 w-[120px] text-[10px] font-black uppercase">Hab.</th>
              {dias.map((dia, i) => (
                <th key={i} className={`border-r border-b p-2 min-w-[80px] text-center ${dia.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white' : ''}`}>
                  <span className="block text-[8px] font-black uppercase">{dia.toLocaleDateString('es', { weekday: 'short' })}</span>
                  <span className="text-lg font-black italic">{dia.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map((hab) => (
              <tr key={hab.id}>
                <td className="sticky left-0 z-30 bg-white border-r border-b p-4 font-black text-xs uppercase shadow-md">{hab.nombre}</td>
                {dias.map((dia, i) => {
                  const fechaStr = dia.toISOString().split('T')[0]
                  const res = reservas.find(r => r.habitacion_id === hab.id && fechaStr >= r.fecha_inicio && fechaStr <= r.fecha_fin)
                  return (
                    <td 
                      key={i} 
                      onClick={() => !res && abrirReserva(hab, dia)}
                      className={`border-r border-b min-w-[80px] h-16 cursor-pointer relative ${res ? 'cursor-not-allowed' : 'hover:bg-blue-50'}`}
                      style={{ backgroundColor: res ? res.color : '' }}
                    >
                      {res && <span className="text-[8px] font-black text-white p-1 block leading-tight">{res.nombre_cliente}</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE RESERVA */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black uppercase italic mb-4 border-b pb-2">Nueva Reserva</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre Cliente" className="w-full p-2 border rounded-xl font-bold uppercase text-xs" onChange={e => setNuevaReserva({...nuevaReserva, cliente_nombre: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-black uppercase">Desde</label><input type="date" value={nuevaReserva.fecha_inicio} className="w-full p-2 border rounded-lg text-xs" onChange={e => setNuevaReserva({...nuevaReserva, fecha_inicio: e.target.value})} /></div>
                <div><label className="text-[10px] font-black uppercase">Hasta</label><input type="date" value={nuevaReserva.fecha_fin} className="w-full p-2 border rounded-lg text-xs" onChange={e => setNuevaReserva({...nuevaReserva, fecha_fin: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Personas" className="w-full p-2 border rounded-lg text-xs" onChange={e => setNuevaReserva({...nuevaReserva, num_personas: parseInt(e.target.value)})} />
                <input type="number" placeholder="Precio x Persona" className="w-full p-2 border rounded-lg text-xs" value={nuevaReserva.precio_persona} onChange={e => setNuevaReserva({...nuevaReserva, precio_persona: parseFloat(e.target.value)})} />
              </div>
              <select className="w-full p-2 border rounded-lg text-xs font-bold" onChange={e => setNuevaReserva({...nuevaReserva, forma_pago: e.target.value})}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Depósito</option>
                <option value="airbnb">Airbnb</option>
              </select>
              <input type="number" placeholder="Anticipo (50%)" className="w-full p-2 border border-blue-200 rounded-lg text-xs font-black text-blue-600" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value)})} />
              <textarea placeholder="Observaciones" className="w-full p-2 border rounded-lg text-xs h-20" onChange={e => setNuevaReserva({...nuevaReserva, observaciones: e.target.value})}></textarea>
              
              <div className="flex gap-2 pt-4">
                <button className="flex-1 bg-red-100 text-red-600 p-3 rounded-2xl font-black uppercase text-xs" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button className="flex-1 bg-green-600 text-white p-3 rounded-2xl font-black uppercase text-xs shadow-lg shadow-green-100" onClick={guardarReserva}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}