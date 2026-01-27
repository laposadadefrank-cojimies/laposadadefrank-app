'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ReservasPage() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [ciudades, setCiudades] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)
  const [fechaBase, setFechaBase] = useState(new Date())
  
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevaReserva, setNuevaReserva] = useState({
    cliente_id: '',
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
    const { data: cls } = await supabase.from('clientes').select('*').order('nombre', { ascending: true })
    
    if (habs) setHabitaciones(habs)
    if (reser) setReservas(reser)
    if (cls) {
      setClientes(cls)
      // Extraer ciudades únicas
      const listaCiudades = Array.from(new Set(cls.map(c => c.ciudad).filter(Boolean))) as string[]
      setCiudades(listaCiudades)
    }
    setCargando(false)
  }

  const seleccionarClienteExistente = (id: string) => {
    const c = clientes.find(item => item.id === id)
    if (c) {
      setNuevaReserva({
        ...nuevaReserva,
        cliente_id: c.id,
        cliente_nombre: c.nombre,
        cliente_telefono: c.telefono || '',
        cliente_direccion: c.direccion || '',
        cliente_ciudad: c.ciudad || ''
      })
    }
  }

  const abrirReserva = (hab: any, dia: Date) => {
    setNuevaReserva({
      cliente_id: '',
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_direccion: '',
      cliente_ciudad: '',
      habitacion_id: hab.id,
      precio_persona: hab.precio_persona_noche || 0,
      fecha_inicio: dia.toISOString().split('T')[0],
      fecha_fin: dia.toISOString().split('T')[0],
      num_personas: 1,
      anticipo: 0,
      forma_pago: 'efectivo',
      observaciones: ''
    })
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
    if (!nuevaReserva.cliente_nombre) return alert("Nombre de cliente obligatorio")

    // Validación de choque
    const choque = reservas.find(r => 
      r.habitacion_id === nuevaReserva.habitacion_id && 
      ((nuevaReserva.fecha_inicio >= r.fecha_inicio && nuevaReserva.fecha_inicio <= r.fecha_fin) ||
       (nuevaReserva.fecha_fin >= r.fecha_inicio && nuevaReserva.fecha_fin <= r.fecha_fin))
    )
    if (choque) return alert("⚠️ Habitación ocupada en esas fechas")

    let finalClienteId = nuevaReserva.cliente_id

    // Si es un cliente nuevo (no tiene ID), lo creamos
    if (!finalClienteId) {
      const { data: nuevoCl, error: errCl } = await supabase.from('clientes').insert([{ 
        nombre: nuevaReserva.cliente_nombre.toUpperCase(), 
        telefono: nuevaReserva.cliente_telefono,
        direccion: nuevaReserva.cliente_direccion,
        ciudad: nuevaReserva.cliente_ciudad
      }]).select().single()
      if (errCl) return alert("Error cliente: " + errCl.message)
      finalClienteId = nuevoCl.id
    }

    const { error } = await supabase.from('reservas').insert([{
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
      observaciones: nuevaReserva.observaciones,
      color: `hsl(${Math.random() * 360}, 70%, 45%)`
    }])

    if (error) alert(error.message)
    else { setMostrarModal(false); cargarDatos() }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <Link href="/dashboard" className="text-[10px] font-black uppercase bg-gray-800 px-4 py-2 rounded-xl">← Dashboard</Link>
        <h1 className="font-black italic uppercase text-sm tracking-tighter">Panel de Reservas</h1>
        <input type="date" className="bg-gray-800 text-[10px] p-2 rounded-lg border border-gray-700 text-white" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      <div className="flex-1 overflow-auto bg-white shadow-inner">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 uppercase text-[10px] font-black italic text-gray-500">
              <th className="sticky left-0 z-40 bg-gray-100 border-r border-b p-4 min-w-[120px]">Habitación</th>
              {dias.map((dia, i) => (
                <th key={i} className={`border-r border-b p-2 min-w-[85px] text-center ${dia.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white' : ''}`}>
                  <span className="block text-[8px] opacity-70">{dia.toLocaleDateString('es', { weekday: 'short' })}</span>
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
                        <div className="absolute inset-0 flex flex-col justify-center p-1">
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-gray-800 border-b-8 border-blue-600 inline-block">Nueva Reserva</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
                <label className="text-[10px] font-black uppercase text-blue-400 block mb-1">Buscar Cliente Registrado</label>
                <select 
                  className="w-full p-3 bg-white border-2 border-blue-200 rounded-xl font-bold uppercase text-xs text-blue-700"
                  value={nuevaReserva.cliente_id}
                  onChange={e => seleccionarClienteExistente(e.target.value)}
                >
                  <option value="">-- CLIENTE NUEVO / BUSCAR --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Nombre Completo</label>
                <input type="text" value={nuevaReserva.cliente_nombre} className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold uppercase" onChange={e => setNuevaReserva({...nuevaReserva, cliente_nombre: e.target.value})} />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Teléfono</label>
                <input type="text" value={nuevaReserva.cliente_telefono} className="w-full p-3 border-2 border-gray-100 rounded-xl" onChange={e => setNuevaReserva({...nuevaReserva, cliente_telefono: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Ciudad</label>
                <input 
                    list="ciudades-list" 
                    value={nuevaReserva.cliente_ciudad} 
                    className="w-full p-3 border-2 border-gray-100 rounded-xl uppercase font-bold text-xs" 
                    onChange={e => setNuevaReserva({...nuevaReserva, cliente_ciudad: e.target.value})}
                    placeholder="Escriba o seleccione..."
                />
                <datalist id="ciudades-list">
                    {ciudades.map((c, i) => <option key={i} value={c} />)}
                </datalist>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Dirección</label>
                <input type="text" value={nuevaReserva.cliente_direccion} className="w-full p-3 border-2 border-gray-100 rounded-xl" onChange={e => setNuevaReserva({...nuevaReserva, cliente_direccion: e.target.value})} />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                <div><label className="text-[10px] font-black text-gray-400 italic uppercase">Entrada</label><input type="date" value={nuevaReserva.fecha_inicio} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_inicio: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-gray-400 italic uppercase">Salida</label><input type="date" value={nuevaReserva.fecha_fin} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_fin: e.target.value})} /></div>
              </div>

              <div className="md:col-span-2 bg-gray-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-2xl border-b-4 border-blue-500">
                <div>
                  <p className="text-[9px] font-black opacity-40 uppercase">Total ({calcularNoches()} noches)</p>
                  <p className="text-4xl font-black italic">${valorTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black opacity-40 uppercase text-red-400">Por Cobrar</p>
                  <p className="text-4xl font-black italic text-red-400">${saldoPendiente.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <div><label className="text-[10px] font-black text-gray-400 uppercase">Personas</label><input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-center" value={nuevaReserva.num_personas} onChange={e => setNuevaReserva({...nuevaReserva, num_personas: parseInt(e.target.value) || 1})} /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase">Precio p/p</label><input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-center" value={nuevaReserva.precio_persona} onChange={e => setNuevaReserva({...nuevaReserva, precio_persona: parseFloat(e.target.value) || 0})} /></div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-green-600">Anticipo Pagado</label>
                <input type="number" className="w-full p-4 border-2 border-green-200 rounded-2xl font-black text-green-600 text-3xl text-center" placeholder="0.00" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value) || 0})} />
              </div>

            </div>

            <div className="flex gap-4 mt-10">
              <button className="flex-1 bg-gray-100 text-gray-400 p-5 rounded-3xl font-black uppercase text-xs hover:bg-red-50 hover:text-red-400 transition-all" onClick={() => setMostrarModal(false)}>Descartar</button>
              <button className="flex-1 bg-blue-600 text-white p-5 rounded-3xl font-black uppercase text-xs shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all" onClick={guardarReserva}>Confirmar Todo</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}