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

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)

    let urlPublica = ''

    if (file) {
      const fileName = `${Date.now()}-${file.name}`
      // Subir a Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('fotos-habitaciones')
        .upload(fileName, file)

      if (storageData) {
        // CORRECCIÓN: Obtener la URL pública correctamente
        const { data } = supabase.storage
          .from('fotos-habitaciones')
          .getPublicUrl(fileName)
        urlPublica = data.publicUrl
      }
    }

    const { error } = await supabase.from('habitaciones').insert([
      { 
        nombre, 
        precio_persona_noche: parseFloat(precio), 
        capacidad: parseInt(capacidad),
        foto_url: urlPublica 
      }
    ])

    if (!error) {
      setNombre(''); setPrecio(''); setCapacidad('1'); setFile(null);
      cargarHabitaciones()
      alert("Habitación guardada")
    }
    setSubiendo(false)
  }

  const eliminarHabitacion = async (id: string, fotoUrl: string) => {
    if (confirm("¿Estás seguro de eliminar esta habitación?")) {
      // 1. Eliminar de la base de datos
      const { error } = await supabase.from('habitaciones').delete().eq('id', id)
      
      // 2. Intentar borrar la foto del storage si existe
      if (fotoUrl) {
        const path = fotoUrl.split('/').pop()
        if (path) await supabase.storage.from('fotos-habitaciones').remove([path])
      }

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
        <form onSubmit={handleGuardar} className="bg-white p-6 rounded-3xl shadow-xl space-y-4 border border-gray-100">
          <h2 className="text-sm font-black text-blue-900 uppercase">Nueva Habitación</h2>
          <input type="text" placeholder="Nombre" value={nombre} className="w-full p-4 bg-gray-50 rounded-2xl outline-none" onChange={(e) => setNombre(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Precio $" value={precio} className="w-full p-4 bg-gray-50 rounded-2xl outline-none" onChange={(e) => setPrecio(e.target.value)} required />
            <input type="number" placeholder="Capacidad" value={capacidad} className="w-full p-4 bg-gray-50 rounded-2xl outline-none" onChange={(e) => setCapacidad(e.target.value)} required />
          </div>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs" />
          <button disabled={subiendo} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg">
            {subiendo ? 'GUARDANDO...' : 'PUBLICAR'}
          </button>
        </form>

        {/* LISTADO CON ELIMINAR */}
        <div className="grid grid-cols-1 gap-4">
          {habitaciones.map((hab) => (
            <div key={hab.id} className="bg-white rounded-3xl overflow-hidden shadow-sm flex items-center p-3 border border-gray-100 relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                {hab.foto_url ? (
                  <img src={hab.foto_url} className="w-full h-full object-cover" alt="hab" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">SIN FOTO</div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-black text-gray-800 uppercase text-xs">{hab.nombre}</h3>
                <p className="text-green-600 font-black">${hab.precio_persona_noche}</p>
                <p className="text-[10px] text-gray-400">Capacidad: {hab.capacidad} pers.</p>
              </div>
              <button 
                onClick={() => eliminarHabitacion(hab.id, hab.foto_url)}
                className="bg-red-50 text-red-500 p-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
              >
                BORRAR
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}