import { useState } from "react"
import { MdNotifications, MdNotificationsOff } from "react-icons/md"

import { useAuth } from "../../context/AuthContext"
import { useNotificacionesPush } from "../../hooks/useNotificacionesPush"

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MdNotifications size={22} className="text-secondary flex-shrink-0" />
          <div>
            <p className="font-semibold text-dark">Notificaciones push</p>
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

      <hr className="border-gray-100" />

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
        <>
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

          <button onClick={manejarPrueba} className="btn-secondary w-full text-sm">
            Enviar notificacion de prueba
          </button>

          {pruebaSent && (
            <span className="badge-success text-xs self-start">Enviada</span>
          )}
        </>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
