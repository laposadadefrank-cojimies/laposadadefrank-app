'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("¡Éxito! Confirma tu correo.")
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Crear Cuenta</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="email" className="w-full border p-3 rounded-lg" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" className="w-full border p-3 rounded-lg" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">Registrarme</button>
        </form>
      </div>
    </main>
  )
}
