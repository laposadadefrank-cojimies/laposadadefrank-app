'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import BookingModal from '@/app/components/BookingModal'

export default function CalendarPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedCell, setSelectedCell] = useState<{room: any, date: string} | null>(null)
  const [currentMonth] = useState(new Date())

  // Generar días del mes actual
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('rooms').select('*').order('name')
      if (data) setRooms(data)
    }
    fetchData()
  }, [])

  return (
    <main className="p-4 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h1>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-sm"><div className="w-3 h-3 bg-green-100 border"></div> Libre</span>
          <span className="flex items-center gap-1 text-sm"><div className="w-3 h-3 bg-blue-500"></div> Ocupado</span>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <div className="inline-grid grid-cols-[180px_repeat(31,60px)] min-w-max">
          {/* Encabezado: Habitaciones y Días */}
          <div className="bg-gray-100 p-3 border-b border-r font-bold sticky left-0 z-10">Habitación</div>
          {days.map(day => (
            <div key={day.toString()} className="bg-gray-100 p-3 border-b text-center text-xs font-medium uppercase">
              {format(day, 'EEE', { locale: es })} <br />
              <span className="text-lg">{format(day, 'd')}</span>
            </div>
          ))}

          {/* Filas de Habitaciones */}
          {rooms.map(room => (
            <React.Fragment key={room.id}>
              <div className="p-3 border-b border-r bg-gray-50 sticky left-0 z-10 font-medium text-sm">
                {room.name}
                <div className="text-[10px] text-gray-400">Cap: {room.capacity}</div>
              </div>
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                return (
                  <div 
                    key={dateStr}
                    onClick={() => setSelectedCell({ room, date: dateStr })}
                    className="h-14 border-b border-r hover:bg-green-50 cursor-pointer transition-colors"
                  >
                    {/* Aquí irán las etiquetas de reserva luego */}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selectedCell && (
        <BookingModal 
          room={selectedCell.room} 
          date={selectedCell.date} 
          onClose={() => setSelectedCell(null)} 
        />
      )}
    </main>
  )
}

// Necesario para evitar errores de React.Fragment en el string de PowerShell
import React from 'react'
