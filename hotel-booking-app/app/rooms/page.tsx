'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [name, setName] = useState('')

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*')
    if (data) setRooms(data)
  }

  async function addRoom() {
    if (!name) return
    await supabase.from('rooms').insert([{ name }])
    setName('')
    fetchRooms()
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-green-700">Gestión de Habitaciones</h1>
        <div className="flex gap-2 mb-8">
          <input 
            className="border p-2 rounded w-full" 
            placeholder="Nombre de la habitación (ej: 101)" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={addRoom} className="bg-green-600 text-white px-6 py-2 rounded font-bold">Agregar</button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
              <span className="font-bold text-gray-700">{room.name}</span>
              <span className="text-xs text-gray-400 font-mono">ID: {room.id}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
