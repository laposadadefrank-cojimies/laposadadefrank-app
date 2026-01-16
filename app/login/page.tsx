'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else router.push('/')
  }

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert('Revisa tu correo para confirmar el registro')
    else alert('Usuario creado, confirma en tu email')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-700">Acceso Posada de Frank</h1>
        <input 
          type="email" placeholder="Correo electrónico" 
          className="w-full border p-3 rounded mb-4"
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Contraseña" 
          className="w-full border p-3 rounded mb-6"
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" className="w-full bg-green-600 text-white p-3 rounded font-bold mb-4">
          Entrar
        </button>
        <button type="button" onClick={handleSignUp} className="w-full text-blue-600 text-sm">
          ¿No tienes cuenta? Regístrate aquí
        </button>
      </form>
    </main>
  )
}
