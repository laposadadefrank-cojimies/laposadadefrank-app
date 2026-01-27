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
  const [editandoId, setEditandoId] = useState<string | null>(null)
  
  const [nuevaReserva, setNuevaReserva] = useState({
    cliente_id: '', 
    huesped_nombre: '', 
    cliente_telefono: '', 
    cliente_direccion: '', 
    cliente_ciudad: '', 
    habitacion_id: '',
    fecha_entrada: '', 
    fecha_salida: '', // CAMBIADO: Antes era fecha_fin
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
    try {
      const { data: habs } = await supabase.from('habitaciones').select('*').order('nombre')
      const { data: reser } = await supabase.from('reservas').select('*')
      const { data: cls } = await supabase.from('clientes').select('*').order('nombre')
      
      setHabitaciones(habs || [])
      setReservas(reser || [])
      if (cls) {
        setClientes(cls)
        setCiudades(Array.from(new Set(cls.map(c => c.ciudad).filter(Boolean))) as string[])
      }
    } catch (err) { console.error(err) }
    setCargando(false)
  }

  const seleccionarClienteExistente = (id: string) => {
    const c = clientes.find(item => item.id === id)
    if (c) {
      setNuevaReserva(prev => ({
        ...prev,
        cliente_id: c.id,
        huesped_nombre: c.nombre,
        cliente_telefono: c.telefono || '',
        cliente_direccion: c.direccion || '',
        cliente_ciudad: c.ciudad || ''
      }))
    }
  }

  const abrirReserva = (hab: any, dia: Date, resExistente?: any) => {
    if (resExistente) {
      setEditandoId(resExistente.id)
      const cl = clientes.find(c => c.id === resExistente.cliente_id)
      setNuevaReserva({
        ...resExistente,
        huesped_nombre: resExistente.huesped_nombre,
        cliente_telefono: cl?.telefono || '',
        cliente_direccion: cl?.direccion || '',
        cliente_ciudad: cl?.ciudad || ''
      })
    } else {
      setEditandoId(null)
      const hoyStr = dia.toISOString().split('T')[0]
      const mañana = new Date(dia); mañana.setDate(mañana.getDate() + 1)
      setNuevaReserva({
        cliente_id: '', huesped_nombre: '', cliente_telefono: '', cliente_direccion: '', cliente_ciudad: '',
        habitacion_id: hab.id, precio_persona: hab.precio_persona_noche || 0,
        fecha_entrada: hoyStr, fecha_salida: mañana.toISOString().split('T')[0],
        num_personas: 1, anticipo: 0, forma_pago: 'efectivo', observaciones: ''
      })
    }
    setMostrarModal(true)
  }

  const calcularNoches = () => {
    const inicio = new Date(nuevaReserva.fecha_entrada)
    const fin = new Date(nuevaReserva.fecha_salida)
    const diff = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return diff < 1 ? 1 : diff
  }

  const valorTotal = nuevaReserva.num_personas * nuevaReserva.precio_persona * calcularNoches()
  const saldoPendiente = valorTotal - nuevaReserva.anticipo

  const guardarReserva = async () => {
    if (!nuevaReserva.huesped_nombre) return alert("Nombre obligatorio")

    const choque = reservas.find(r => 
      r.id !== editandoId &&
      r.habitacion_id === nuevaReserva.habitacion_id && 
      nuevaReserva.fecha_entrada < r.fecha_salida && 
      nuevaReserva.fecha_salida > r.fecha_entrada
    )
    if (choque) return alert(`Ocupado por ${choque.huesped_nombre}`)

    let finalId = nuevaReserva.cliente_id
    const { data: cl } = await supabase.from('clientes').upsert({
      id: finalId || undefined,
      nombre: nuevaReserva.huesped_nombre.toUpperCase(),
      telefono: nuevaReserva.cliente_telefono,
      ciudad: nuevaReserva.cliente_ciudad,
      direccion: nuevaReserva.cliente_direccion
    }).select().single()
    
    finalId = cl?.id

    const datos = {
      habitacion_id: nuevaReserva.habitacion_id,
      cliente_id: finalId,
      huesped_nombre: nuevaReserva.huesped_nombre.toUpperCase(),
      fecha_entrada: nuevaReserva.fecha_entrada,
      fecha_salida: nuevaReserva.fecha_salida, // USANDO EL NOMBRE CORRECTO
      num_personas: nuevaReserva.num_personas,
      precio_persona: nuevaReserva.precio_persona,
      valor_total: valorTotal,
      anticipo: nuevaReserva.anticipo,
      saldo_pendiente: saldoPendiente,
      forma_pago: nuevaReserva.forma_pago,
      observaciones: nuevaReserva.observaciones
    }

    const { error } = editandoId 
      ? await supabase.from('reservas').update(datos).eq('id', editandoId)
      : await supabase.from('reservas').insert([{ ...datos, color: `hsl(${Math.random() * 360}, 60%, 45%)` }])

    if (error) alert("Error: " + error.message)
    else { setMostrarModal(false); cargarDatos() }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="text-[10px] font-black uppercase bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">← Dashboard</Link>
        <h1 className="font-black italic uppercase text-xs tracking-widest text-blue-400">Reserva Maestro</h1>
        <input type="date" className="bg-gray-800 text-[10px] p-2 rounded-lg text-white" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 uppercase text-[10px] font-black italic text-gray-500">
              <th className="sticky left-0 z-40 bg-gray-100 border-r border-b p-4 min-w-[120px]">Habitación</th>
              {dias.map((dia, i) => (
                <th key={i} className={`border-r border-b p-2 min-w-[90px] text-center ${dia.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white' : ''}`}>
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
                  const f = dia.toISOString().split('T')[0]
                  // Lógica 12:00 PM: Ocupado hasta el día ANTERIOR a la salida
                  const res = reservas.find(r => r.habitacion_id === hab.id && f >= r.fecha_entrada && f < r.fecha_salida)
                  return (
                    <td key={i} onClick={() => abrirReserva(hab, dia, res)} className={`border-r border-b min-w-[90px] h-20 cursor-pointer relative ${!res && 'hover:bg-blue-50'}`} style={{ backgroundColor: res ? (res.color || '#3b82f6') : '' }}>
                      {res && <div className="p-1 text-[8px] font-black text-white uppercase truncate">{res.huesped_nombre}</div>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto border-t-[12px] border-blue-600">
             
             <div className="mb-6 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 text-xs">
                <label className="font-black text-blue-400 uppercase mb-1 block">¿Cliente registrado?</label>
                <select className="w-full p-2 bg-white border rounded-xl font-bold uppercase" onChange={(e) => seleccionarClienteExistente(e.target.value)} value={nuevaReserva.cliente_id}>
                  <option value="">-- SELECCIONAR CLIENTE --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Nombre Completo</label>
                  <input type="text" value={nuevaReserva.huesped_nombre} className="w-full p-3 border-2 border-gray-100 rounded-xl font-black uppercase text-sm" onChange={e => setNuevaReserva({...nuevaReserva, huesped_nombre: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Teléfono</label>
                  <input type="text" value={nuevaReserva.cliente_telefono} className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" onChange={e => setNuevaReserva({...nuevaReserva, cliente_telefono: e.target.value})} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Ciudad</label>
                  <input list="ciudades-list" value={nuevaReserva.cliente_ciudad} className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold uppercase" onChange={e => setNuevaReserva({...nuevaReserva, cliente_ciudad: e.target.value})} />
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <div><label className="text-[10px] font-black text-blue-600">ENTRADA (12PM)</label><input type="date" value={nuevaReserva.fecha_entrada} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_entrada: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black text-blue-600">SALIDA (12PM)</label><input type="date" value={nuevaReserva.fecha_salida} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_salida: e.target.value})} /></div>
                </div>

                {/* NUEVO CAMPO: NÚMERO DE PERSONAS */}
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Número de Personas</label>
                    <input type="number" value={nuevaReserva.num_personas} className="w-full p-3 border-2 border-gray-100 rounded-xl font-black" onChange={e => setNuevaReserva({...nuevaReserva, num_personas: parseInt(e.target.value) || 1})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase">Precio por Persona</label>
                    <input type="number" value={nuevaReserva.precio_persona} className="w-full p-3 border-2 border-gray-100 rounded-xl font-black" onChange={e => setNuevaReserva({...nuevaReserva, precio_persona: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="md:col-span-2 bg-gray-900 text-white p-6 rounded-3xl flex justify-between shadow-xl">
                  <div><p className="text-[9px] opacity-40 uppercase font-black tracking-widest text-blue-400">Total ({calcularNoches()} noches)</p><p className="text-4xl font-black italic">${valorTotal.toFixed(2)}</p></div>
                  <div className="text-right"><p className="text-[9px] opacity-40 uppercase font-black text-red-400 tracking-widest text-red-400">Saldo Pendiente</p><p className="text-4xl font-black italic text-red-400">${saldoPendiente.toFixed(2)}</p></div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-green-600 uppercase">Abono / Anticipo</label>
                  <input type="number" value={nuevaReserva.anticipo} className="w-full p-4 border-2 border-green-200 rounded-2xl font-black text-green-600 text-3xl" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value) || 0})} />
                </div>
             </div>
             
             <div className="flex gap-4 mt-8">
                <button className="flex-1 bg-gray-100 p-5 rounded-[2rem] font-black uppercase text-xs" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button className="flex-1 bg-blue-600 text-white p-5 rounded-[2rem] font-black uppercase text-xs shadow-lg" onClick={guardarReserva}>Confirmar</button>
             </div>
          </div>
        </div>
      )}
      <datalist id="ciudades-list">
        {ciudades.map((c, idx) => <option key={idx} value={c} />)}
      </datalist>
    </main>
  )
}