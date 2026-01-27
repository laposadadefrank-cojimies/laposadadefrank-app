'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function GestionHabitaciones() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [capacidad, setCapacidad] = useState('1') // Estado para la capacidad
  const [file, setFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    cargarHabitaciones()
  }, [])

  async function cargarHabitaciones() {
    const { data } = await supabase.from('habitaciones').select('*').order('creado_at', { ascending: false })
    if (data) setHabitaciones(data)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)

    let urlPublica = ''

    if (file) {
      const fileName = `${Date.now()}-${file.name}`
      const { data } = await supabase.storage.from('fotos-habitaciones').upload(fileName, file)
      if (data) {
        const { data: dataUrl } = supabase.storage.from('fotos-habitaciones').getPublicUrl(fileName)
        urlPublica = dataUrl.publicUrl
      }
    }

    const { error } = await supabase.from('habitaciones').insert([
      { 
        nombre, 
        precio_persona_noche: parseFloat(precio), 
        capacidad: parseInt(capacidad), // Guardamos la capacidad
        foto_url: urlPublica 
      }
    ])

    if (!error) {
      setNombre(''); setPrecio(''); setCapacidad('1'); setFile(null);
      cargarHabitaciones()
      alert("¡Habitación guardada con éxito!")
    }
    setSubiendo(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <nav className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <Link href="/dashboard" className="text-blue-600 font-bold text-sm">← PANEL</Link>
        <h1 className="font-black text-gray-800 uppercase tracking-tighter text-lg">Habitaciones</h1>
        <div className="w-10"></div>
      </nav>

      <div className="p-4 max-w-xl mx-auto space-y-6">
        {/* FORMULARIO */}
        <form onSubmit={handleGuardar} className="bg-white p-6 rounded-3xl shadow-xl space-y-4 border border-gray-100">
          <h2 className="text-sm font-black text-blue-900 uppercase tracking-widest">Nueva Habitación</h2>
          
          <input type="text" placeholder="Nombre (Ej: Suite 105)" value={nombre}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setNombre(e.target.value)} required />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 ml-2 uppercase">Precio x Persona</label>
              <input type="number" placeholder="$" value={precio}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 outline-none"
                onChange={(e) => setPrecio(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 ml-2 uppercase">Capacidad (Pers)</label>
              <input type="number" placeholder="Ej: 2" value={capacidad}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 outline-none"
                onChange={(e) => setCapacidad(e.target.value)} required />
            </div>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <span className="text-xs font-bold text-gray-400">{file ? file.name : "Subir Foto"}</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>

          <button disabled={subiendo} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">
            {subiendo ? 'GUARDANDO...' : 'PUBLICAR'}
          </button>
        </form>

        {/* LISTADO */}
        <div className="grid grid-cols-1 gap-4">
          {habitaciones.map((hab) => (
            <div key={hab.id} className="bg-white rounded-3xl overflow-hidden shadow-sm flex items-center p-3 border border-gray-100">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                {hab.foto_url ? <img src={hab.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300">N/A</div>}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-black text-gray-800 uppercase text-xs">{hab.nombre}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-green-600 font-black text-base">${hab.precio_persona_noche}</span>
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg font-bold text-gray-500">Cap: {hab.capacidad} pers</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}