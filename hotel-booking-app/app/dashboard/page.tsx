import Link from 'next/link'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-extrabold text-green-700">Panel de Administración</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-red-500 font-bold">Cerrar Sesión</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Usamos rutas relativas sin la barra inicial para evitar confusiones de base directory */}
          <Link href="calendar" className="group bg-white p-10 rounded-2xl shadow-sm border hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-800">Calendario</h2>
            <p className="text-gray-500 mt-2">Gestionar reservas</p>
          </Link>

          <Link href="rooms" className="group bg-white p-10 rounded-2xl shadow-sm border hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🏨</div>
            <h2 className="text-2xl font-bold text-gray-800">Habitaciones</h2>
            <p className="text-gray-500 mt-2">Configurar precios</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
