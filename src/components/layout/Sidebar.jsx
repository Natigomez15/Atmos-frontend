import { NavLink, useNavigate } from "react-router-dom"
import { MdClose, MdLogout } from "react-icons/md"
import logoAtmos from "../../assets/logo_atmos.png"
import {
  MdDashboard,
  MdMeetingRoom,
  MdMonitor,
  MdGridView,
  MdAir,
  MdAutoGraph,
  MdNotifications,
  MdAssessment,
  MdRouter,
  MdSettings,
  MdPeople,
} from "react-icons/md"
import { useAuth } from "../../context/AuthContext"

const navPublico = [
  { etiqueta: "Dashboard",  icono: MdDashboard,     ruta: "/dashboard" },
  { etiqueta: "Laboratorios", icono: MdMeetingRoom, ruta: "/rooms" },
  { etiqueta: "Monitoreo",  icono: MdMonitor,       ruta: "/monitoring" },
  { etiqueta: "Predicciones ML", icono: MdAutoGraph, ruta: "/predictions" },
  { etiqueta: "Alertas",    icono: MdNotifications, ruta: "/alerts" },
]

const navAutenticado = [
  { etiqueta: "Comandos AC", icono: MdAir,       ruta: "/commands" },
  { etiqueta: "Reportes",    icono: MdAssessment, ruta: "/reports" },
  { etiqueta: "Ajustes",     icono: MdSettings,  ruta: "/settings" },
]

const navAdmin = [
  { etiqueta: "Nodos ESP32",     icono: MdRouter,    ruta: "/nodes" },
  { etiqueta: "Usuarios",        icono: MdPeople,    ruta: "/users" },
]

const estiloBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl mx-2 text-sm text-muted " +
  "hover:bg-gray-50 hover:text-dark transition-colors duration-200"
const estiloActivo = "bg-secondary/10 text-secondary font-medium"

function ElementoNav({ elemento, cantidadAlertas }) {
  const Icono = elemento.icono
  return (
    <NavLink
      to={elemento.ruta}
      title={elemento.etiqueta}
      className={({ isActive }) =>
        isActive ? `${estiloBase} ${estiloActivo}` : estiloBase
      }
    >
      <Icono size={18} className="flex-shrink-0" />
      <span className="block md:hidden lg:block flex-1">{elemento.etiqueta}</span>
      {elemento.ruta === "/alerts" && cantidadAlertas > 0 && (
        <span className="relative flex items-center justify-center w-5 h-5 flex md:hidden lg:flex">
          <span className="absolute inline-flex w-full h-full rounded-full bg-danger opacity-40 animate-ping" />
          <span className="relative flex items-center justify-center w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold leading-none">
            {cantidadAlertas > 9 ? "9+" : cantidadAlertas}
          </span>
        </span>
      )}
      {elemento.ruta === "/alerts" && cantidadAlertas > 0 && (
        <span className="lg:hidden absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
      )}
    </NavLink>
  )
}

const ETIQUETAS_ROL = {
  admin:         "Administrador",
  mantenimiento: "Mantenimiento",
  usuario:       "Usuario",
}

export default function Sidebar({ cantidadAlertas = 0, estaAbierto = false, alCerrar }) {
  const { estaLogueado, esAdmin, perfil, cerrarSesion } = useAuth()
  const navegar = useNavigate()

  async function manejarCerrarSesion() {
    await cerrarSesion()
    navegar("/login")
  }

  return (
    <>
      {estaAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={alCerrar}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full bg-white border-r border-gray-100
          flex flex-col flex-shrink-0 z-50
          transition-transform duration-300 ease-in-out
          w-64 md:w-16 lg:w-60
          ${estaAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="px-4 pt-6 pb-4 flex flex-col items-center relative">
          <button
            onClick={alCerrar}
            className="md:hidden absolute right-3 top-4 text-muted hover:text-dark transition-colors"
          >
            <MdClose size={20} />
          </button>

          <img
            src={logoAtmos}
            alt="ATMOS"
            className="h-10 w-auto object-contain mx-auto"
          />
          <hr className="mt-4 border-gray-100 w-full" />
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-0 py-2 overflow-y-auto hide-scrollbar">
          <p className="block md:hidden lg:block px-6 mb-2 text-xs font-semibold text-muted uppercase tracking-wider">
            Menú Principal
          </p>
          <div className="flex flex-col gap-0.5">
            {navPublico.map(elemento => (
              <div key={elemento.ruta} className="relative">
                <ElementoNav elemento={elemento} cantidadAlertas={cantidadAlertas} />
              </div>
            ))}

            {estaLogueado && navAutenticado.map(elemento => (
              <div key={elemento.ruta} className="relative">
                <ElementoNav elemento={elemento} cantidadAlertas={cantidadAlertas} />
              </div>
            ))}
          </div>

          {esAdmin && (
            <>
              <p className="block md:hidden lg:block px-6 mt-6 mb-2 text-xs font-semibold text-muted uppercase tracking-wider">
                Sistema
              </p>
              <div className="flex flex-col gap-0.5 mt-4 lg:mt-0">
                {navAdmin.map(elemento => (
                  <div key={elemento.ruta} className="relative">
                    <ElementoNav elemento={elemento} cantidadAlertas={cantidadAlertas} />
                  </div>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Pie — perfil + cerrar sesión */}
        {perfil && (
          <div className="px-3 py-4 border-t border-gray-100 block md:hidden lg:block">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => navegar("/settings")}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-70 transition-opacity"
              >
                <img
                  src={logoAtmos}
                  alt="perfil"
                  className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 object-contain p-1 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-dark truncate">{perfil.nombre}</p>
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    {ETIQUETAS_ROL[perfil.rol] ?? perfil.rol ?? "Usuario"}
                  </p>
                </div>
              </button>
              <button
                onClick={manejarCerrarSesion}
                title="Cerrar sesión"
                className="shrink-0 p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <MdLogout size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
