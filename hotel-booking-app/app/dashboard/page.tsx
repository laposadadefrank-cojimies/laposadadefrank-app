'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'

export default function Dashboard() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-green-800 text-white p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold">La Posada de Frank - Control total</h1>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold transition">Cerrar Sesión</button>
      </nav>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link href="/calendar" className="bg-white p-10 rounded-2xl shadow-xl hover:scale-105 transition transform flex flex-col items-center border-t-4 border-blue-500">
          <span className="text-6xl mb-4">📅</span>
          <span className="text-2xl font-bold text-gray-800">Calendario</span>
          <p className="text-gray-500 mt-2">Ver y crear reservas</p>
        </Link>

        <Link href="/rooms" className="bg-white p-10 rounded-2xl shadow-xl hover:scale-105 transition transform flex flex-col items-center border-t-4 border-green-500">
          <span className="text-6xl mb-4">🏨</span>
          <span className="text-2xl font-bold text-gray-800">Habitaciones</span>
          <p className="text-gray-500 mt-2">Precios y capacidades</p>
        </Link>
      </div>
    </div>
  )
}
