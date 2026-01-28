'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function GestionHabitaciones() {
  // Según tu foto Bucket.JPG, el nombre es este:
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
    const { data } = await supabase.from('habitaciones').select('*').order('creado_at', { ascending: false })
    if (data) setHabitaciones(data)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)
    let urlPublica = ''

    if (file) {
      // Nombre de archivo limpio: marca de tiempo + nombre original sin espacios
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      
      const { data: storageData, error: uploadError } = await supabase.storage
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
      nombre,
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
      alert("¡Guardado correctamente!");
      setNombre(''); setPrecio(''); setCapacidad('1'); setFile(null); setEditandoId(null);
      cargarHabitaciones();
    }
    setSubiendo(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <nav className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="font-black text-blue-600 text-xs">← PANEL</Link>
        <h1 className="font-black uppercase italic text-gray-800 tracking-tighter">Habitaciones</h1>
        <div className="w-8"></div>
      </nav>

      <div className="p-4 max-w-xl mx-auto space-y-6">
        <form onSubmit={handleGuardar} className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-gray-100">
          <input type="text" placeholder="Nombre" value={nombre} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" onChange={(e) => setNombre(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Precio $" value={precio} className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-green-600" onChange={(e) => setPrecio(e.target.value)} required />
            <input type="number" placeholder="Capacidad" value={capacidad} className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-blue-600" onChange={(e) => setCapacidad(e.target.value)} required />
          </div>
          <div className="border-2 border-dashed border-gray-200 p-6 rounded-3xl text-center bg-gray-50">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[10px] w-full" />
          </div>
          <button disabled={subiendo} className="w-full bg-blue-600 p-4 rounded-2xl font-black text-white shadow-lg uppercase text-xs">
            {subiendo ? 'Subiendo...' : 'Publicar Habitación'}
          </button>
        </form>

        <div className="space-y-4">
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
                <p className="text-green-600 font-black text-sm">${hab.precio_persona_noche}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => {setEditandoId(hab.id); setNombre(hab.nombre); setPrecio(hab.precio_persona_noche); setCapacidad(hab.capacidad)}} className="text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl uppercase">Editar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}