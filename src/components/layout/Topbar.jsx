import { useNavigate } from "react-router-dom"
import { MdNotifications, MdMenu, MdLogin, MdLogout } from "react-icons/md"
import { useAuth } from "../../context/AuthContext"

export default function Topbar({ cantidadAlertas = 0, alAbrirMenu }) {
  const navegar = useNavigate()
  const { estaLogueado, cerrarSesion } = useAuth()

  async function manejarCerrarSesion() {
    await cerrarSesion()
    navegar("/dashboard", { replace: true })
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-16 lg:left-60 h-14 bg-white border-b border-gray-100
                       flex items-center justify-between px-4 lg:px-6 z-30 transition-all duration-300">
      {/* Izquierda — hamburguesa solo en móvil */}
      <button
        onClick={alAbrirMenu}
        className="md:hidden text-dark"
        aria-label="Abrir menú"
      >
        <MdMenu size={24} />
      </button>

      {/* Espacio vacío en desktop para empujar derecha */}
      <div className="hidden md:block" />

      {/* Derecha — campana + logout */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navegar("/alerts")}
          className="relative text-muted hover:text-dark transition-colors"
          aria-label="Ver alertas"
        >
          <MdNotifications size={20} />
          {cantidadAlertas > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5
                             bg-danger text-white text-[10px] font-medium rounded-full
                             flex items-center justify-center">
              {cantidadAlertas > 99 ? "99+" : cantidadAlertas}
            </span>
          )}
        </button>

        {estaLogueado ? (
          <button
            onClick={manejarCerrarSesion}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 text-xs text-muted hover:text-danger transition-colors px-2 py-1.5 rounded-lg hover:bg-danger/5"
          >
            <MdLogout size={16} />
            <span className="hidden sm:block">Salir</span>
          </button>
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
