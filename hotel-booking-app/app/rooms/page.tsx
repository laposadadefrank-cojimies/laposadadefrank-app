'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [name, setName] = useState('')

  useEffect(() => { fetchRooms() }, [])

  async function fetchRooms() {
    const { data } = await supabase.from('rooms').select('*')
    if (data) setRooms(data)
  }

  async function addRoom() {
    await supabase.from('rooms').insert([{ name }])
    setName('')
    fetchRooms()
  }

  return (
    <main className="p-8 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-green-700">Gestión de Habitaciones</h1>
      <div className="flex gap-2 mb-8">
        <input 
          className="border p-2 rounded w-64" 
          placeholder="Nombre de la habitación (ej: 101)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={addRoom} className="bg-green-600 text-white px-4 py-2 rounded">Agregar</button>
      </div>
      <ul className="space-y-2">
        {rooms.map(room => (
          <li key={room.id} className="p-4 border rounded shadow-sm flex justify-between">
            <span>{room.name}</span>
            <span className="text-gray-400">ID: {room.id}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
