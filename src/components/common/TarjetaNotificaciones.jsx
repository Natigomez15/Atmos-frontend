import { useState } from "react"
import { MdNotifications, MdNotificationsOff } from "react-icons/md"
import { useAuth } from "../../context/AuthContext"
import { useNotificacionesPush } from "../../hooks/useNotificacionesPush"

const DIAS_SEMANA = [
  { etiqueta: "L", valor: 0 },
  { etiqueta: "M", valor: 1 },
  { etiqueta: "X", valor: 2 },
  { etiqueta: "J", valor: 3 },
  { etiqueta: "V", valor: 4 },
  { etiqueta: "S", valor: 5 },
  { etiqueta: "D", valor: 6 },
]

function formatearHora(hora) {
  if (hora === 0)  return "12:00 AM"
  if (hora < 12)  return `${hora}:00 AM`
  if (hora === 12) return "12:00 PM"
  return `${hora - 12}:00 PM`
}

function SelectHora({ etiqueta, valor, alCambiar }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted font-medium">{etiqueta}</label>
      <select
        value={valor}
        onChange={e => alCambiar(Number(e.target.value))}
        className="border border-gray-200 rounded-xl px-2 py-1.5 text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>{formatearHora(i)}</option>
        ))}
      </select>
    </div>
  )
}

export default function TarjetaNotificaciones() {
  const { estaLogueado } = useAuth()
  const {
    suscrito,
    cargando,
    error,
    compatible,
    suscribirse,
    cancelarSuscripcion,
    enviarPrueba,
    actualizarHorario,
  } = useNotificacionesPush()

  const [diasActivos,      setDiasActivos]      = useState([0, 1, 2, 3, 4])
  const [horaInicio,       setHoraInicio]        = useState(7)
  const [horaFin,          setHoraFin]           = useState(18)
  const [guardandoHorario, setGuardandoHorario]  = useState(false)
  const [horarioGuardado,  setHorarioGuardado]   = useState(false)
  const [pruebaSent,       setPruebaSent]         = useState(false)

  if (!estaLogueado) return null

  function toggleDia(dia) {
    setDiasActivos(prev =>
      prev.includes(dia)
        ? prev.filter(d => d !== dia)
        : [...prev, dia].sort((a, b) => a - b)
    )
  }

  async function guardarHorario() {
    setGuardandoHorario(true)
    try {
      await actualizarHorario({
        dias_activos: diasActivos.join(","),
        hora_inicio:  horaInicio,
        hora_fin:     horaFin,
      })
      setHorarioGuardado(true)
      setTimeout(() => setHorarioGuardado(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setGuardandoHorario(false)
    }
  }

  async function manejarPrueba() {
    try {
      await enviarPrueba()
      setPruebaSent(true)
      setTimeout(() => setPruebaSent(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  if (!compatible) {
    return (
      <div className="card flex items-start gap-3">
        <MdNotificationsOff size={22} className="text-muted flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted">
          Tu navegador no soporta notificaciones push.
        </p>
      </div>
    )
  }

  return (
    <div className="card flex flex-col gap-4">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MdNotifications size={22} className="text-secondary flex-shrink-0" />
          <div>
            <p className="font-semibold text-dark">Notificaciones push</p>
            <p className="text-xs text-muted mt-0.5">Recibe alertas en tu dispositivo</p>
          </div>
        </div>

        {suscrito
          ? <span className="badge-success text-xs whitespace-nowrap">Activadas</span>
          : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-muted font-medium whitespace-nowrap">Desactivadas</span>
        }
      </div>

      <hr className="border-gray-100" />

      {/* Botón principal */}
      {!suscrito ? (
        <button
          onClick={suscribirse}
          disabled={cargando}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          Activar notificaciones
        </button>
      ) : (
        <button
          onClick={cancelarSuscripcion}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 border border-danger/30 text-danger
                     rounded-xl px-4 py-2 text-sm font-medium hover:bg-danger/5 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando && (
            <span className="w-4 h-4 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
          )}
          Desactivar notificaciones
        </button>
      )}

      {/* Sección horario — solo si está suscrito */}
      {suscrito && (
        <>
          <hr className="border-gray-100" />

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-dark">Horario de notificaciones</p>
              <p className="text-xs text-muted">Solo recibirás alertas en este horario</p>
            </div>

            {/* Días de la semana */}
            <div className="flex gap-1.5 flex-wrap">
              {DIAS_SEMANA.map(({ etiqueta, valor }) => {
                const activo = diasActivos.includes(valor)
                return (
                  <button
                    key={valor}
                    onClick={() => toggleDia(valor)}
                    className={`w-8 h-8 text-xs font-medium rounded-full transition-colors
                      ${activo
                        ? "bg-secondary text-white"
                        : "bg-gray-100 text-muted hover:bg-gray-200"
                      }`}
                  >
                    {etiqueta}
                  </button>
                )
              })}
            </div>

            {/* Horas */}
            <div className="flex gap-3">
              <SelectHora etiqueta="Desde" valor={horaInicio} alCambiar={setHoraInicio} />
              <SelectHora etiqueta="Hasta" valor={horaFin}    alCambiar={setHoraFin} />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={guardarHorario}
                disabled={guardandoHorario}
                className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardandoHorario ? "Guardando…" : "Guardar horario"}
              </button>
              {horarioGuardado && (
                <span className="badge-success text-xs">Horario guardado</span>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Notificación de prueba */}
          <div className="flex items-center gap-3">
            <button
              onClick={manejarPrueba}
              className="btn-secondary w-full text-sm"
            >
              Enviar notificación de prueba
            </button>
            {pruebaSent && (
              <span className="badge-success text-xs whitespace-nowrap">¡Enviada!</span>
            )}
          </div>
        </>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
