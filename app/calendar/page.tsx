'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import BookingModal from '@/app/components/BookingModal'
import React from 'react'

export default function CalendarPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedCell, setSelectedCell] = useState<{room: any, date: string} | null>(null)
  const [currentMonth] = useState(new Date())

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Traer habitaciones
    const { data: roomsData } = await supabase.from('rooms').select('*').order('name')
    if (roomsData) setRooms(roomsData)

    // Traer reservas del mes
    const { data: bookingsData } = await supabase.from('bookings').select('*')
    if (bookingsData) setBookings(bookingsData)
  }

  return (
    <main className="p-4 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h1>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-sm"><div className="w-3 h-3 bg-green-100 border"></div> Libre</span>
          <span className="flex items-center gap-1 text-sm"><div className="w-3 h-3 bg-blue-500 rounded"></div> Reserva Confirmada</span>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <div className="inline-grid grid-cols-[180px_repeat(31,60px)] min-w-max">
          {/* Días */}
          <div className="bg-gray-100 p-3 border-b border-r font-bold sticky left-0 z-10">Habitación</div>
          {days.map(day => (
            <div key={day.toString()} className="bg-gray-100 p-3 border-b text-center text-xs font-medium border-r">
              {format(day, 'EEE', { locale: es })} <br />
              <span className="text-lg">{format(day, 'd')}</span>
            </div>
          ))}

          {/* Filas */}
          {rooms.map(room => (
            <React.Fragment key={room.id}>
              <div className="p-3 border-b border-r bg-gray-50 sticky left-0 z-10 font-medium text-sm">
                {room.name}
              </div>
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                // Buscar si hay una reserva para esta habitación en este día
                const isBooked = bookings.find(b => 
                  b.room_id === room.id && 
                  isWithinInterval(day, { 
                    start: parseISO(b.check_in), 
                    end: parseISO(b.check_out) 
                  })
                )

                return (
                  <div 
                    key={dateStr}
                    onClick={() => !isBooked && setSelectedCell({ room, date: dateStr })}
                    className={`h-14 border-b border-r relative transition-colors ${isBooked ? 'bg-blue-100' : 'hover:bg-green-50 cursor-pointer'}`}
                  >
                    {isBooked && (
                      <div className="absolute inset-x-0 top-2 bottom-2 bg-blue-500 text-[10px] text-white p-1 overflow-hidden font-bold rounded-sm shadow-sm">
                        {isBooked.guest_name}
                      </div>
                    )}
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
          onClose={() => { setSelectedCell(null); fetchData(); }} 
        />
      )}
    </main>
  )
}
