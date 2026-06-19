import { useState } from "react"
import { MdNotifications, MdNotificationsOff, MdBedtime } from "react-icons/md"

import { useAuth } from "../../context/AuthContext"
import { useNotificacionesPush } from "../../hooks/useNotificacionesPush"

export default function TarjetaNotificaciones() {
  const { estaLogueado } = useAuth()
  const [silenciosoActivo, setSilenciosoActivo] = useState(false)
  const [horarioDesde,     setHorarioDesde]     = useState("22:00")
  const [horarioHasta,     setHorarioHasta]     = useState("06:00")
  const {
    suscrito,
    cargando,
    error,
    compatible,
    suscribirse,
    cancelarSuscripcion,
    enviarPrueba,
  } = useNotificacionesPush()
  const [pruebaSent, setPruebaSent] = useState(false)

  if (!estaLogueado) return null

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
      <div id="notificaciones" className="card flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <MdNotificationsOff size={20} className="text-muted" />
        </div>
        <div>
          <p className="font-semibold text-dark">Notificaciones push</p>
          <p className="text-sm text-muted mt-1">
            Tu navegador no soporta notificaciones push.
          </p>
        </div>
      </div>
    )
  }

  return (
    <section id="notificaciones" className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <MdNotifications size={20} className="text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide">Alertas</p>
            <h2 className="font-semibold text-dark mt-0.5">Notificaciones push</h2>
            <p className="text-xs text-muted mt-0.5">
              Recibe alertas reales de ATMOS en este dispositivo.
            </p>
          </div>
        </div>

        {suscrito
          ? <span className="badge-success text-xs whitespace-nowrap">Activadas</span>
          : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-muted font-medium whitespace-nowrap">Desactivadas</span>
        }
      </div>

      <div className="rounded-2xl bg-secondary/5 border border-secondary/10 p-4">
        <p className="text-sm font-medium text-dark">
          {suscrito ? "Este dispositivo esta conectado." : "Activa este dispositivo para recibir alertas."}
        </p>
        <p className="text-xs text-muted mt-1">
          Las pruebas push validan navegador, service worker, backend y Supabase.
        </p>
      </div>

      {!suscrito ? (
        <button
          onClick={suscribirse}
          disabled={cargando}
          className="btn-primary w-full sm:w-fit flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          Activar notificaciones
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={manejarPrueba} className="btn-secondary w-full text-sm">
            Enviar notificacion de prueba
          </button>

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
            Desactivar
          </button>

          {pruebaSent && (
            <span className="badge-success text-xs self-start sm:col-span-2">Notificacion enviada</span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Horario silencioso */}
      <div className="rounded-2xl bg-white border border-gray-100 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-dark">Horario silencioso</p>
            <p className="text-xs text-muted mt-1">Pausa las notificaciones no críticas en este rango.</p>
          </div>

          <button
            aria-pressed={silenciosoActivo}
            onClick={() => setSilenciosoActivo(s => !s)}
            className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors focus:outline-none ${silenciosoActivo ? 'bg-secondary' : 'bg-gray-200'}`}
            title={silenciosoActivo ? 'Silencioso activado' : 'Silencioso desactivado'}
          >
            <span className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-sm transition-transform ${silenciosoActivo ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Desde</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2">
              <MdBedtime size={15} className="text-muted flex-shrink-0" />
              <input
                type="time"
                value={horarioDesde}
                onChange={e => setHorarioDesde(e.target.value)}
                disabled={!silenciosoActivo}
                className="w-full bg-transparent text-sm font-semibold text-dark focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <span className="text-xs text-muted mt-5 flex-shrink-0">→</span>

          <div className="flex-1">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Hasta</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <input
                type="time"
                value={horarioHasta}
                onChange={e => setHorarioHasta(e.target.value)}
                disabled={!silenciosoActivo}
                className="w-full bg-transparent text-sm font-semibold text-dark focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
