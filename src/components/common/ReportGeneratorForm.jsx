import { useState } from "react"
import { MdDownload, MdAssessment } from "react-icons/md"
import { generarReporteEnergia, generarReporteEnergiaCSV } from "../../api/reports"

function fechaHaceNDias(n) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - n)
  return fecha.toISOString().split("T")[0]
}

function hoy() {
  return new Date().toISOString().split("T")[0]
}

function diasEntreFechas(inicio, fin) {
  const diff = new Date(fin) - new Date(inicio)
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

const estiloInput =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

export default function ReportGeneratorForm({ salones = [], alGenerar, alDescargar }) {
  const [idsSalonesSeleccionados, setIdsSalonesSeleccionados] = useState(null)
  const [fechaInicio,  setFechaInicio]  = useState(fechaHaceNDias(7))
  const [fechaFin,     setFechaFin]     = useState(hoy())
  const [generando,    setGenerando]    = useState(false)
  const [descargando,  setDescargando]  = useState(false)
  const [error,        setError]        = useState(null)

  const salonesSeleccionados = idsSalonesSeleccionados ?? salones.map(salon => salon.sala_id)
  const diasSeleccionados = diasEntreFechas(fechaInicio, fechaFin)

  function construirCarga() {
    return {
      room_ids: salonesSeleccionados,
      period: {
        start: new Date(fechaInicio).toISOString(),
        end:   new Date(fechaFin + "T23:59:59").toISOString(),
      },
    }
  }

  function validar() {
    if (!salonesSeleccionados.length) return "Selecciona al menos un salón"
    if (new Date(fechaInicio) >= new Date(fechaFin)) return "La fecha de inicio debe ser anterior a la fecha fin"
    if (diasSeleccionados > 90) return "El período no puede superar 90 días"
    return null
  }

  async function manejarGenerar() {
    const mensajeError = validar()
    if (mensajeError) { setError(mensajeError); return }
    setError(null)
    setGenerando(true)
    try {
      const resultado = await generarReporteEnergia(construirCarga())
      alGenerar(resultado)
    } catch {
      setError("Error al generar el reporte")
    } finally {
      setGenerando(false)
    }
  }

  async function manejarDescargar() {
    const mensajeError = validar()
    if (mensajeError) { setError(mensajeError); return }
    setError(null)
    setDescargando(true)
    try {
      await generarReporteEnergiaCSV(construirCarga())
      alDescargar?.()
    } catch {
      setError("Error al descargar el CSV")
    } finally {
      setDescargando(false)
    }
  }

  function alternarTodosLosSalones() {
    setIdsSalonesSeleccionados(
      salonesSeleccionados.length === salones.length ? [] : salones.map(salon => salon.sala_id)
    )
  }

  function alternarSalon(idSalon) {
    setIdsSalonesSeleccionados(prev => {
      const seleccionActual = prev ?? salones.map(salon => salon.sala_id)
      return seleccionActual.includes(idSalon)
        ? seleccionActual.filter(id => id !== idSalon)
        : [...seleccionActual, idSalon]
    })
  }

  const ocupado = generando || descargando

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <p className="font-semibold text-dark text-sm">Generar reporte</p>
        <p className="text-xs text-muted mt-0.5">Selecciona salones y período</p>
      </div>
      <hr className="border-gray-100" />

      {/* Salones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">
            Salones incluidos
          </label>
          <button
            type="button"
            onClick={alternarTodosLosSalones}
            className="text-xs text-secondary hover:underline"
          >
            {salonesSeleccionados.length === salones.length ? "Quitar todos" : "Seleccionar todos"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {salones.map(salon => (
            <label
              key={salon.sala_id}
              className="flex items-center gap-2 text-sm text-dark cursor-pointer py-1"
            >
              <input
                type="checkbox"
                checked={salonesSeleccionados.includes(salon.sala_id)}
                onChange={() => alternarSalon(salon.sala_id)}
                className="accent-secondary w-3.5 h-3.5"
              />
              <span className="truncate">{salon.nombre}</span>
            </label>
          ))}
        </div>
        {!salonesSeleccionados.length && (
          <p className="text-xs text-danger mt-1">Selecciona al menos un salón</p>
        )}
      </div>

      {/* Período */}
      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
          Período
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted mb-1">Desde</p>
            <input
              type="date"
              value={fechaInicio}
              max={hoy()}
              onChange={e => setFechaInicio(e.target.value)}
              className={estiloInput}
            />
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Hasta</p>
            <input
              type="date"
              value={fechaFin}
              max={hoy()}
              onChange={e => setFechaFin(e.target.value)}
              className={estiloInput}
            />
          </div>
        </div>
        <div className="mt-2">
          <span className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full">
            {diasSeleccionados > 0 ? `${diasSeleccionados} días seleccionados` : "Rango inválido"}
          </span>
        </div>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={manejarDescargar}
          disabled={ocupado}
          className="btn-secondary flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {descargando
            ? <span className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
            : <MdDownload size={15} />
          }
          Descargar CSV
        </button>
        <button
          onClick={manejarGenerar}
          disabled={ocupado}
          className="btn-primary flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generando
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <MdAssessment size={15} />
          }
          Ver reporte
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
