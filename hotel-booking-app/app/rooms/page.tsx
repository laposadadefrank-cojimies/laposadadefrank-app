'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [formData, setFormData] = useState({ name: '', capacity: 2, price_per_night: 0 })

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    const { data, error } = await supabase.from('rooms').select('*').order('name')
    if (data) setRooms(data)
  }

  async function addRoom(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('rooms').insert([formData])
    if (error) alert("Error: " + error.message)
    else {
      setFormData({ name: '', capacity: 2, price_per_night: 0 })
      fetchRooms()
    }
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">🏨 Habitaciones de La Posada</h1>
          <Link href="/dashboard" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Volver al Panel</Link>
        </div>

        <form onSubmit={addRoom} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700">Nombre/Número</label>
            <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: 101" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Capacidad</label>
            <input type="number" className="w-full border p-2 rounded" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Precio x Noche</label>
            <input type="number" className="w-full border p-2 rounded" value={formData.price_per_night} onChange={e => setFormData({...formData, price_per_night: parseFloat(e.target.value)})} required />
          </div>
          <button type="submit" className="bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">Guardar</button>
        </form>

        <div className="grid gap-4">
          {rooms.map((room: any) => (
            <div key={room.id} className="bg-white p-4 border rounded-lg flex justify-between items-center shadow-sm">
              <div>
                <span className="font-bold text-lg text-gray-800">Habitación {room.name}</span>
                <p className="text-sm text-gray-500">Capacidad: {room.capacity} personas</p>
              </div>
              <span className="font-bold text-xl text-green-600">${room.price_per_night}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
