'use client'
import { supabase } from '../../lib/supabase'

export default function CalendarPage() {
  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-green-700">Calendario de Reservas</h1>
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
          <div className="text-center">
             <span className="text-5xl block mb-4">📅</span>
             <p className="text-gray-500 italic">Sincronizando con la base de datos de habitaciones...</p>
          </div>
        </div>
      </div>
    </main>
  )
}
