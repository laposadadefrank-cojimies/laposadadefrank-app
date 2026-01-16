'use client'
export default function CalendarPage() {
  return (
    <main className="p-8 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-green-700">Calendario de Reservas</h1>
      <div className="bg-gray-100 p-20 border-2 border-dashed border-gray-300 rounded-xl text-center">
        <p className="text-gray-500 text-lg">El calendario se está sincronizando con tus habitaciones...</p>
        <p className="text-sm text-gray-400 mt-2">Pronto verás aquí la cuadrícula de reservas.</p>
      </div>
    </main>
  )
}
