'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Asegúrate de tener configurado tu cliente de supabase

export default function BookingModal({ room, date, onClose }: { room: any, date: string, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    total_guests: 1,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('bookings').insert([{
      room_id: room.id,
      check_in: date,
      check_out: date, // Por defecto un día, luego puedes extenderlo
      guest_name: formData.guest_name,
      guest_email: formData.guest_email,
      guest_phone: formData.guest_phone,
      total_guests: formData.total_guests,
      notes: formData.notes,
      status: 'confirmed'
    }])

    if (error) alert('Error al crear reserva: ' + error.message)
    else {
      alert('¡Reserva guardada con éxito!')
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Crear Reserva</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-sm">
          <div>
            <label className="block text-gray-600">Habitación</label>
            <input type="text" value={room.name} disabled className="w-full bg-gray-50 border p-2 rounded" />
          </div>
          
          <div>
            <label className="block text-gray-600">Fecha</label>
            <input type="text" value={date} disabled className="w-full bg-gray-50 border p-2 rounded" />
          </div>

          <input 
            type="text" placeholder="Nombre del huésped" required
            className="w-full border p-2 rounded"
            onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
          />

          <input 
            type="email" placeholder="Email del huésped"
            className="w-full border p-2 rounded"
            onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
          />

          <div className="flex gap-2">
            <input 
              type="text" placeholder="Teléfono" className="flex-1 border p-2 rounded"
              onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
            />
            <input 
              type="number" placeholder="Personas" className="w-20 border p-2 rounded" min="1"
              onChange={(e) => setFormData({...formData, total_guests: parseInt(e.target.value)})}
            />
          </div>

          <textarea 
            placeholder="Notas adicionales" className="w-full border p-2 rounded h-20"
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />

          <div className="flex gap-2 pt-2">
            <button 
              type="submit" disabled={loading}
              className="flex-1 bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700"
            >
              {loading ? 'Guardando...' : 'Guardar Reserva'}
            </button>
            <button 
              type="button" onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}