'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function PaginaHabitaciones() {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [mensaje, setMensaje] = useState('')

  const guardarHabitacion = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('habitaciones')
      .insert([{ nombre, precio_persona_noche: parseFloat(precio) }])

    if (error) setMensaje("Error al guardar")
    else setMensaje("¡Habitación guardada con éxito!")
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Link href="/dashboard" className="text-blue-600 underline">← Volver</Link>
      <h1 className="text-2xl font-bold my-4">Gestión de Habitaciones</h1>
      
      <form onSubmit={guardarHabitacion} className="bg-white p-6 rounded-xl shadow-md max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium">Nombre de Habitación</label>
          <input type="text" className="w-full border p-2 rounded" placeholder="Ej: Suite 101" 
            onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Precio por Persona/Noche ($)</label>
          <input type="number" className="w-full border p-2 rounded" placeholder="0.00" 
            onChange={(e) => setPrecio(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Foto de Habitación</label>
          <input type="file" className="w-full text-sm" accept="image/*" />
        </div>
        <button className="w-full bg-green-600 text-white p-2 rounded font-bold">GUARDAR HABITACIÓN</button>
        {mensaje && <p className="mt-4 text-green-600">{mensaje}</p>}
      </form>
    </div>
  )
}