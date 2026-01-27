'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function GestionHabitaciones() {
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [capacidad, setCapacidad] = useState('1')
  const [file, setFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  useEffect(() => {
    cargarHabitaciones()
  }, [])

  async function cargarHabitaciones() {
    const { data } = await supabase.from('habitaciones').select('*').order('creado_at', { ascending: false })
    if (data) setHabitaciones(data)
  }

  const prepararEdicion = (hab: any) => {
    setEditandoId(hab.id)
    setNombre(hab.nombre)
    setPrecio(hab.precio_persona_noche.toString())
    setCapacidad(hab.capacidad.toString())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setNombre(''); setPrecio(''); setCapacidad('1'); setFile(null)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubiendo(true)

    let urlPublica = ''
    if (file) {
      const fileName = `${Date.now()}-${file.name}`
      const { data: storageData } = await supabase.storage.from('fotos-habitaciones').upload(fileName, file)
      if (storageData) {
        const { data } = supabase.storage.from('fotos-habitaciones').getPublicUrl(fileName)
        urlPublica = data.publicUrl
      }
    }

    const datos: any = { 
      nombre, 
      precio_persona_noche: parseFloat(precio), 
      capacidad: parseInt(capacidad) 
    }
    if (urlPublica) datos.foto_url = urlPublica

    if (editandoId) {
      // ACTUALIZAR
      const { error } = await supabase.from('habitaciones').update(datos).eq('id', editandoId)
      if (!error) alert("Habitación actualizada")
    } else {
      // INSERTAR NUEVA
      const { error } = await supabase.from('habitaciones').insert([datos])
      if (!error) alert("Habitación creada")
    }

    setSubiendo(false)
    cancelarEdicion()
    cargarHabitaciones()
  }

  const eliminarHabitacion = async (id: string) => {
    if (confirm("¿Eliminar esta habitación?")) {
      const { error } = await supabase.from('habitaciones').delete().eq('id', id)
      if (!error) cargarHabitaciones()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <nav className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <Link href="/dashboard" className="text-blue-600 font-bold text-sm">← PANEL</Link>
        <h1 className="font-black text-gray-800 uppercase text-lg">Habitaciones</h1>
        <div className="w-10"></div>
      </nav>

      <div className="p-4 max-w-xl mx-auto space-y-6">
        {/* FORMULARIO ÚNICO PARA CREAR Y EDITAR */}
        <form onSubmit={handleGuardar} className={`p-6 rounded-3xl shadow-xl space-y-4 border-2 transition-all ${editandoId ? 'border-orange-400 bg-orange-50' : 'border-transparent bg-white'}`}>
          <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">
            {editandoId ? '📝 Editando Habitación' : '🆕 Nueva Habitación'}
          </h2>
          
          <input type="text" placeholder="Nombre" value={nombre} className="w-full p-4 bg-white rounded-2xl border outline-none" onChange={(e) => setNombre(e.target.value)} required />
          
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Precio $" value={precio} className="w-full p-4 bg-white rounded-2xl border outline-none" onChange={(e) => setPrecio(e.target.value)} required />
            <input type="number" placeholder="Capacidad" value={capacidad} className="w-full p-4 bg-white rounded-2xl border outline-none" onChange={(e) => setCapacidad(e.target.value)} required />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-dashed border-gray-300">
            <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase text-center">Foto (opcional si ya tiene)</p>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs w-full" />
          </div>

          <div className="flex gap-2">
            {editandoId && (
              <button type="button" onClick={cancelarEdicion} className="flex-1 bg-gray-400 text-white p-4 rounded-2xl font-black uppercase text-xs">Cancelar</button>
            )}
            <button disabled={subiendo} className={`flex-[2] p-4 rounded-2xl font-black text-white shadow-lg transition-all ${editandoId ? 'bg-orange-500' : 'bg-blue-600'}`}>
              {subiendo ? 'PROCESANDO...' : editandoId ? 'GUARDAR CAMBIOS' : 'PUBLICAR HABITACIÓN'}
            </button>
          </div>
        </form>

        {/* LISTADO CON EDITAR Y ELIMINAR */}
        <div className="space-y-4">
          {habitaciones.map((hab) => (
            <div key={hab.id} className="bg-white rounded-3xl overflow-hidden shadow-sm flex items-center p-3 border border-gray-100">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                {hab.foto_url ? (
                  <img src={hab.foto_url} className="w-full h-full object-cover" alt="hab" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">SIN FOTO</div>
                )}
              </div>
              
              <div className="ml-4 flex-1">
                <h3 className="font-black text-gray-800 uppercase text-xs">{hab.nombre}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-green-600 font-black text-sm">${hab.precio_persona_noche}</span>
                  <span className="text-[10px] font-bold text-gray-400">Cap: {hab.capacidad}p</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button onClick={() => prepararEdicion(hab)} className="text-[10px] font-black text-blue-600 uppercase border border-blue-600 px-3 py-1 rounded-lg">Editar</button>
                  <button onClick={() => eliminarHabitacion(hab.id)} className="text-[10px] font-black text-red-500 uppercase border border-red-100 px-3 py-1 rounded-lg">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}