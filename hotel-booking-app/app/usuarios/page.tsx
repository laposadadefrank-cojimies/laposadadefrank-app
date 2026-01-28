'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('recepcionista')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function cargarUsuarios() {
    // Nota: Por seguridad, Supabase Auth requiere cuidado aquí. 
    // Mostraremos los datos de nuestra tabla 'perfiles'
    const { data } = await supabase.from('perfiles').select('*')
    setUsuarios(data || [])
  }

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    
    // 1. Registrar en Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert("Error: " + error.message)
    } else if (data.user) {
      // 2. Crear el perfil con el rol
      await supabase.from('perfiles').insert([
        { id: data.user.id, email: email, rol: rol }
      ])
      alert("Usuario creado. El empleado debe revisar su correo para confirmar.")
      setEmail('')
      setPassword('')
      cargarUsuarios()
    }
    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <nav className="mb-8 flex justify-between items-center">
        <Link href="/dashboard" className="bg-gray-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg">← Volver</Link>
        <h1 className="text-xl font-black italic uppercase text-gray-800">Personal del Hotel</h1>
        <div className="w-10"></div>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FORMULARIO */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-t-8 border-orange-500">
          <h2 className="text-[10px] font-black uppercase text-gray-400 mb-4">✨ Registrar Nuevo Empleado</h2>
          <form onSubmit={crearUsuario} className="space-y-4">
            <input 
              type="email" 
              placeholder="Correo Electrónico" 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña Temporal" 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <select 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs uppercase"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="recepcionista">Recepcionista (Solo Reservas)</option>
              <option value="admin">Administrador (Acceso Total)</option>
            </select>
            <button 
              disabled={cargando}
              className="w-full bg-orange-500 text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-orange-600"
            >
              {cargando ? 'Registrando...' : 'Crear Acceso'}
            </button>
          </form>
        </div>

        {/* LISTA */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-gray-400 ml-4">👥 Personal Actual</h2>
          {usuarios.map((u) => (
            <div key={u.id} className="bg-white p-4 rounded-3xl shadow-sm flex justify-between items-center border border-gray-100">
              <div>
                <p className="font-black text-xs text-gray-800">{u.email}</p>
                <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${u.rol === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {u.rol}
                </p>
              </div>
              <span className="text-2xl">👤</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}