import { useEffect, useState } from "react"
import { MdNotificationsActive, MdNotificationsOff } from "react-icons/md"

import { useAuth } from "../../context/AuthContext"
import { useNotificacionesPush } from "../../hooks/useNotificacionesPush"

const CLAVE_OCULTAR_PROMPT = "atmos_push_prompt_dismissed"

export default function PromptNotificacionesPush() {
  const { estaLogueado } = useAuth()
  const {
    compatible,
    permiso,
    suscrito,
    cargando,
    error,
    suscribirse,
  } = useNotificacionesPush()
  const [oculto, setOculto] = useState(true)

  useEffect(() => {
    const fueOcultado = localStorage.getItem(CLAVE_OCULTAR_PROMPT) === "true"
    setOculto(fueOcultado)
  }, [])

  if (!estaLogueado || !compatible || suscrito || permiso !== "default" || oculto) {
    return null
  }

  async function activar() {
    const activado = await suscribirse()
    if (activado) {
      localStorage.removeItem(CLAVE_OCULTAR_PROMPT)
    }
  }

  function ocultar() {
    localStorage.setItem(CLAVE_OCULTAR_PROMPT, "true")
    setOculto(true)
  }

  return (
    <div className="card border-l-4 border-l-secondary mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
          <MdNotificationsActive size={22} className="text-secondary" />
        </div>
        <div>
          <p className="font-semibold text-dark">¿Quieres recibir alertas de ATMOS?</p>
          <p className="text-sm text-muted mt-1">
            Te avisaremos cuando se cree una alerta real, incluso si no tienes la pagina abierta.
          </p>
          {error && (
            <p className="text-xs text-danger mt-2 flex items-center gap-1">
              <MdNotificationsOff size={14} /> {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 md:flex-shrink-0">
        <button
          onClick={activar}
          disabled={cargando}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? "Activando..." : "Activar notificaciones"}
        </button>
        <button onClick={ocultar} className="btn-secondary">
          Ahora no
        </button>
      </div>
    </div>
  )
}
