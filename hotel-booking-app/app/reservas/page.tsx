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
    cliente_ciudad: '', 
    habitacion_id: '',
    fecha_entrada: '', 
    fecha_salida: '', 
    num_personas: 1, 
    precio_persona: 0, 
    anticipo: 0, 
    forma_pago: 'Efectivo', 
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
        cliente_ciudad: c.ciudad || ''
      }))
    }
  }

  const obtenerEstiloCelda = (habId: string, fechaStr: string) => {
    const reservasDelDia = reservas.filter(r => r.habitacion_id === habId && fechaStr >= r.fecha_entrada && fechaStr <= r.fecha_salida)
    if (reservasDelDia.length === 0) return {}

    const saliendo = reservasDelDia.find(r => r.fecha_salida === fechaStr)
    const entrando = reservasDelDia.find(r => r.fecha_entrada === fechaStr)
    const ocupadoTotal = reservasDelDia.find(r => fechaStr > r.fecha_entrada && fechaStr < r.fecha_salida)

    const colorSaliendo = saliendo?.color || '#3b82f6'
    const colorEntrando = entrando?.color || '#10b981'

    if (saliendo && entrando) return { background: `linear-gradient(to top right, ${colorSaliendo} 50%, ${colorEntrando} 50%)` }
    if (saliendo) return { background: `linear-gradient(to top right, ${colorSaliendo} 50%, transparent 50%)` }
    if (entrando) return { background: `linear-gradient(to top right, transparent 50%, ${colorEntrando} 50%)` }
    if (ocupadoTotal) return { backgroundColor: ocupadoTotal.color }
    return {}
  }

  const calcularNoches = () => {
    if (!nuevaReserva.fecha_entrada || !nuevaReserva.fecha_salida) return 1
    const inicio = new Date(nuevaReserva.fecha_entrada)
    const fin = new Date(nuevaReserva.fecha_salida)
    const diff = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return diff < 1 ? 1 : diff
  }

  const valorTotal = nuevaReserva.num_personas * nuevaReserva.precio_persona * calcularNoches()
  const saldoPendiente = valorTotal - nuevaReserva.anticipo

  const guardarReserva = async () => {
    if (!nuevaReserva.huesped_nombre) return alert("Nombre obligatorio")

    // Guardar/Actualizar Cliente primero
    let finalId = nuevaReserva.cliente_id
    const { data: cl } = await supabase.from('clientes').upsert({
      id: finalId || undefined,
      nombre: nuevaReserva.huesped_nombre.toUpperCase(),
      telefono: nuevaReserva.cliente_telefono,
      ciudad: nuevaReserva.cliente_ciudad
    }).select().single()
    finalId = cl?.id

    const datos: any = {
      habitacion_id: nuevaReserva.habitacion_id,
      cliente_id: finalId,
      huesped_nombre: nuevaReserva.huesped_nombre.toUpperCase(),
      fecha_entrada: nuevaReserva.fecha_entrada,
      fecha_salida: nuevaReserva.fecha_salida,
      num_personas: nuevaReserva.num_personas,
      precio_persona: nuevaReserva.precio_persona,
      valor_total: valorTotal,
      anticipo: nuevaReserva.anticipo,
      saldo_pendiente: saldoPendiente,
      forma_pago: nuevaReserva.forma_pago,
      observaciones: nuevaReserva.observaciones
    }

    let error;
    if (editandoId) {
      const { error: err } = await supabase.from('reservas').update(datos).eq('id', editandoId)
      error = err
    } else {
      const { error: err } = await supabase.from('reservas').insert([{ ...datos, color: `hsl(${Math.random() * 360}, 60%, 45%)` }])
      error = err
    }

    if (error) alert("Error: " + error.message)
    else { setMostrarModal(false); cargarDatos() }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <Link href="/dashboard" className="text-[10px] font-black uppercase bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">← Volver</Link>
        <h1 className="font-black italic uppercase text-xs text-blue-400">Sistema de Ocupación Cojimíes</h1>
        <input type="date" className="bg-gray-800 text-[10px] p-2 rounded text-white" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      <div className="flex-1 overflow-auto bg-white p-2">
        <table className="w-full border-collapse border shadow-sm">
          <thead>
            <tr className="bg-gray-100 uppercase text-[9px] font-black italic text-gray-500">
              <th className="sticky left-0 z-40 bg-gray-100 border p-4 min-w-[120px]">Habitación</th>
              {dias.map((dia, i) => (
                <th key={i} className="border p-2 min-w-[80px] text-center">
                  <span className="block text-[7px]">{dia.toLocaleDateString('es', { weekday: 'short' })}</span>
                  <span className="text-sm font-black">{dia.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map((hab) => (
              <tr key={hab.id}>
                <td className="sticky left-0 z-30 bg-white border p-4 font-black text-[10px] uppercase italic shadow-md">{hab.nombre}</td>
                {dias.map((dia, i) => {
                  const fStr = dia.toISOString().split('T')[0]
                  return (
                    <td 
                      key={i} 
                      onClick={() => {
                        const r = reservas.find(res => res.habitacion_id === hab.id && fStr >= res.fecha_entrada && fStr <= res.fecha_salida)
                        if (r) {
                          setEditandoId(r.id)
                          setNuevaReserva(r)
                        } else {
                          setEditandoId(null)
                          setNuevaReserva({
                            cliente_id: '', huesped_nombre: '', cliente_telefono: '', cliente_ciudad: '',
                            habitacion_id: hab.id, fecha_entrada: fStr, fecha_salida: fStr,
                            num_personas: 1, precio_persona: hab.precio_persona_noche || 0,
                            anticipo: 0, forma_pago: 'Efectivo', observaciones: ''
                          })
                        }
                        setMostrarModal(true)
                      }}
                      className="border h-16 cursor-pointer hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border-t-[15px] border-blue-600">
             
             <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <label className="text-[10px] font-black text-blue-500 uppercase block mb-1">Buscar Cliente Guardado</label>
                <select className="w-full p-2 bg-white border rounded-xl font-bold uppercase text-xs" 
                  onChange={(e) => seleccionarClienteExistente(e.target.value)} value={nuevaReserva.cliente_id}>
                  <option value="">-- CLIENTE NUEVO --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400">NOMBRE DEL HUÉSPED</label>
                  <input type="text" value={nuevaReserva.huesped_nombre} className="w-full p-3 border-2 rounded-xl font-black uppercase text-sm" onChange={e => setNuevaReserva({...nuevaReserva, huesped_nombre: e.target.value})} />
                </div>
                
                <input type="text" placeholder="TELÉFONO" value={nuevaReserva.cliente_telefono} className="p-3 border-2 rounded-xl font-bold" onChange={e => setNuevaReserva({...nuevaReserva, cliente_telefono: e.target.value})} />
                <input type="text" placeholder="CIUDAD" value={nuevaReserva.cliente_ciudad} className="p-3 border-2 rounded-xl font-bold uppercase" onChange={e => setNuevaReserva({...nuevaReserva, cliente_ciudad: e.target.value})} />

                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border">
                  <div><label className="text-[10px] font-black text-blue-600">ENTRADA</label><input type="date" value={nuevaReserva.fecha_entrada} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_entrada: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black text-red-600">SALIDA</label><input type="date" value={nuevaReserva.fecha_salida} className="w-full p-2 rounded-lg font-bold" onChange={e => setNuevaReserva({...nuevaReserva, fecha_salida: e.target.value})} /></div>
                </div>

                <div><label className="text-[10px] font-black uppercase text-gray-400">N° Personas</label><input type="number" value={nuevaReserva.num_personas} className="w-full p-3 border-2 rounded-xl font-bold" onChange={e => setNuevaReserva({...nuevaReserva, num_personas: parseInt(e.target.value) || 1})} /></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400">Precio p/p</label><input type="number" value={nuevaReserva.precio_persona} className="w-full p-3 border-2 rounded-xl font-bold" onChange={e => setNuevaReserva({...nuevaReserva, precio_persona: parseFloat(e.target.value) || 0})} /></div>

                <div className="md:col-span-2 bg-gray-900 text-white p-6 rounded-3xl flex justify-between">
                  <div><p className="text-[10px] opacity-50 uppercase font-black">Total</p><p className="text-4xl font-black italic">${valorTotal.toFixed(2)}</p></div>
                  <div className="text-right"><p className="text-[10px] opacity-50 uppercase font-black text-red-400">Saldo por Cobrar</p><p className="text-4xl font-black italic text-red-400">${saldoPendiente.toFixed(2)}</p></div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-green-600">Abono</label>
                  <input type="number" value={nuevaReserva.anticipo} className="w-full p-4 border-2 border-green-200 rounded-2xl font-black text-green-600 text-3xl" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase">Forma de Pago</label>
                  <select className="w-full p-4 border-2 rounded-2xl font-bold h-[76px]" value={nuevaReserva.forma_pago} onChange={e => setNuevaReserva({...nuevaReserva, forma_pago: e.target.value})}>
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                    <option>Deposito</option>
                    <option>Airbnb</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Observaciones</label>
                  <textarea value={nuevaReserva.observaciones} className="w-full p-3 border-2 rounded-xl font-medium text-sm h-20" onChange={e => setNuevaReserva({...nuevaReserva, observaciones: e.target.value})} />
                </div>
             </div>
             
             <div className="flex gap-4 mt-8">
                <button className="flex-1 bg-gray-100 p-5 rounded-[2rem] font-black uppercase text-xs" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button className="flex-1 bg-blue-600 text-white p-5 rounded-[2rem] font-black uppercase text-xs shadow-lg" onClick={guardarReserva}>Confirmar</button>
             </div>
          </div>
        </div>
      )}
    </main>
  )
}