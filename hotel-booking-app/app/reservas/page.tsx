'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function PaginaReservas() {
  const [reservas, setReservas] = useState<any[]>([])

  useEffect(() => {
    async function leer() {
      const { data } = await supabase.from('reservas').select('*')
      if (data) setReservas(data)
    }
    leer()
  }, [])

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <Link href="/dashboard" className="text-blue-600 underline">← Volver</Link>
      <h1 className="text-3xl font-black my-6">CALENDARIO DE OCUPACIÓN</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reservas.length > 0 ? reservas.map(res => (
          <div key={res.id} className="bg-white p-4 rounded-xl shadow-lg border-l-8 border-blue-500">
            <h2 className="font-bold text-xl">{res.huesped_nombre}</h2>
            <p className="text-gray-600">📅 {res.fecha_entrada} al {res.fecha_salida}</p>
            <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
              HABITACIÓN: {res.habitacion_id || 'Pendiente'}
            </div>
          </div>
        )) : <p>No hay reservas registradas hoy.</p>}
      </div>
    </div>
  )
}