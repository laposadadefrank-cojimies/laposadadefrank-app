'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [formData, setFormData] = useState({ name: '', capacity: 2, price_per_night: 0 })

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*').order('name')
    if (data) setRooms(data)
  }

  async function addRoom(e) {
    e.preventDefault()
    const { error } = await supabase.from('rooms').insert([formData])
    if (error) alert(error.message)
    else {
      setFormData({ name: '', capacity: 2, price_per_night: 0 })
      fetchRooms()
    }
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-green-700">Gestión de Habitaciones</h1>
        <form onSubmit={addRoom} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacidad</label>
            <input type="number" className="w-full border p-2 rounded" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio</label>
            <input type="number" className="w-full border p-2 rounded" value={formData.price_per_night} onChange={e => setFormData({...formData, price_per_night: parseFloat(e.target.value)})} required />
          </div>
          <button type="submit" className="bg-green-600 text-white p-2 rounded font-bold">Guardar</button>
        </form>
        <div className="grid gap-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white p-4 border rounded-lg flex justify-between items-center">
              <span className="font-bold text-lg">Habitación {room.name}</span>
              <span className="text-sm text-gray-500">${room.price_per_night} / noche</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
