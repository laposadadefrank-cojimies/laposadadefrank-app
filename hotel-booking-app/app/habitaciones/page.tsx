'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function GestionHabitaciones() {
  const BUCKET_NAME = 'fotos-habitaciones'; 

  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [capacidad, setCapacidad] = useState('1')
  const [file, setFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  useEffect(() => { cargarHabitaciones() }, [])

  async function cargarHabitaciones() {
    const { data } = await supabase.from('habitaciones').select('*').order('nombre', { ascending: true })
    if (data) setHabitaciones(data)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)
    let urlPublica = ''

    if (file) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file)

      if (uploadError) {
        alert("FALLO DE SUBIDA: " + uploadError.message);
        setSubiendo(false);
        return;
      }

      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
      urlPublica = urlData.publicUrl
    }

    const datos: any = {
      nombre: nombre.toUpperCase(),
      precio_persona_noche: parseFloat(precio),
      capacidad: parseInt(capacidad)
    }
    if (urlPublica) datos.foto_url = urlPublica

    const { error: dbError } = editandoId 
      ? await supabase.from('habitaciones').update(datos).eq('id', editandoId)
      : await supabase.from('habitaciones').insert([datos])

    if (dbError) {
      alert("Error en DB: " + dbError.message)
    } else {
      alert(editandoId ? "¡Habitación actualizada!" : "¡Habitación creada!");
      cancelarEdicion();
      cargarHabitaciones();
    }
    setSubiendo(false)
  }

  const eliminarHabitacion = async (id: string, nombreHab: string) => {
    if (confirm(`¿Estás seguro de eliminar la habitación ${nombreHab}?`)) {
      const { error } = await supabase.from('habitaciones').delete().eq('id', id)
      if (error) alert("Error al eliminar: " + error.message)
      else cargarHabitaciones()
    }
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setNombre('')
    setPrecio('')
    setCapacidad('1')
    setFile(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <nav className="bg-gray-900 p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="bg-gray-800 text-white px-3 py-1.5 rounded-lg font-black text-[10px] border border-gray-700">← PANEL</Link>
        <h1 className="font-black uppercase italic text-blue-400 tracking-tighter text-sm">Hotel La Posada de Frank</h1>
        <div className="w-8"></div>
      </nav>

      <div className="p-4 max-w-xl mx-auto space-y-6">
        <form onSubmit={handleGuardar} className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-gray-100">
          <h2 className="text-[10px] font-black uppercase text-gray-400 mb-2">
            {editandoId ? '📝 Editando Habitación' : '✨ Nueva Habitación'}
          </h2>
          <input type="text" placeholder="Nombre (Ej: Suite 101)" value={nombre} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold uppercase" onChange={(e) => setNombre(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black ml-2 uppercase text-gray-400">Precio p/p</label>
              <input type="number" placeholder="Precio $" value={precio} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-green-600" onChange={(e) => setPrecio(e.target.value)} required />
            </div>
            <div>
              <label className="text-[9px] font-black ml-2 uppercase text-gray-400">Capacidad</label>
              <input type="number" placeholder="Personas" value={capacidad} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-blue-600" onChange={(e) => setCapacidad(e.target.value)} required />
            </div>
          </div>
          <div className="border-2 border-dashed border-gray-200 p-6 rounded-3xl text-center bg-gray-50">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[10px] w-full" />
            <p className="text-[8px] text-gray-400 mt-2 uppercase font-bold italic">Opcional: Subir nueva foto</p>
          </div>
          
          <div className="flex gap-2">
            {editandoId && (
              <button type="button" onClick={cancelarEdicion} className="flex-1 bg-gray-200 p-4 rounded-2xl font-black text-gray-600 uppercase text-[10px]">
                Cancelar
              </button>
            )}
            <button disabled={subiendo} className={`flex-[2] ${editandoId ? 'bg-orange-500' : 'bg-blue-600'} p-4 rounded-2xl font-black text-white shadow-lg uppercase text-[10px]`}>
              {subiendo ? 'Procesando...' : editandoId ? 'Actualizar Cambios' : 'Publicar Habitación'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-gray-400 ml-2 italic">Lista de Habitaciones</h3>
          {habitaciones.map((hab) => (
            <div key={hab.id} className="bg-white p-3 rounded-[2rem] shadow-sm flex items-center gap-4 border border-gray-50">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                {hab.foto_url ? (
                  <img src={hab.foto_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-300">SIN FOTO</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xs uppercase text-gray-700">{hab.nombre}</h3>
                <p className="text-green-600 font-black text-sm">${hab.precio_persona_noche} <span className="text-gray-400 text-[9px] font-normal italic">/ noche</span></p>
                <p className="text-blue-500 font-bold text-[9px] uppercase">Capacidad: {hab.capacidad} pers.</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => {setEditandoId(hab.id); setNombre(hab.nombre); setPrecio(hab.precio_persona_noche.toString()); setCapacidad(hab.capacidad.toString())}} className="text-[8px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl uppercase border border-blue-100">Editar</button>
                  <button onClick={() => eliminarHabitacion(hab.id, hab.nombre)} className="text-[8px] font-black text-red-600 bg-red-50 px-4 py-2 rounded-xl uppercase border border-red-100">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}