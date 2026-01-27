'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ReservasPage() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [fechaBase, setFechaBase] = useState(new Date())
  
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevaReserva, setNuevaReserva] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_direccion: '',
    cliente_ciudad: '',
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
    const { data: reser } = await supabase.from('reservas').select('*')
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

  // Cálculos automáticos
  const calcularNoches = () => {
    const inicio = new Date(nuevaReserva.fecha_inicio)
    const fin = new Date(nuevaReserva.fecha_fin)
    const diff = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return diff <= 0 ? 1 : diff
  }
  const valorTotal = nuevaReserva.num_personas * nuevaReserva.precio_persona * calcularNoches()
  const saldoPendiente = valorTotal - nuevaReserva.anticipo

  const guardarReserva = async () => {
    if (!nuevaReserva.cliente_nombre) return alert("Nombre de cliente obligatorio")

    // 1. Manejar Cliente
    let clienteId;
    const { data: clienteExistente } = await supabase.from('clientes').select('id').eq('nombre', nuevaReserva.cliente_nombre.toUpperCase()).single()
    
    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: nuevoCliente } = await supabase.from('clientes').insert([{ 
        nombre: nuevaReserva.cliente_nombre.toUpperCase(), 
        telefono: nuevaReserva.cliente_telefono,
        direccion: nuevaReserva.cliente_direccion,
        ciudad: nuevaReserva.cliente_ciudad
      }]).select().single()
      clienteId = nuevoCliente?.id
    }

    // 2. Insertar Reserva
    const { error } = await supabase.from('reservas').insert([{
      habitacion_id: nuevaReserva.habitacion_id,
      cliente_id: clienteId,
      nombre_cliente: nuevaReserva.cliente_nombre.toUpperCase(),
      fecha_inicio: nuevaReserva.fecha_inicio,
      fecha_fin: nuevaReserva.fecha_fin,
      num_personas: nuevaReserva.num_personas,
      precio_persona: nuevaReserva.precio_persona,
      valor_total: valorTotal,
      anticipo: nuevaReserva.anticipo,
      saldo_pendiente: saldoPendiente,
      forma_pago: nuevaReserva.forma_pago,
      observaciones: nuevaReserva.observaciones,
      color: `hsl(${Math.random() * 360}, 70%, 45%)`
    }])

    if (error) alert(error.message)
    else { setMostrarModal(false); cargarDatos() }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="text-[10px] font-black uppercase bg-gray-800 px-3 py-2 rounded">← Dashboard</Link>
        <h1 className="font-black italic uppercase text-sm tracking-widest">Calendario de Reservas</h1>
        <input type="date" className="bg-gray-800 text-[10px] p-2 rounded border border-gray-700" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      <div className="flex-1 overflow-auto bg-white shadow-inner">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="sticky left-0 z-40 bg-gray-100 border-r border-b p-4 min-w-[120px] text-[10px] font-black uppercase italic">Habitación</th>
              {dias.map((dia, i) => (
                <th key={i} className={`border-r border-b p-2 min-w-[85px] text-center ${dia.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white' : ''}`}>
                  <span className="block text-[8px] font-black uppercase opacity-70">{dia.toLocaleDateString('es', { weekday: 'short' })}</span>
                  <span className="text-lg font-black italic">{dia.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map((hab) => (
              <tr key={hab.id}>
                <td className="sticky left-0 z-30 bg-white border-r border-b p-4 font-black text-xs uppercase italic shadow-md">{hab.nombre}</td>
                {dias.map((dia, i) => {
                  const fechaStr = dia.toISOString().split('T')[0]
                  const res = reservas.find(r => r.habitacion_id === hab.id && fechaStr >= r.fecha_inicio && fechaStr <= r.fecha_fin)
                  return (
                    <td 
                      key={i} 
                      onClick={() => !res && abrirReserva(hab, dia)}
                      className={`border-r border-b min-w-[85px] h-20 cursor-pointer relative ${res ? 'cursor-default' : 'hover:bg-blue-50'}`}
                      style={{ backgroundColor: res ? res.color : '' }}
                    >
                      {res && (
                        <div className="absolute inset-0 flex flex-col justify-center p-1 overflow-hidden">
                          <span className="text-[8px] font-black text-white uppercase leading-tight truncate">{res.nombre_cliente}</span>
                          <span className="text-[7px] font-bold text-white/80">${res.valor_total}</span>
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

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-gray-800 border-b-4 border-blue-600 inline-block">Ficha de Reserva</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Nombre del Huésped</label>
                <input type="text" placeholder="EJ: JUAN PEREZ" className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold uppercase" onChange={e => setNuevaReserva({...nuevaReserva, cliente_nombre: e.target.value})} />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Teléfono</label>
                <input type="text" className="w-full p-3 border-2 border-gray-100 rounded-xl" onChange={e => setNuevaReserva({...nuevaReserva, cliente_telefono: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Ciudad</label>
                <input type="text" className="w-full p-3 border-2 border-gray-100 rounded-xl" onChange={e => setNuevaReserva({...nuevaReserva, cliente_ciudad: e.target.value})} />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Dirección</label>
                <input type="text" className="w-full p-3 border-2 border-gray-100 rounded-xl" onChange={e => setNuevaReserva({...nuevaReserva, cliente_direccion: e.target.value})} />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl md:col-span-2 grid grid-cols-2 gap-4 border-2 border-blue-100">
                <div><label className="text-[10px] font-black text-blue-600">ENTRADA</label><input type="date" value={nuevaReserva.fecha_inicio} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_inicio: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-blue-600">SALIDA</label><input type="date" value={nuevaReserva.fecha_fin} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_fin: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <input type="number" placeholder="Personas" className="p-3 border-2 border-gray-100 rounded-xl font-bold" onChange={e => setNuevaReserva({...nuevaReserva, num_personas: parseInt(e.target.value) || 1})} />
                <input type="number" placeholder="Precio x P" className="p-3 border-2 border-gray-100 rounded-xl font-bold" value={nuevaReserva.precio_persona} onChange={e => setNuevaReserva({...nuevaReserva, precio_persona: parseFloat(e.target.value) || 0})} />
              </div>

              <div className="md:col-span-2 bg-gray-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-xl">
                <div>
                  <p className="text-[10px] font-bold opacity-50 uppercase">Valor Total</p>
                  <p className="text-2xl font-black italic">${valorTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold opacity-50 uppercase text-red-400">Saldo Pendiente</p>
                  <p className="text-2xl font-black italic text-red-400">${saldoPendiente.toFixed(2)}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Anticipo Recibido</label>
                <input type="number" className="w-full p-3 border-2 border-blue-200 rounded-xl font-black text-blue-600 text-xl" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value) || 0})} />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Forma de Pago</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" onChange={e => setNuevaReserva({...nuevaReserva, forma_pago: e.target.value})}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="deposito">Depósito</option>
                  <option value="airbnb">Airbnb</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button className="flex-1 bg-gray-100 text-gray-400 p-4 rounded-2xl font-black uppercase text-xs" onClick={() => setMostrarModal(false)}>Cerrar</button>
              <button className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-green-200 transition-transform active:scale-95" onClick={guardarReserva}>Guardar Reserva</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}