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

  const dias = Array.from({ length: 35 }, (_, i) => {
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

  const calcularNoches = () => {
    if (!nuevaReserva.fecha_entrada || !nuevaReserva.fecha_salida) return 1
    const inicio = new Date(nuevaReserva.fecha_entrada)
    const fin = new Date(nuevaReserva.fecha_salida)
    const diff = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return diff < 1 ? 1 : diff
  }

  const valorTotal = nuevaReserva.num_personas * nuevaReserva.precio_persona * calcularNoches()
  const saldoPendiente = valorTotal - nuevaReserva.anticipo

  // --- WHATSAPP CORREGIDO ---
  const enviarWhatsApp = () => {
    if (!nuevaReserva.cliente_telefono) return alert("Falta el número de teléfono");

    const habNombre = habitaciones.find(h => h.id === nuevaReserva.habitacion_id)?.nombre || 'Habitación'
    const separador = "---------------------------\n"
    
    const mensaje = `*RESUMEN DE RESERVA - HOTEL LA POSADA DE FRANK*\n` +
      separador +
      `*Cliente:* ${nuevaReserva.huesped_nombre.toUpperCase()}\n` +
      separador +
      `*Habitación:* ${habNombre}\n` +
      separador +
      `*Desde:* ${nuevaReserva.fecha_entrada}\n` +
      separador +
      `*Hasta:* ${nuevaReserva.fecha_salida}\n` +
      separador +
      `*Valor Total:* $${valorTotal.toFixed(2)}\n` +
      separador +
      `*Anticipo:* $${nuevaReserva.anticipo.toFixed(2)}\n` +
      separador +
      `*Saldo Pendiente:* $${saldoPendiente.toFixed(2)}\n` +
      separador + `\n` +
      `*IMPORTANTE:* Check-in: 12:00 PM | Check-out: 12:00 PM.`;

    const telLimpio = nuevaReserva.cliente_telefono.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  // --- FUNCIÓN ANULAR ---
  const anularReserva = async () => {
    if (!editandoId) return;
    if (confirm("¿ESTÁS SEGURO DE ANULAR ESTA RESERVA? Esta acción no se puede deshacer.")) {
      const { error } = await supabase.from('reservas').delete().eq('id', editandoId)
      if (error) alert(error.message)
      else {
        setMostrarModal(false)
        cargarDatos()
      }
    }
  }

  const RenderizarCelda = (habId: string, fechaStr: string) => {
    const rDelDia = reservas.filter(r => r.habitacion_id === habId && fechaStr >= r.fecha_entrada && fechaStr <= r.fecha_salida)
    if (rDelDia.length === 0) return <td onClick={() => abrirModalNueva(habId, fechaStr)} className="border h-14 cursor-pointer hover:bg-gray-50 transition-colors" />

    const saliendo = rDelDia.find(r => r.fecha_salida === fechaStr)
    const entrando = rDelDia.find(r => r.fecha_entrada === fechaStr)
    const ocupadoTotal = rDelDia.find(r => fechaStr > r.fecha_entrada && fechaStr < r.fecha_salida)

    const colorSaliendo = saliendo?.color || '#3b82f6'
    const colorEntrando = entrando?.color || '#10b981'

    let backgroundStyle = {}
    if (saliendo && entrando) backgroundStyle = { background: `linear-gradient(to top right, ${colorSaliendo} 50%, ${colorEntrando} 50%)` }
    else if (saliendo) backgroundStyle = { background: `linear-gradient(to top right, ${colorSaliendo} 50%, transparent 50%)` }
    else if (entrando) backgroundStyle = { background: `linear-gradient(to top right, transparent 50%, ${colorEntrando} 50%)` }
    else if (ocupadoTotal) backgroundStyle = { backgroundColor: ocupadoTotal.color }

    return (
      <td className="border h-14 p-0 relative cursor-pointer overflow-hidden text-[6px] font-bold uppercase italic leading-tight" style={backgroundStyle}>
        {saliendo && (
          <div className="absolute bottom-0.5 left-0.5 text-white drop-shadow-md z-10" onClick={(e) => { e.stopPropagation(); abrirModalEditar(saliendo); }}>
            {saliendo.huesped_nombre.split(' ')[0]}
          </div>
        )}
        {entrando && (
          <div className="absolute top-0.5 right-0.5 text-white drop-shadow-md z-10 text-right" onClick={(e) => { e.stopPropagation(); abrirModalEditar(entrando); }}>
            {entrando.huesped_nombre.split(' ')[0]}
          </div>
        )}
        {ocupadoTotal && !saliendo && !entrando && (
          <div className="flex items-center justify-center h-full text-white p-0.5 text-center text-[7px]" onClick={() => abrirModalEditar(ocupadoTotal)}>
            {ocupadoTotal.huesped_nombre}
          </div>
        )}
        {!ocupadoTotal && <div className="h-full w-full" onClick={() => abrirModalNueva(habId, fechaStr)} />}
      </td>
    )
  }

  const abrirModalNueva = (habId: string, fStr: string) => {
    setEditandoId(null)
    setNuevaReserva({
      cliente_id: '', huesped_nombre: '', cliente_telefono: '', cliente_ciudad: '',
      habitacion_id: habId, fecha_entrada: fStr, fecha_salida: fStr,
      num_personas: 1, precio_persona: 0, anticipo: 0, forma_pago: 'Efectivo', observaciones: ''
    })
    setMostrarModal(true)
  }

  const abrirModalEditar = (reserva: any) => {
    setEditandoId(reserva.id)
    setNuevaReserva(reserva)
    setMostrarModal(true)
  }

  const guardarReserva = async () => {
    if (!nuevaReserva.huesped_nombre) return alert("Nombre obligatorio")
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

    if (editandoId) {
      await supabase.from('reservas').update(datos).eq('id', editandoId)
    } else {
      await supabase.from('reservas').insert([{ ...datos, color: `hsl(${Math.random() * 360}, 60%, 45%)` }])
    }
    setMostrarModal(false)
    cargarDatos()
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-gray-900 text-white p-3 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <Link href="/dashboard" className="text-[9px] font-black uppercase bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">←</Link>
        <h1 className="font-black italic uppercase text-[10px] text-blue-400 tracking-tighter">LA POSADA DE FRANK</h1>
        <input type="date" className="bg-gray-800 text-[10px] p-1.5 rounded text-white outline-none" onChange={(e) => setFechaBase(new Date(e.target.value))} />
      </nav>

      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse table-fixed min-w-[1200px]">
          <thead>
            <tr className="bg-gray-800 text-white text-[10px] font-bold">
              <th className="sticky left-0 z-50 bg-gray-900 border-r border-gray-700 w-[70px]"></th>
              {dias.map((dia, i) => {
                const mostrarMes = i === 0 || dia.getDate() === 1;
                return (
                  <th key={i} className="border-r border-gray-700 py-1 px-1 text-center bg-gray-800">
                    {mostrarMes ? dia.toLocaleDateString('es', { month: 'short', year: '2-digit' }).toUpperCase() : ""}
                  </th>
                )
              })}
            </tr>
            <tr className="bg-gray-100 uppercase text-[9px] font-black text-gray-500 shadow-sm">
              <th className="sticky left-0 z-40 bg-gray-100 border p-2 w-[70px]">Hab.</th>
              {dias.map((dia, i) => (
                <th key={i} className="border p-1 w-[60px] text-center">
                  <span className="block text-[8px] text-blue-600">{dia.toLocaleDateString('es', { weekday: 'short' })}</span>
                  <span className="text-sm font-black text-gray-900">{dia.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitaciones.map((hab) => (
              <tr key={hab.id} className="hover:bg-gray-50">
                <td className="sticky left-0 z-30 bg-white border p-2 font-black text-[11px] uppercase italic shadow-md w-[70px] truncate">{hab.nombre}</td>
                {dias.map((dia, i) => RenderizarCelda(hab.id, dia.toISOString().split('T')[0]))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto border-t-[10px] border-blue-600">
             <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <label className="text-[9px] font-black text-blue-500 uppercase block mb-1">Cliente</label>
                <select className="w-full p-2 bg-white border rounded-lg font-bold uppercase text-[11px]" onChange={(e) => seleccionarClienteExistente(e.target.value)} value={nuevaReserva.cliente_id}>
                  <option value="">-- NUEVO --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Huésped</label>
                  <input type="text" value={nuevaReserva.huesped_nombre} className="w-full p-2 border rounded-lg font-black uppercase text-xs" onChange={e => setNuevaReserva({...nuevaReserva, huesped_nombre: e.target.value})} />
                </div>
                
                <input type="text" placeholder="WhatsApp" value={nuevaReserva.cliente_telefono} className="p-2 border rounded-lg font-bold text-xs" onChange={e => setNuevaReserva({...nuevaReserva, cliente_telefono: e.target.value})} />
                <input type="text" placeholder="Ciudad" value={nuevaReserva.cliente_ciudad} className="p-2 border rounded-lg font-bold uppercase text-xs" onChange={e => setNuevaReserva({...nuevaReserva, cliente_ciudad: e.target.value})} />

                <div className="md:col-span-2 grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border">
                  <div><label className="text-[9px] font-black text-blue-600">Entrada</label><input type="date" value={nuevaReserva.fecha_entrada} className="w-full p-1.5 rounded border font-bold text-xs" onChange={e => setNuevaReserva({...nuevaReserva, fecha_entrada: e.target.value})} /></div>
                  <div><label className="text-[9px] font-black text-red-600">Salida</label><input type="date" value={nuevaReserva.fecha_salida} className="w-full p-1.5 rounded border font-bold text-xs" onChange={e => setNuevaReserva({...nuevaReserva, fecha_salida: e.target.value})} /></div>
                </div>

                <div><label className="text-[9px] font-black text-gray-400">Personas</label><input type="number" value={nuevaReserva.num_personas} className="w-full p-2 border rounded-lg font-bold text-xs" onChange={e => setNuevaReserva({...nuevaReserva, num_personas: parseInt(e.target.value) || 1})} /></div>
                <div><label className="text-[9px] font-black text-gray-400">Precio p/p</label><input type="number" value={nuevaReserva.precio_persona} className="w-full p-2 border rounded-lg font-bold text-xs" onChange={e => setNuevaReserva({...nuevaReserva, precio_persona: parseFloat(e.target.value) || 0})} /></div>

                <div className="md:col-span-2 bg-gray-900 text-white p-4 rounded-2xl flex justify-between items-center">
                  <div><p className="text-[8px] opacity-50 uppercase font-black text-blue-400">Total</p><p className="text-2xl font-black italic">${valorTotal.toFixed(2)}</p></div>
                  <div className="text-right"><p className="text-[8px] opacity-50 uppercase font-black text-red-400">Saldo</p><p className="text-2xl font-black italic text-red-400">${saldoPendiente.toFixed(2)}</p></div>
                </div>

                <div><label className="text-[9px] font-black text-green-600 uppercase">Anticipo</label><input type="number" value={nuevaReserva.anticipo} className="w-full p-2 border-2 border-green-100 rounded-lg font-black text-green-600" onChange={e => setNuevaReserva({...nuevaReserva, anticipo: parseFloat(e.target.value) || 0})} /></div>
                <div>
                  <label className="text-[9px] font-black uppercase">Forma</label>
                  <select className="w-full p-2 border rounded-lg font-bold text-xs h-[46px]" value={nuevaReserva.forma_pago} onChange={e => setNuevaReserva({...nuevaReserva, forma_pago: e.target.value})}>
                    <option>Efectivo</option><option>Transferencia</option><option>Airbnb</option>
                  </select>
                </div>
                <div className="md:col-span-2"><textarea placeholder="Observaciones" value={nuevaReserva.observaciones} className="w-full p-2 border rounded-lg font-medium text-[11px] h-16" onChange={e => setNuevaReserva({...nuevaReserva, observaciones: e.target.value})} /></div>
             </div>
             
             <div className="flex flex-col gap-3 mt-6">
                <button onClick={enviarWhatsApp} type="button" className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-black uppercase text-[11px] shadow-lg flex items-center justify-center gap-2">
                  <span className="text-xl">💬</span> WhatsApp
                </button>
                
                <div className="flex gap-2">
                  {editandoId && (
                    <button onClick={anularReserva} className="flex-1 bg-red-100 text-red-600 p-3 rounded-xl font-black uppercase text-[10px] border border-red-200">Anular</button>
                  )}
                  <button className="flex-1 bg-gray-100 p-3 rounded-xl font-black uppercase text-[10px]" onClick={() => setMostrarModal(false)}>Cerrar</button>
                  <button className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-black uppercase text-[10px] shadow-lg" onClick={guardarReserva}>Guardar</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </main>
  )
}