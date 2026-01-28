'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('recepcionista')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function cargarUsuarios() {
    const { data } = await supabase.from('perfiles').select('*').order('email')
    setUsuarios(data || [])
  }

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    
    if (editandoId) {
      const { error } = await supabase
        .from('perfiles')
        .update({ rol: rol })
        .eq('id', editandoId)

      if (error) alert("Error: " + error.message)
      else alert("¡Rol actualizado!")
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) alert("Error: " + error.message)
      else if (data.user) {
        await supabase.from('perfiles').insert([{ id: data.user.id, email, rol }])
        alert("Usuario creado con éxito")
      }
    }
    resetearFormulario()
    cargarUsuarios()
    setCargando(false)
  }

  const eliminarUsuario = async (id: string, userEmail: string) => {
    if (confirm(`¿ELIMINAR ACCESO A: ${userEmail}?`)) {
      const { error } = await supabase.from('perfiles').delete().eq('id', id)
      if (error) alert(error.message)
      else cargarUsuarios()
    }
  }

  const prepararEdicion = (u: any) => {
    setEditandoId(u.id)
    setEmail(u.email)
    setRol(u.rol)
  }

  const resetearFormulario = () => {
    setEditandoId(null)
    setEmail('')
    setPassword('')
    setRol('recepcionista')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <nav className="mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/dashboard" className="bg-gray-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg">← Volver</Link>
        <h1 className="text-xl font-black italic uppercase text-gray-800 tracking-tighter text-center flex-1">Gestión de Personal</h1>
        <button onClick={resetearFormulario} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700">+ Nuevo</button>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* FORMULARIO DE CREACIÓN/EDICIÓN */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-t-8 border-orange-500 h-fit">
          <h2 className="text-[11px] font-black uppercase text-gray-800 mb-6 flex items-center gap-2">
            {editandoId ? '📝 Editando Empleado' : '🚀 Registrar Nuevo'}
          </h2>
          <form onSubmit={guardarUsuario} className="space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Correo del Empleado</label>
              <input type="email" placeholder="ejemplo@hotel.com" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs border border-transparent focus:border-orange-500 disabled:opacity-50" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!editandoId} />
            </div>

            {!editandoId && (
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Contraseña Inicial</label>
                <input type="password" placeholder="Mínimo 6 caracteres" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs border border-transparent focus:border-orange-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            )}

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Asignar Rol</label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-xs uppercase text-orange-600 border border-transparent focus:border-orange-500 cursor-pointer" value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="recepcionista">🔑 Recepcionista</option>
                <option value="admin">👑 Administrador</option>
              </select>
            </div>
            
            <button type="submit" disabled={cargando} className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-orange-600 active:scale-95 transition-all">
              {cargando ? 'Procesando...' : editandoId ? 'Guardar Cambios' : 'Crear Acceso Ahora'}
            </button>
          </form>
        </div>

        {/* LISTA DE USUARIOS CON BOTONES VISIBLES */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-gray-400 ml-4 italic">Lista de Usuarios con Acceso</h2>
          {usuarios.map((u) => (
            <div key={u.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">👤</div>
                  <div>
                    <p className="font-black text-xs text-gray-800">{u.email}</p>
                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${u.rol === 'admin' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>{u.rol}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 border-t pt-4 border-gray-50">
                <button onClick={() => prepararEdicion(u)} className="flex-1 bg-blue-50 text-blue-700 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-blue-100 transition-colors border border-blue-100">Editar</button>
                <button onClick={() => eliminarUsuario(u.id, u.email)} className="flex-1 bg-red-50 text-red-700 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-100 transition-colors border border-red-100">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}