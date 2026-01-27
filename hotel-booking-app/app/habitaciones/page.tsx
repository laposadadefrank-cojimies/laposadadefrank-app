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
    setNombre(''); setPrecio(''); setCapacidad('1'); setFile(null)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)

    let urlPublica = ''

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      // IMPORTANTE: Verifica que en Supabase el nombre sea 'fotos-habitaciones'
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('fotos-habitaciones')
        .upload(fileName, file)

      if (uploadError) {
        alert("Error de Subida: " + uploadError.message + ". Verifica que el bucket se llame 'fotos-habitaciones' en minúsculas.")
        setSubiendo(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('fotos-habitaciones')
        .getPublicUrl(fileName)
      
      urlPublica = urlData.publicUrl
    }

    const datos: any = {
      nombre,
      precio_persona_noche: parseFloat(precio),
      capacidad: parseInt(capacidad)
    }
    
    if (urlPublica) datos.foto_url = urlPublica

    const { error: dbError } = editandoId 
      ? await supabase.from('habitaciones').update(datos).eq('id', editandoId)
      : await supabase.from('habitaciones').insert([datos])

    if (dbError) {
      alert("Error en Base de Datos: " + dbError.message)
    } else {
      alert(editandoId ? "✅ Habitación actualizada" : "✅ Habitación creada")
      cancelarEdicion()
      cargarHabitaciones()
    }

    setSubiendo(false)
  }

  const eliminarHabitacion = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta habitación?")) {
      const { error } = await supabase.from('habitaciones').delete().eq('id', id)
      if (!error) cargarHabitaciones()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <nav className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <Link href="/dashboard" className="text-blue-600 font-bold text-sm">← PANEL</Link>
        <h1 className="font-black text-gray-800 uppercase text-lg italic">Habitaciones</h1>
        <div className="w-10"></div>
      </nav>

      <div className="p-4 max-w-xl mx-auto space-y-6">
        {/* FORMULARIO */}
        <form onSubmit={handleGuardar} className={`p-6 rounded-3xl shadow-xl space-y-4 border-2 transition-all ${editandoId ? 'border-orange-400 bg-orange-50' : 'border-transparent bg-white'}`}>
          <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">
            {editandoId ? '📝 Editando Habitación' : '🆕 Nueva Habitación'}
          </h2>
          
          <input 
            type="text" 
            placeholder="Nombre de la habitación" 
            value={nombre} 
            className="w-full p-4 bg-white rounded-2xl border outline-none font-bold" 
            onChange={(e) => setNombre(e.target.value)} 
            required 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">Precio $</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={precio} 
                className="w-full p-4 bg-white rounded-2xl border outline-none font-bold text-green-600" 
                onChange={(e) => setPrecio(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">Capacidad</label>
              <input 
                type="number" 
                value={capacidad} 
                className="w-full p-4 bg-white rounded-2xl border outline-none font-bold text-blue-600" 
                onChange={(e) => setCapacidad(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Foto de la habitación</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="text-[10px] w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700" 
            />
          </div>

          <button 
            disabled={subiendo} 
            className={`w-full p-4 rounded-2xl font-black text-white shadow-lg uppercase tracking-widest text-xs transition-all active:scale-95 ${editandoId ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}
          >
            {subiendo ? 'Guardando...' : editandoId ? 'Guardar Cambios' : 'Publicar Habitación'}
          </button>
        </form>

        {/* LISTADO */}
        <div className="grid grid-cols-1 gap-4">
          {habitaciones.map((hab) => (
            <div key={hab.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm flex items-center p-3 border border-gray-100">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                {hab.foto_url ? (
                  <img 
                    src={hab.foto_url} 
                    className="w-full h-full object-cover" 
                    alt="vista previa" 
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/200x200?text=Error+Imagen')} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 font-bold uppercase text-center p-2 italic">Sin imagen</div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-black text-gray-800 uppercase text-[11px] leading-tight mb-1">{hab.nombre}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-black text-sm">${hab.precio_persona_noche}</span>
                  <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase">Cap: {hab.capacidad}p</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => prepararEdicion(hab)} 
                    className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-2 rounded-xl active:bg-blue-100"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => eliminarHabitacion(hab.id)} 
                    className="text-[9px] font-black text-red-500 uppercase bg-red-50 px-4 py-2 rounded-xl active:bg-red-100"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}