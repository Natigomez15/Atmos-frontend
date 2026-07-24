import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MdAdd, MdRemove, MdLockOutline } from "react-icons/md"
import { enviarComando } from "../../api/commands"
import { obtenerAiresDeSalon } from "../../api/monitoring"
import { useAuth } from "../../context/AuthContext"

const estiloInput =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 " +
  "focus:border-secondary transition-colors text-dark"

const TIPOS_COMANDO = [
  { valor: "on", etiqueta: "Encender" },
  { valor: "off", etiqueta: "Apagar" },
  { valor: "setpoint", etiqueta: "Setpoint" },
]

const ETIQUETAS_COMANDO = Object.fromEntries(
  TIPOS_COMANDO.map(tipo => [tipo.valor, tipo.etiqueta])
)

function detalleComando(tipoComando, setpoint) {
  if (tipoComando === "setpoint") return `Setpoint ${setpoint} C`
  return ETIQUETAS_COMANDO[tipoComando] ?? tipoComando
}

export default function QuickCommandForm({ salones = [], alExito }) {
  const { estaLogueado } = useAuth()
  const puedeEnviar = estaLogueado

  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState("")
  const [aireElegido, setAireElegido] = useState(null)
  const [tipoComando, setTipoComando] = useState("setpoint")
  const [setpoint, setSetpoint] = useState(24)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [mensajeError, setMensajeError] = useState("")
  const [erroresFormulario, setErroresFormulario] = useState({})

  const salonSeleccionado =
    salones.find(s => String(s.sala_id) === String(idSalonSeleccionado)) ?? null

  const { data: airesDisponibles = [], isFetching: cargandoAires } = useQuery({
    queryKey: ["aires-comando", idSalonSeleccionado],
    queryFn: () => obtenerAiresDeSalon(salonSeleccionado),
    enabled: !!salonSeleccionado,
  })

  const aireActivo = aireElegido ?? airesDisponibles[0] ?? ""

  function seleccionarSalon(idSalon) {
    setIdSalonSeleccionado(idSalon)
    setAireElegido(null)
    setErroresFormulario(prev => ({ ...prev, salon: undefined, aire: undefined }))
  }

  useEffect(() => {
    if (!resultado) return
    const temporizador = setTimeout(() => {
      setResultado(null)
      if (resultado === "exito") {
        setIdSalonSeleccionado("")
        setAireElegido(null)
        setTipoComando("setpoint")
        setSetpoint(24)
      }
    }, 3000)
    return () => clearTimeout(temporizador)
  }, [resultado])

  function validarFormulario() {
    const errores = {}
    if (!idSalonSeleccionado) errores.salon = "Selecciona un espacio"
    if (idSalonSeleccionado && airesDisponibles.length && !aireActivo) {
      errores.aire = "Selecciona un aire"
    }
    if (tipoComando === "setpoint" && (setpoint < 16 || setpoint > 30)) {
      errores.setpoint = "El setpoint debe estar entre 16 C y 30 C"
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
    setMensajeError("")
    setEnviando(true)
    try {
      await enviarComando({
        room_id: idSalonSeleccionado,
        pabellon: salonSeleccionado?.pabellon ?? salonSeleccionado?.pavilion ?? salonSeleccionado?.edificio,
        aire: aireActivo || undefined,
        command_type: tipoComando,
        setpoint: tipoComando === "setpoint" ? setpoint : null,
        source: "manual",
      })
      setResultado("exito")
      alExito?.()
    } catch (error) {
      const detalle = error?.response?.data?.detail
      setMensajeError(
        (typeof detalle === "string" ? detalle : detalle?.mensaje || detalle?.motivo) ||
        "No se pudo conectar con el backend."
      )
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
          El ESP32 lo ejecutara en su proximo ciclo
        </p>
      </div>
      <hr className="border-gray-100" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
            Salon
          </label>
          <select
            value={idSalonSeleccionado}
            onChange={e => seleccionarSalon(e.target.value)}
            className={estiloInput}
          >
            <option value="">Seleccionar espacio...</option>
            {salones.map(salon => (
              <option key={salon.sala_id} value={salon.sala_id}>{salon.nombre}</option>
            ))}
          </select>
          {erroresFormulario.salon && (
            <p className="text-xs text-danger mt-1">{erroresFormulario.salon}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
            Aire
          </label>
          <select
            value={aireActivo}
            onChange={e => {
              setAireElegido(e.target.value)
              setErroresFormulario(prev => ({ ...prev, aire: undefined }))
            }}
            disabled={!idSalonSeleccionado || cargandoAires || !airesDisponibles.length}
            className={`${estiloInput} disabled:bg-gray-50 disabled:text-muted disabled:cursor-not-allowed`}
          >
            {!idSalonSeleccionado ? (
              <option value="">Elige un espacio primero</option>
            ) : cargandoAires ? (
              <option value="">Cargando aires...</option>
            ) : !airesDisponibles.length ? (
              <option value="">Sin aires registrados</option>
            ) : (
              airesDisponibles.map(aire => (
                <option key={aire} value={aire}>{aire}</option>
              ))
            )}
          </select>
          {erroresFormulario.aire && (
            <p className="text-xs text-danger mt-1">{erroresFormulario.aire}</p>
          )}
        </div>
      </div>

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
              <span className="text-sm text-muted"> C</span>
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

      {idSalonSeleccionado && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-muted">
          Se enviara <span className="font-semibold text-dark">{detalleComando(tipoComando, setpoint)}</span>
          {" "}a <span className="font-semibold text-dark">{salonSeleccionado?.nombre}</span>
          {aireActivo && <> · <span className="font-semibold text-dark">{aireActivo}</span></>}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando || !puedeEnviar}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enviando && (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        {enviando ? "Enviando..." : `Enviar ${detalleComando(tipoComando, setpoint)}`}
      </button>

      {!puedeEnviar && (
        <p className="flex items-start gap-1.5 text-xs text-muted">
          <MdLockOutline size={14} className="mt-0.5 shrink-0" />
          Inicia sesion para enviar comandos.
        </p>
      )}

      {resultado === "exito" && (
        <p className="text-xs text-success font-medium text-center">
          Comando enviado correctamente. Aparecera en la tabla como pendiente.
        </p>
      )}
      {resultado === "error" && (
        <p className="text-xs text-danger font-medium text-center">
          {mensajeError || "Error al enviar el comando. Revisa la conexión con backend/Firebase."}
        </p>
      )}
    </form>
  )
}
