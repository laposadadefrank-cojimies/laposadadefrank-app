import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-green-700 mb-8">La Posada de Frank</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/calendar" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-center border-t-4 border-green-500">
          <h2 className="text-2xl font-semibold mb-2">📅 Calendario</h2>
          <p className="text-gray-600">Ver disponibilidad y crear reservas</p>
        </Link>

        <Link href="/rooms" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-center border-t-4 border-blue-500">
          <h2 className="text-2xl font-semibold mb-2">🏨 Habitaciones</h2>
          <p className="text-gray-600">Configurar nombres y precios</p>
        </Link>
      </div>
    </main>
  )
}
