'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(2)

  useEffect(() => {
    fetchRooms()
  }, [])

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*').order('created_at')
    if (data) setRooms(data)
  }

  async function addRoom(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('rooms').insert([{ name, capacity }])
    if (!error) {
      setName('')
      fetchRooms()
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-green-700">Gestión de Habitaciones</h1>
      
      <form onSubmit={addRoom} className="mb-8 p-4 bg-white rounded shadow flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium">Nombre (ej: Suite Danna 4)</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Capacidad</label>
          <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} className="w-full border p-2 rounded w-20" />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold">Añadir</button>
      </form>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Capacidad</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-t">
                <td className="p-3">{room.name}</td>
                <td className="p-3">{room.capacity} personas</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
