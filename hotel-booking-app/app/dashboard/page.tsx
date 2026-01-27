'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-green-800 text-white p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-black uppercase italic italic">La Posada de Frank</h1>
        <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-xl font-black text-xs uppercase">Cerrar Sesión</button>
      </nav>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-10">
        {/* REVISA QUE ESTE LINK COINCIDA CON EL NOMBRE DE TU CARPETA */}
        <Link 
          href="/calendar" 
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl hover:scale-105 transition transform flex flex-col items-center border-t-8 border-blue-500"
        >
          <span className="text-7xl mb-4">📅</span>
          <span className="text-2xl font-black text-gray-800 uppercase italic">Calendario</span>
          <p className="text-gray-400 font-bold mt-2 text-xs uppercase tracking-widest text-center">Gestión de Reservas y Disponibilidad</p>
        </Link>

        <Link 
          href="/habitaciones" 
          className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:scale-105 transition transform flex flex-col items-center border-t-8 border-green-500"
        >
          <span className="text-7xl mb-4">🏨</span>
          <span className="text-2xl font-black text-gray-800 uppercase italic">Habitaciones</span>
          <p className="text-gray-400 font-bold mt-2 text-xs uppercase tracking-widest text-center">Precios, Fotos y Gestión</p>
        </Link>
      </div>
    </div>
  )
}