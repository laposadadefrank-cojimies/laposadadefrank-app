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
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-green-600">
        <h1 className="text-3xl font-bold mb-2 text-center text-green-700">La Posada de Frank</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" className="w-full border p-3 rounded-lg" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" className="w-full border p-3 rounded-lg" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold">
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </main>
  )
}
