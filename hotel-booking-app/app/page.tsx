'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    <main className="min-h-screen flex items-center justify-center bg-[#f3f4f6] p-6">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-8 border-[#1a1a1a]">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-40 h-40 mb-4">
             <img src="/logo.png" alt="La Posada de Frank" className="object-contain" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest">La Posada de Frank</h1>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" 
            placeholder="Correo electrónico"
            className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-black outline-none transition-all"
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Contraseña"
            className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-black outline-none transition-all"
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white p-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
          >
            {loading ? 'Entrando...' : 'INICIAR SESIÓN'}
          </button>
        </form>
      </div>
    </main>
  )
}
