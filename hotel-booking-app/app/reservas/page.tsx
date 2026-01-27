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
    cliente_id: '', cliente_nombre: '', cliente_telefono: '', 
    cliente_direccion: '', cliente_ciudad: '', habitacion_id: '',
    fecha_inicio: '', fecha_fin: '', num_personas: 1, 
    precio_persona: 0, anticipo: 0, forma_pago: 'efectivo', observaciones: ''
  })

  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(fechaBase); d.setDate(d.getDate() + i); return d
  })

  useEffect(() => { cargarDatos() }, [fechaBase])

  async function cargarDatos() {
    setCargando(true)
    const { data: habs } = await supabase.from('habitaciones').select('*').order('nombre', { ascending: true })
    const { data: reser } = await supabase.from('reservas').select('*')
    const { data: cls } = await supabase.from('clientes').select('*').order('nombre', { ascending: true })
    if (habs) setHabitaciones(habs)
    if (reser) setReservas(reser)
    if (cls) setClientes(cls)
    setCargando(false)
  }

  const abrirReserva = (hab: any, dia: Date, reservaExistente?: any) => {
    if (reservaExistente) {
      setEditandoId(reservaExistente.id)
      const cl = clientes.find(c => c.id === reservaExistente.cliente_id)
      setNuevaReserva({
        ...reservaExistente,
        cliente_nombre: reservaExistente.nombre_cliente,
        cliente_telefono: cl?.telefono || '',
        cliente_direccion: cl?.direccion || '',
        cliente_ciudad: cl?.ciudad || ''
      })
    } else {
      setEditandoId(null)
      const hoyStr = dia.toISOString().split('T')[0]
      const mañana = new Date(dia); mañana.setDate(mañana.getDate() + 1)
      const mañanaStr = mañana.toISOString().split('T')[0]
      
      setNuevaReserva({
        cliente_id: '', cliente_nombre: '', cliente_telefono: '', cliente_direccion: '', cliente_ciudad: '',
        habitacion_id: hab.id, precio_persona: hab.precio_persona_noche || 0,
        fecha_inicio: hoyStr, fecha_fin: mañanaStr,
        num_personas: 1, anticipo: 0, forma_pago: 'efectivo', observaciones: ''
      })
    }
    setMostrarModal(true)
  }

  const calcularNoches = () => {
    const inicio = new Date(nuevaReserva.fecha_inicio)
    const fin = new Date(nuevaReserva.fecha_fin)
    const diff = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return diff < 1 ? 1 : diff
  }

  const valorTotal = nuevaReserva.num_personas * nuevaReserva.precio_persona * calcularNoches()
  const saldoPendiente = valorTotal - nuevaReserva.anticipo

  const guardarReserva = async () => {
    // --- LÓGICA DE VALIDACIÓN MEJORADA (CHECK-IN/OUT) ---
    // Una reserva choca solo si el INICIO de la nueva es ANTES del FIN de la existente
    // Y el FIN de la nueva es DESPUÉS del INICIO de la existente.
    const choque = reservas.find(r => 
      r.id !== editandoId &&
      r.habitacion_id === nuevaReserva.habitacion_id && 
      nuevaReserva.fecha_inicio < r.fecha_fin && 
      nuevaReserva.fecha_fin > r.fecha_inicio
    )

    if (choque) return alert(`⚠️ Choque de fechas con la reserva de ${choque.nombre_cliente}`)

    let finalClienteId = nuevaReserva.cliente_id
    if (!finalClienteId) {
      const { data: nuevoCl } = await supabase.from('clientes').insert([{ 
        nombre: nuevaReserva.cliente_nombre.toUpperCase(), telefono: nuevaReserva.cliente_telefono,
        direccion: nuevaReserva.cliente_direccion, ciudad: nuevaReserva.cliente_ciudad
      }]).select().single()
      finalClienteId = nuevoCl?.id
    }

    const datosReserva = {
      habitacion_id: nuevaReserva.habitacion_id,
      cliente_id: finalClienteId,
      nombre_cliente: nuevaReserva.cliente_nombre.toUpperCase(),
      fecha_inicio: nuevaReserva.fecha_inicio,
      fecha_fin: nuevaReserva.fecha_fin,
      num_personas: nuevaReserva.num_personas,
      precio_persona: nuevaReserva.precio_persona,
      valor_total: valorTotal,
      anticipo: nuevaReserva.anticipo,
      saldo_pendiente: saldoPendiente,
      forma_pago: nuevaReserva.forma_pago,
      observaciones: nuevaReserva.observaciones
    }

    const { error } = editandoId 
      ? await supabase.from('reservas').update(datosReserva).eq('id', editandoId)
      : await supabase.from('reservas').insert([{ ...datosReserva, color: `hsl(${Math.random() * 360}, 60%, 50%)` }])

    if (error) alert(error.message)
    else { setMostrarModal(false); cargarDatos() }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="text-[10px] font-black uppercase bg-gray-800 px-3 py-2 rounded-xl">← Dashboard</Link>
        <h1 className="font-black italic uppercase text-xs">Gestión Check-In/Out</h1>
        <input type="date" className="bg-gray-800 text-[10px] p-2 rounded text-white" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 uppercase text-[10px] font-black italic text-gray-500">
              <th className="sticky left-0 z-40 bg-gray-100 border-r border-b p-4 min-w-[120px]">Hab.</th>
              {dias.map((dia, i) => (
                <th key={i} className={`border-r border-b p-2 min-w-[90px] text-center ${dia.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white' : ''}`}>
                  <span className="block text-[8px]">{dia.toLocaleDateString('es', { weekday: 'short' })}</span>
                  <span className="text-lg italic font-black">{dia.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map((hab) => (
              <tr key={hab.id}>
                <td className="sticky left-0 z-30 bg-white border-r border-b p-4 font-black text-xs uppercase italic shadow-md">{hab.nombre}</td>
                {dias.map((dia, i) => {
                  const f = dia.toISOString().split('T')[0]
                  // LÓGICA DE PINTADO: No pintamos el día de salida (f === r.fecha_fin) 
                  // para que se vea disponible para el siguiente Check-in.
                  const res = reservas.find(r => r.habitacion_id === hab.id && f >= r.fecha_inicio && f < r.fecha_fin)
                  return (
                    <td key={i} onClick={() => abrirReserva(hab, dia, res)} className={`border-r border-b min-w-[90px] h-20 cursor-pointer relative ${!res && 'hover:bg-blue-50'}`} style={{ backgroundColor: res ? (res.color || '#3b82f6') : '' }}>
                      {res && <div className="p-1 text-[8px] font-black text-white uppercase truncate">{res.nombre_cliente}</div>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (Mismo que el anterior, pero con la lógica de validación nueva al guardar) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
             <h2 className="text-2xl font-black uppercase italic mb-6 text-gray-800 border-b-8 border-blue-600 inline-block">Ficha de Reserva</h2>
             <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="CLIENTE" value={nuevaReserva.cliente_nombre} className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold uppercase" onChange={e => setNuevaReserva({...nuevaReserva, cliente_nombre: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase">Check-In</label><input type="date" value={nuevaReserva.fecha_inicio} className="w-full p-2 border rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_inicio: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black uppercase">Check-Out</label><input type="date" value={nuevaReserva.fecha_fin} className="w-full p-2 border rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_fin: e.target.value})} /></div>
                </div>
                <div className="bg-gray-900 text-white p-6 rounded-3xl flex justify-between">
                  <div><p className="text-[9px] opacity-40 uppercase">Total ({calcularNoches()} noches)</p><p className="text-4xl font-black italic">${valorTotal.toFixed(2)}</p></div>
                  <div className="text-right"><p className="text-[9px] opacity-40 uppercase text-red-400">Saldo</p><p className="text-4xl font-black italic text-red-400">${saldoPendiente.toFixed(2)}</p></div>
                </div>
                <input type="number" placeholder="ANTICIPO" value={nuevaReserva.anticipo} className="w-full p-4 border-2 border-green-200 rounded-2xl font-black text-green-600 text-2xl" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value) || 0})} />
             </div>
             <div className="flex gap-4 mt-8">
                <button className="flex-1 bg-gray-100 p-5 rounded-3xl font-black uppercase text-xs" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button className="flex-1 bg-blue-600 text-white p-5 rounded-3xl font-black uppercase text-xs shadow-xl" onClick={guardarReserva}>Confirmar</button>
             </div>
          </div>
        </div>
      )}
    </main>
  )
}