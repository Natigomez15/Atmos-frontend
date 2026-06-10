import { useEffect, useState } from "react"
import { MdAdd, MdRemove } from "react-icons/md"
import { enviarComando } from "../../api/commands"
import AccionProtegida from "./AccionProtegida"

const estiloInput =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 " +
  "focus:border-secondary transition-colors text-dark"

const TIPOS_COMANDO = [
  { valor: "on",       etiqueta: "Encender" },
  { valor: "off",      etiqueta: "Apagar" },
  { valor: "setpoint", etiqueta: "Setpoint" },
]

export default function QuickCommandForm({ salones = [], alExito }) {
  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState("")
  const [tipoComando,         setTipoComando]         = useState("setpoint")
  const [setpoint,            setSetpoint]            = useState(24)
  const [enviando,            setEnviando]            = useState(false)
  const [resultado,           setResultado]           = useState(null)
  const [erroresFormulario,   setErroresFormulario]   = useState({})

  useEffect(() => {
    if (!resultado) return
    const temporizador = setTimeout(() => {
      setResultado(null)
      if (resultado === "exito") {
        setIdSalonSeleccionado("")
        setTipoComando("setpoint")
        setSetpoint(24)
      }
    }, 3000)
    return () => clearTimeout(temporizador)
  }, [resultado])

  function validarFormulario() {
    const errores = {}
    if (!idSalonSeleccionado) errores.salon = "Selecciona un salón"
    if (tipoComando === "setpoint" && (setpoint < 16 || setpoint > 30)) {
      errores.setpoint = "El setpoint debe estar entre 16°C y 30°C"
    }
    return errores
  }

  async function manejarEnvio(e) {
    e.preventDefault()
    const errores = validarFormulario()
    if (Object.keys(errores).length) {
      setErroresFormulario(errores)
      return
    }
    setErroresFormulario({})
    setEnviando(true)
    try {
      await enviarComando({
        room_id:      idSalonSeleccionado,
        command_type: tipoComando,
        setpoint:     tipoComando === "setpoint" ? setpoint : null,
        source:       "manual",
      })
      setResultado("exito")
      alExito?.()
    } catch {
      setResultado("error")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="card flex flex-col gap-4 h-full">
      <div>
        <p className="font-semibold text-dark text-sm">Enviar comando</p>
        <p className="text-xs text-muted mt-0.5">
          El ESP32 lo ejecutará en su próximo ciclo
        </p>
      </div>
      <hr className="border-gray-100" />

      {/* Salón */}
      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
          Salón
        </label>
        <select
          value={idSalonSeleccionado}
          onChange={e => {
            setIdSalonSeleccionado(e.target.value)
            setErroresFormulario(prev => ({ ...prev, salon: undefined }))
          }}
          className={estiloInput}
        >
          <option value="">Seleccionar salón...</option>
          {salones.map(salon => (
            <option key={salon.sala_id} value={salon.sala_id}>{salon.nombre}</option>
          ))}
        </select>
        {erroresFormulario.salon && (
          <p className="text-xs text-danger mt-1">{erroresFormulario.salon}</p>
        )}
      </div>

      {/* Tipo de comando */}
      <div>
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
          Tipo de comando
        </label>
        <div className="flex gap-2">
          {TIPOS_COMANDO.map(tipo => (
            <button
              key={tipo.valor}
              type="button"
              onClick={() => setTipoComando(tipo.valor)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                tipoComando === tipo.valor
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {tipo.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* Setpoint (solo visible si aplica) */}
      {tipoComando === "setpoint" && (
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Temperatura objetivo
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSetpoint(v => Math.max(16, v - 1))}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:bg-gray-50 transition-colors"
            >
              <MdRemove size={18} />
            </button>
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{setpoint}</span>
              <span className="text-sm text-muted"> °C</span>
            </div>
            <button
              type="button"
              onClick={() => setSetpoint(v => Math.min(30, v + 1))}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-muted hover:bg-gray-50 transition-colors"
            >
              <MdAdd size={18} />
            </button>
          </div>
          {erroresFormulario.setpoint && (
            <p className="text-xs text-danger mt-1 text-center">{erroresFormulario.setpoint}</p>
          )}
        </div>
      )}

      {/* Botón enviar */}
      <AccionProtegida requiereRol="mantenimiento">
        <button
          type="submit"
          disabled={enviando}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          Mandar comando
        </button>
      </AccionProtegida>

      {/* Resultado */}
      {resultado === "exito" && (
        <p className="text-xs text-success font-medium text-center">✓ Comando enviado correctamente</p>
      )}
      {resultado === "error" && (
        <p className="text-xs text-danger font-medium text-center">✗ Error al enviar el comando</p>
      )}
    </form>
  )
}
