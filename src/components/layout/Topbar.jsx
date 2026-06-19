import { useNavigate } from "react-router-dom"
import { MdNotifications, MdMenu, MdLogin } from "react-icons/md"
import { useAuth } from "../../context/AuthContext"

export default function Topbar({ cantidadAlertas = 0, alAbrirMenu }) {
  const navegar = useNavigate()
  const { estaLogueado } = useAuth()

  return (
    <header className="fixed top-0 right-0 left-0 md:left-16 lg:left-60 h-14
                       bg-white/80 backdrop-blur-md border-b border-gray-100/80
                       flex items-center justify-between px-4 lg:px-6 z-30 transition-all duration-300">
      {/* Izquierda */}
      <button
        onClick={alAbrirMenu}
        className="md:hidden p-1.5 rounded-lg text-muted hover:text-dark hover:bg-gray-100 transition-colors active:scale-95"
        aria-label="Abrir menú"
      >
        <MdMenu size={22} />
      </button>

      <div className="hidden md:block" />

      {/* Derecha */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navegar("/alerts")}
          className="relative p-2 rounded-xl text-muted hover:text-dark hover:bg-gray-100 transition-all duration-150 active:scale-95"
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

        {!estaLogueado && (
          <button
            onClick={() => navegar("/login")}
            className="flex items-center gap-1.5 text-xs text-secondary font-semibold px-3 py-1.5 rounded-xl border border-secondary/25 hover:border-secondary/60 hover:bg-secondary hover:text-white transition-all duration-200 active:scale-95"
          >
            <MdLogin size={14} />
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  )
}
