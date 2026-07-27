import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { MdNotifications, MdMenu, MdLogin } from "react-icons/md"
import { useAuth } from "../../context/AuthContext"

export default function Topbar({ cantidadAlertas = 0, alAbrirMenu }) {
  const navegar = useNavigate()
  const { estaLogueado } = useAuth()
  const [alertasAbiertas, setAlertasAbiertas] = useState(false)

  return (
    <header className="fixed top-0 right-0 left-0 md:left-16 lg:left-60 h-14
                       bg-white/80 backdrop-blur-md border-b border-gray-100/80
                       flex items-center justify-between px-4 lg:px-6 z-30 transition-all duration-300">
      {/* Izquierda */}
      <button
        onClick={alAbrirMenu}
        className="md:hidden min-h-11 min-w-11 flex items-center justify-center rounded-xl text-muted hover:text-dark hover:bg-gray-100 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        aria-label="Abrir menú"
      >
        <MdMenu size={22} />
      </button>

      <div className="hidden md:block" />

      {/* Derecha */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setAlertasAbiertas(valor => !valor)}
            className="relative min-h-11 min-w-11 flex items-center justify-center rounded-xl text-muted hover:text-dark hover:bg-gray-100 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            aria-label="Ver alertas"
          >
            <MdNotifications size={19} />
            {cantidadAlertas > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5
                               bg-danger text-white text-[10px] font-bold rounded-full
                               flex items-center justify-center leading-none">
                {cantidadAlertas > 99 ? "99+" : cantidadAlertas}
              </span>
            )}
          </button>

          {alertasAbiertas && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-white shadow-card-md p-3 z-50">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest">Alertas</p>
              <p className="text-sm text-dark mt-2">
                {cantidadAlertas > 0
                  ? `${cantidadAlertas} alerta${cantidadAlertas === 1 ? "" : "s"} sin resolver`
                  : "Sin alertas sin resolver"}
              </p>
              <button
                onClick={() => {
                  setAlertasAbiertas(false)
                  navegar("/alerts")
                }}
                className="btn-primary w-full justify-center mt-3 text-sm"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>

        {!estaLogueado && (
          <button
            onClick={() => navegar("/login")}
            className="flex min-h-11 items-center gap-1.5 text-xs text-secondary font-semibold px-3 py-2 rounded-xl border border-secondary/25 hover:border-secondary/60 hover:bg-secondary hover:text-white transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <MdLogin size={14} />
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  )
}
