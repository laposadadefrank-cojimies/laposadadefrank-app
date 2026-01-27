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
      {/* Barra de navegación optimizada */}
      <nav className="bg-green-900 text-white p-5 flex justify-between items-center shadow-xl border-b-4 border-green-500">
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          La Posada de Frank <span className="text-green-400 block text-[10px] not-italic tracking-widest">Panel de Control</span>
        </h1>
        <button 
          onClick={handleLogout} 
          className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-2xl font-black transition-all active:scale-95 text-[10px] uppercase shadow-lg shadow-red-200"
        >
          Cerrar Sesión
        </button>
      </nav>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
        
        {/* Enlace corregido a /calendar */}
        <Link 
          href="/calendar" 
          className="bg-white p-10 rounded-[3rem] shadow-2xl hover:translate-y-[-5px] transition-all flex flex-col items-center border-b-8 border-blue-500 group"
        >
          <span className="text-7xl mb-4 group-hover:scale-110 transition-transform">📅</span>
          <span className="text-2xl font-black text-gray-800 uppercase italic">Calendario</span>
          <div className="h-1 w-10 bg-blue-500 my-2 rounded-full"></div>
          <p className="text-gray-400 font-bold text-xs uppercase italic">Gestión de Reservas</p>
        </Link>

        {/* Enlace a Habitaciones */}
        <Link 
          href="/habitaciones" 
          className="bg-white p-10 rounded-[3rem] shadow-2xl hover:translate-y-[-5px] transition-all flex flex-col items-center border-b-8 border-green-500 group"
        >
          <span className="text-7xl mb-4 group-hover:scale-110 transition-transform">🏨</span>
          <span className="text-2xl font-black text-gray-800 uppercase italic">Habitaciones</span>
          <div className="h-1 w-10 bg-green-500 my-2 rounded-full"></div>
          <p className="text-gray-400 font-bold text-xs uppercase italic">Precios y Fotos</p>
        </Link>

      </div>
    </div>
  )
}