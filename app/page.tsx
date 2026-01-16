import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-green-700 mb-2">La Posada de Frank</h1>
        <p className="text-gray-600 text-lg">Sistema de Gestión de Reservas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Botón al Calendario */}
        <Link href="/calendar" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-green-500 transition-all text-center">
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📅</div>
          <h2 className="text-2xl font-bold mb-2">Calendario</h2>
          <p className="text-gray-500">Ver disponibilidad y crear reservas (Vista BedBooking)</p>
        </Link>

        {/* Botón a Habitaciones */}
        <Link href="/rooms" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-500 transition-all text-center">
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏨</div>
          <h2 className="text-2xl font-bold mb-2">Habitaciones</h2>
          <p className="text-gray-500">Configurar nombres, capacidad y precios</p>
        </Link>
      </div>
    </main>
  )
}