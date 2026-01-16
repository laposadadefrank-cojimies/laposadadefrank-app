import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-4">La Posada de Frank</h1>
      <p className="text-gray-600 mb-8 text-lg">Sistema de Gestión de Reservas</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/calendar" className="p-8 border rounded-xl hover:shadow-lg transition text-center bg-gray-50">
          <span className="text-4xl block mb-2">📅</span>
          <h2 className="text-xl font-bold">Calendario</h2>
        </Link>
        <Link href="/rooms" className="p-8 border rounded-xl hover:shadow-lg transition text-center bg-gray-50">
          <span className="text-4xl block mb-2">🏨</span>
          <h2 className="text-xl font-bold">Habitaciones</h2>
        </Link>
      </div>
    </main>
  )
}
