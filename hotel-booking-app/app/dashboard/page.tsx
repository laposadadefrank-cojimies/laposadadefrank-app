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
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Barra de navegación */}
      <nav className="bg-green-800 text-white p-4 flex justify-between items-center shadow-lg border-b-4 border-green-600">
        <h1 className="text-xl font-black uppercase italic tracking-tighter">
          La Posada de Frank - Control Total
        </h1>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-black transition-all active:scale-95 text-xs uppercase shadow-md"
        >
          Cerrar Sesión
        </button>
      </nav>

      {/* Contenedor de botones principales */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-10">
        
        {/* Botón Calendario -> AHORA APUNTA A /calendar */}
        <Link 
          href="/calendar" 
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl hover:scale-105 transition transform flex flex-col items-center border-t-8 border-blue-500 group"
        >
          <span className="text-7xl mb-4 group-hover:rotate-12 transition-transform">📅</span>
          <span className="text-2xl font-black text-gray-800 uppercase italic">Calendario</span>
          <p className="text-gray-400 font-bold mt-2 text-xs uppercase tracking-widest">Ver y crear reservas</p>
        </Link>

        {/* Botón Habitaciones */}
        <Link 
          href="/habitaciones" 
          className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:scale-105 transition transform flex flex-col items-center border-t-8 border-green-500 group"
        >
          <span className="text-7xl mb-4 group-hover:rotate-12 transition-transform">🏨</span>
          <span className="text-2xl font-black text-gray-800 uppercase italic">Habitaciones</span>
          <p className="text-gray-400 font-bold mt-2 text-xs uppercase tracking-widest">Precios y capacidades</p>
        </Link>

      </div>
    </div>
  )
}