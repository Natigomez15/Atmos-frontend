import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { MdNotifications, MdMenu, MdLogin, MdLogout, MdPerson } from "react-icons/md"
import { useAuth } from "../../context/AuthContext"

const TITULOS_PAGINA = {
  "/dashboard":   "Panel de Control",
  "/rooms":       "Salones",
  "/monitoring":  "Monitoreo en Tiempo Real",
  "/commands":    "Comandos AC",
  "/predictions": "Predicciones ML",
  "/alerts":      "Alertas",
  "/reports":     "Reportes",
  "/nodes":       "Nodos ESP32",
  "/users":       "Usuarios",
  "/settings":    "Ajustes",
}

function formatearFecha(fecha) {
  return fecha.toLocaleString("es-PE", {
    weekday: "short",
    day:     "2-digit",
    month:   "short",
    year:    "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
    hour12:  false,
  })
}

export default function Topbar({ cantidadAlertas = 0, wsConectado = false, alAbrirMenu }) {
  const ubicacion          = useLocation()
  const navegar            = useNavigate()
  const { usuario, cerrarSesion } = useAuth()
  const titulo             = TITULOS_PAGINA[ubicacion.pathname] ?? "ATMOS"

  const [ahora, setAhora] = useState(() => formatearFecha(new Date()))

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(formatearFecha(new Date())), 60000)
    return () => clearInterval(intervalo)
  }, [])

  const nombreUsuario = usuario?.user_metadata?.name
    ?? usuario?.email?.split("@")[0]
    ?? null

  async function manejarCerrarSesion() {
    await cerrarSesion()
    navegar("/dashboard", { replace: true })
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-16 lg:left-60 h-16 bg-white border-b border-gray-100
                       flex items-center justify-between px-4 lg:px-6 z-30 transition-all duration-300">
      {/* Izquierda */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={alAbrirMenu}
          className="md:hidden text-dark flex-shrink-0"
          aria-label="Abrir menú"
        >
          <MdMenu size={24} />
        </button>
        <h1 className="text-base lg:text-lg font-semibold text-dark truncate">{titulo}</h1>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
        {/* Estado WebSocket */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wsConectado ? "bg-success animate-pulse" : "bg-danger"}`} />
          <span className="hidden md:block text-xs text-muted">
            {wsConectado ? "Conectado" : "Desconectado"}
          </span>
        </div>

        {/* Campana */}
        <button
          onClick={() => navegar("/alerts")}
          className="relative cursor-pointer text-muted hover:text-dark transition-colors"
          aria-label="Ver alertas"
        >
          <MdNotifications size={20} />
          {cantidadAlertas > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5
                             bg-danger text-white text-[10px] font-medium rounded-full
                             flex items-center justify-center">
              {cantidadAlertas}
            </span>
          )}
        </button>

        {/* Fecha/hora — oculta en mobile */}
        <span className="hidden md:block text-xs text-muted">{ahora}</span>

        {/* Auth */}
        {usuario ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-dark">
              <MdPerson size={15} className="text-secondary" />
              <span className="max-w-[120px] truncate">{nombreUsuario}</span>
            </div>
            <button
              onClick={manejarCerrarSesion}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-danger transition-colors px-2 py-1.5 rounded-lg hover:bg-danger/5"
            >
              <MdLogout size={16} />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => navegar("/login")}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <MdLogin size={15} />
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  )
}
