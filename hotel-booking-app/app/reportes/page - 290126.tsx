'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function ReportesPage() {
  const [reservas, setReservas] = useState<any[]>([])
  const [habitaciones, setHabitaciones] = useState<any[]>([])
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroHabitacion, setFiltroHabitacion] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  async function cargarDatosIniciales() {
    const { data: habs } = await supabase.from('habitaciones').select('*').order('nombre')
    setHabitaciones(habs || [])
    aplicarFiltros()
  }

  async function aplicarFiltros() {
    setCargando(true)
    try {
      let query = supabase.from('reservas').select(`*, habitaciones(nombre)`)

      if (filtroFechaInicio) query = query.gte('fecha_entrada', filtroFechaInicio)
      if (filtroFechaFin) query = query.lte('fecha_entrada', filtroFechaFin)
      if (filtroHabitacion) query = query.eq('habitacion_id', filtroHabitacion)
      if (filtroCliente) query = query.ilike('huesped_nombre', `%${filtroCliente}%`)

      const { data, error } = await query.order('fecha_entrada', { ascending: false })
      if (error) throw error
      setReservas(data || [])
    } catch (err) {
      console.error(err)
      alert("Error al cargar reportes")
    }
    setCargando(false)
  }

  // Cálculos de Totales
  const totalGeneral = reservas.reduce((acc, r) => acc + (r.valor_total || 0), 0)
  const totalAnticipos = reservas.reduce((acc, r) => acc + (r.anticipo || 0), 0)
  const totalSaldos = reservas.reduce((acc, r) => acc + (r.saldo_pendiente || 0), 0)

  const exportarExcel = () => {
    const dataParaExcel = reservas.map(r => ({
      Cliente: r.huesped_nombre,
      Personas: r.num_personas,
      Habitación: r.habitaciones?.nombre || 'N/A',
      Desde: r.fecha_entrada,
      Hasta: r.fecha_salida,
      'Valor Total': r.valor_total,
      'Valor Anticipo': r.anticipo,
      'Saldo Pendiente': r.saldo_pendiente,
      'Medio Pago': r.forma_pago,
      Teléfono: r.cliente_telefono || '',
      Ciudad: r.cliente_ciudad || '',
      Observaciones: r.observaciones || ''
    }))

    const ws = XLSX.utils.json_to_sheet(dataParaExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_Hotel")
    XLSX.writeFile(wb, `Reporte_La_Posada_De_Frank.xlsx`)
  }

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.text("HOTEL LA POSADA DE FRANK - REPORTE DE RESERVAS", 14, 15)
    
    const tableData = reservas.map(r => [
      r.huesped_nombre,
      r.num_personas,
      r.habitaciones?.nombre,
      r.fecha_entrada,
      r.fecha_salida,
      `$${r.valor_total.toFixed(2)}`,
      `$${r.anticipo.toFixed(2)}`,
      `$${r.saldo_pendiente.toFixed(2)}`,
      r.forma_pago
    ])

    tableData.push([
      { content: 'TOTALES', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
      `$${totalGeneral.toFixed(2)}`,
      `$${totalAnticipos.toFixed(2)}`,
      `$${totalSaldos.toFixed(2)}`,
      ''
    ])

    autoTable(doc, {
      head: [['Cliente', 'Pax', 'Hab.', 'Desde', 'Hasta', 'Total', 'Anticipo', 'Saldo', 'M. Pago']],
      body: tableData,
      startY: 25,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [31, 41, 55] }
    })

    doc.save(`Reporte_Posada_Frank.pdf`)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <nav className="mb-8 flex justify-between items-center">
        <Link href="/dashboard" className="bg-gray-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg">← Volver</Link>
        <h1 className="text-xl font-black italic uppercase text-gray-800 tracking-tighter">Reportes Financieros</h1>
        <div className="flex gap-2">
          <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase shadow-md hover:bg-green-700 transition-all">Excel</button>
          <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase shadow-md hover:bg-red-700 transition-all">PDF</button>
        </div>
      </nav>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm mb-8 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 block ml-2 mb-1">Desde</label>
          <input type="date" className="w-full p-3 bg-gray-50 rounded-2xl outline-none font-bold text-xs" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 block ml-2 mb-1">Hasta</label>
          <input type="date" className="w-full p-3 bg-gray-50 rounded-2xl outline-none font-bold text-xs" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 block ml-2 mb-1">Habitación</label>
          <select className="w-full p-3 bg-gray-50 rounded-2xl outline-none font-bold text-xs uppercase" value={filtroHabitacion} onChange={(e) => setFiltroHabitacion(e.target.value)}>
            <option value="">TODAS</option>
            {habitaciones.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 block ml-2 mb-1">Cliente</label>
          <input type="text" className="w-full p-3 bg-gray-50 rounded-2xl outline-none font-bold text-xs uppercase" placeholder="Buscar..." value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} />
        </div>
        <button onClick={aplicarFiltros} className="md:col-span-4 bg-blue-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-blue-700 transition-all tracking-widest">
          {cargando ? 'PROCESANDO...' : 'ACTUALIZAR REPORTE'}
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-gray-900 text-white text-[10px] uppercase font-black italic">
                <th className="p-5">Huésped / Info</th>
                <th className="p-5 text-center">Pax</th>
                <th className="p-5">Habitación</th>
                <th className="p-5">Fechas</th>
                <th className="p-5 text-right">V. Total</th>
                <th className="p-5 text-right">V. Anticipo</th>
                <th className="p-5 text-right">S. Pendiente</th>
                <th className="p-5">Forma Pago</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {reservas.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-5">
                    <div className="font-black uppercase text-gray-800">{r.huesped_nombre}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase">{r.cliente_telefono} - {r.cliente_ciudad}</div>
                  </td>
                  <td className="p-5 text-center">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-black">{r.num_personas}</span>
                  </td>
                  <td className="p-5 font-black text-blue-600 uppercase italic">{r.habitaciones?.nombre}</td>
                  <td className="p-5 text-gray-500 font-bold">
                    <span className="text-green-600">IN: {r.fecha_entrada}</span><br />
                    <span className="text-red-500">OUT: {r.fecha_salida}</span>
                  </td>
                  <td className="p-5 text-right font-black text-sm">${r.valor_total.toFixed(2)}</td>
                  <td className="p-5 text-right font-bold text-green-600">${r.anticipo.toFixed(2)}</td>
                  <td className="p-5 text-right font-black text-red-600 text-sm bg-red-50/50">${r.saldo_pendiente.toFixed(2)}</td>
                  <td className="p-5">
                    <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">{r.forma_pago}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-gray-200">
                <td colSpan={4} className="p-5 text-right font-black uppercase text-xs italic text-gray-500">Totales Seleccionados:</td>
                <td className="p-5 text-right font-black text-lg text-gray-900">${totalGeneral.toFixed(2)}</td>
                <td className="p-5 text-right font-black text-lg text-green-700">${totalAnticipos.toFixed(2)}</td>
                <td className="p-5 text-right font-black text-lg text-red-700 bg-red-100/50">${totalSaldos.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </main>
  )
}