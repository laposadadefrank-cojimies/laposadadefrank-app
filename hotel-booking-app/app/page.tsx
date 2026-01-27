'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert("Error: " + error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-8 border-black text-center">
        <div className="flex justify-center mb-6">
          {/* Contenedor del Logo */}
          <div className="w-40 h-40 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Logo La Posada de Frank" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-8">
          La Posada de Frank
        </h1>
        
        <form onSubmit={handleLogin} className="text-left space-y-4">
          <div>
            <input 
              type="email" 
              placeholder="Correo electrónico"
              className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-black outline-none transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Contraseña"
              className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-black outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg mt-4"
          >
            {loading ? 'ACCEDIENDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>
      </div>
    </main>
  )
}
