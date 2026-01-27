'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function PaginaHabitaciones() {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  const guardarTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)

    let urlPublica = ''

    // 1. Subir imagen si existe
    if (file) {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error: errorSubida } = await supabase.storage
        .from('fotos-habitaciones')
        .upload(fileName, file)

      if (data) {
        const { data: dataUrl } = supabase.storage
          .from('fotos-habitaciones')
          .getPublicUrl(fileName)
        urlPublica = dataUrl.publicUrl
      }
    }

    // 2. Guardar en la base de datos
    const { error } = await supabase.from('habitaciones').insert([
      { 
        nombre, 
        precio_persona_noche: parseFloat(precio), 
        foto_url: urlPublica 
      }
    ])

    setSubiendo(false)
    if (error) alert("Error al guardar datos")
    else alert("Habitación creada con éxito")
  }

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow-2xl rounded-3xl mt-10 border-t-4 border-green-600">
      <Link href="/dashboard" className="text-gray-400 hover:text-black mb-4 inline-block">← Volver al panel</Link>
      <h1 className="text-2xl font-black mb-6 uppercase">Nueva Habitación</h1>
      
      <form onSubmit={guardarTodo} className="space-y-5">
        <input type="text" placeholder="Nombre (Ej: Suite Matrimonial)" className="w-full p-3 border rounded-xl"
          onChange={(e) => setNombre(e.target.value)} required />
        
        <input type="number" placeholder="Precio por persona/noche" className="w-full p-3 border rounded-xl"
          onChange={(e) => setPrecio(e.target.value)} required />
        
        <div className="border-2 border-dashed p-4 rounded-xl text-center">
          <label className="block text-sm text-gray-500 mb-2">Foto de la habitación</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <button disabled={subiendo} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold">
          {subiendo ? 'GUARDANDO...' : 'PUBLICAR HABITACIÓN'}
        </button>
      </form>
    </div>
  )
}