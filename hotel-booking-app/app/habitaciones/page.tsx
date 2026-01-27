'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function GestionHabitaciones() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [capacidad, setCapacidad] = useState('1')
  const [file, setFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  useEffect(() => {
    cargarHabitaciones()
  }, [])

  async function cargarHabitaciones() {
    const { data } = await supabase
      .from('habitaciones')
      .select('*')
      .order('creado_at', { ascending: false })
    if (data) setHabitaciones(data)
  }

  const prepararEdicion = (hab: any) => {
    setEditandoId(hab.id)
    setNombre(hab.nombre)
    setPrecio(hab.precio_persona_noche.toString())
    setCapacidad(hab.capacidad.toString())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setNombre('')
    setPrecio('')
    setCapacidad('1')
    setFile(null)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)

    let urlPublica = ''

    if (file) {
      // Limpiamos el nombre del archivo para evitar errores por caracteres especiales
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      // IMPORTANTE: El nombre del bucket debe coincidir exactamente con Supabase: FOTOS-HABITACIONES
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('FOTOS-HABITACIONES')
        .upload(fileName, file)

      if (uploadError) {
        console.error("Error subiendo archivo:", uploadError.message)
      } else if (storageData) {
        const { data } = supabase.storage
          .from('FOTOS-HABITACIONES')
          .getPublicUrl(fileName)
        urlPublica = data.publicUrl
      }
    }

    const datos: any = {
      nombre,
      precio_persona_noche: parseFloat(precio),
      capacidad: parseInt(capacidad)
    }
    
    // Solo actualizamos la foto si realmente se subió una nueva
    if (urlPublica) datos.foto_url = urlPublica

    if (editandoId) {
      const { error } = await supabase.from('habitaciones').update(datos).eq('id', editandoId)
      if (!error) alert("¡Habitación actualizada!")
    } else {
      const { error } = await supabase.from('habitaciones').insert([datos])
      if (!error) alert("¡Habitación creada!")
    }

    setSubiendo(false)
    cancelarEdicion()
    cargarHabitaciones()
  }

  const eliminarHabitacion = async (id: string) => {
    if (confirm("¿Eliminar esta habitación?")) {
      const { error } = await supabase.from('habitaciones').delete().eq('id', id)
      if (!error) cargarHabitaciones()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <nav className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <Link href="/dashboard" className="text-blue-600 font-bold text-sm">← PANEL</Link>
        <h1 className="font-black text-gray-800 uppercase text-lg">Habitaciones</h1>
        <div className="w-10"></div>
      </nav>

      <div className="p-4 max-w-xl mx-auto space-y-6">
        {/* FORMULARIO */}
        <form onSubmit={handleGuardar} className={`p-6 rounded-3xl shadow-xl space-y-4 border-2 transition-all ${editandoId ? 'border-orange-400 bg-orange-50' : 'border-transparent bg-white'}`}>
          <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">
            {editandoId ? '📝 Editando Habitación' : '🆕 Nueva Habitación'}
          </h2>
          
          <input type="text" placeholder="Nombre de habitación" value={nombre} className="w-full p-4 bg-white rounded-2xl border outline-none font-bold" onChange={(e) => setNombre(e.target.value)} required />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">Precio $</label>
               <input type="number" placeholder="0.00" value={precio} className="w-full p-4 bg-white rounded-2xl border outline-none font-bold" onChange={(e) => setPrecio(e.target.value)} required />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">Capacidad</label>
               <input type="number" value={capacidad} className="w-full p-4 bg-white rounded-2xl border outline-none font-bold" onChange={(e) => setCapacidad(e.target.value)} required />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-dashed border-gray-300">
            <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase text-center">Seleccionar Foto</p>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs w-full" />
          </div>

          <div className="flex gap-2">
            {editandoId && (
              <button type="button" onClick={cancelarEdicion} className="flex-1 bg-gray-400 text-white p-4 rounded-2xl font-black uppercase text-xs">Cancelar</button>
            )}
            <button disabled={subiendo} className={`flex-[2] p-4 rounded-2xl font-black text-white shadow-lg transition-all ${editandoId ? 'bg-orange-500' : 'bg-blue-600'}`}>
              {subiendo ? 'GUARDANDO...' : editandoId ? 'GUARDAR CAMBIOS' : 'PUBLICAR HABITACIÓN'}
            </button>
          </div>
        </form>

        {/* LISTADO */}
        <div className="space-y-4">
          {habitaciones.map((hab) => (
            <div key={hab.id} className="bg-white rounded-3xl overflow-hidden shadow-sm flex items-center p-3 border border-gray-100">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                {hab.foto_url ? (
                  <img src={hab.foto_url} className="w-full h-full object-cover" alt="hab" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Error+Foto' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase text-center p-2">Sin Foto</div>
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <h3 className="font-black text-gray-800 uppercase text-xs tracking-tight">{hab.nombre}</h3>
                <div className="flex gap-3 mt-1 items-center">
                  <span className="text-green-600 font-black text-sm">${hab.precio_persona_noche}</span>
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Cap: {hab.capacidad}p</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button onClick={() => prepararEdicion(hab)} className="text-[10px] font-black text-blue-600 uppercase border border-blue-600 px-4 py-1.5 rounded-xl active:bg-blue-50">Editar</button>
                  <button onClick={() => eliminarHabitacion(hab.id)} className="text-[10px] font-black text-red-500 uppercase border border-red-100 px-4 py-1.5 rounded-xl active:bg-red-50">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}