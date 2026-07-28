import { NavLink, useNavigate } from "react-router-dom"
import {
  MdAir,
  MdAssessment,
  MdAutoAwesome,
  MdAutoGraph,
  MdClose,
  MdDashboard,
  MdLogout,
  MdMeetingRoom,
  MdMonitor,
  MdSettings,
} from "react-icons/md"

import logoAtmos from "../../assets/logo_atmos.png"
import { useAuth } from "../../context/AuthContext"

const NAVEGACION_PUBLICA = [
  { etiqueta: "Dashboard", icono: MdDashboard, ruta: "/dashboard" },
  { etiqueta: "Espacios", icono: MdMeetingRoom, ruta: "/rooms" },
  { etiqueta: "Monitoreo", icono: MdMonitor, ruta: "/monitoring" },
  { etiqueta: "Predicciones", icono: MdAutoGraph, ruta: "/predictions" },
  { etiqueta: "ATMOS IA", icono: MdAutoAwesome, ruta: "/atmos-ia" },
]

const NAVEGACION_AUTENTICADA = [
  { etiqueta: "Control AC", icono: MdAir, ruta: "/commands" },
  { etiqueta: "Reportes", icono: MdAssessment, ruta: "/reports" },
]

const ACCESO_AJUSTES = {
  etiqueta: "Ajustes",
  icono: MdSettings,
  ruta: "/settings",
}

const ETIQUETAS_ROL = {
  admin: "Administrador",
  mantenimiento: "Mantenimiento",
  usuario: "Usuario",
}

const CLASE_ITEM =
  "group relative mx-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm " +
  "text-muted transition-colors duration-150 hover:bg-gray-50 hover:text-dark " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30"

const CLASE_ACTIVA =
  "bg-secondary/10 text-secondary font-medium hover:bg-secondary/15 hover:text-secondary"

function ElementoNav({ elemento }) {
  const Icono = elemento.icono

  return (
    <NavLink
      to={elemento.ruta}
      title={elemento.etiqueta}
      className={({ isActive }) => `${CLASE_ITEM} ${isActive ? CLASE_ACTIVA : ""}`}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-secondary"
              aria-hidden="true"
            />
          )}
          <Icono
            size={19}
            className="shrink-0 opacity-100"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate md:hidden lg:block">
            {elemento.etiqueta}
          </span>
        </>
      )}
    </NavLink>
  )
}

function Iniciales({ nombre }) {
  const partes = (nombre ?? "U").trim().split(/\s+/)
  const iniciales = partes.length >= 2
    ? `${partes[0][0]}${partes[partes.length - 1][0]}`
    : partes[0].slice(0, 2)
  return iniciales.toUpperCase()
}

export default function Sidebar({ estaAbierto = false, alCerrar }) {
  const { estaLogueado, perfil, cerrarSesion } = useAuth()
  const navegar = useNavigate()

  async function manejarCerrarSesion() {
    await cerrarSesion()
    navegar("/login")
  }

  return (
    <>
      {estaAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={alCerrar}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        aria-label="Navegación principal"
        className={`fixed left-0 top-0 z-50 flex h-dvh w-64 shrink-0 flex-col border-r border-gray-100 bg-white transition-transform duration-300 ease-out md:w-16 md:translate-x-0 lg:w-60 ${
          estaAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative flex h-14 shrink-0 items-center justify-center overflow-hidden border-b border-gray-100 px-4 lg:h-24 lg:px-2">
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar menú"
            className="absolute right-2 flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-gray-100 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 md:hidden"
          >
            <MdClose size={20} aria-hidden="true" />
          </button>

          <img
            src={logoAtmos}
            alt="ATMOS"
            className="h-7 w-auto object-contain lg:hidden"
          />
          <img
            src="/LOGO1.png"
            alt="ATMOS"
            className="hidden h-auto w-[205px] max-w-none object-contain object-center lg:block"
          />
        </div>

        <nav className="hide-scrollbar flex-1 overflow-y-auto py-3" aria-label="Secciones de ATMOS">
          <div className="flex flex-col gap-1">
            {NAVEGACION_PUBLICA.map(elemento => (
              <ElementoNav key={elemento.ruta} elemento={elemento} />
            ))}
            {estaLogueado && NAVEGACION_AUTENTICADA.map(elemento => (
              <ElementoNav key={elemento.ruta} elemento={elemento} />
            ))}
          </div>

          {estaLogueado && (
            <div className="mx-2 mt-3 border-t border-gray-100 pt-3">
              <ElementoNav elemento={ACCESO_AJUSTES} />
            </div>
          )}
        </nav>

        {perfil && (
          <footer className="shrink-0 border-t border-gray-100 px-3 py-3 md:hidden lg:block">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => navegar("/settings")}
                className="group -mx-1 flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-xs font-bold text-primary">
                  <Iniciales nombre={perfil.nombre} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold leading-tight text-dark">
                    {perfil.nombre}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-medium text-muted">
                    {ETIQUETAS_ROL[perfil.rol] ?? perfil.rol ?? "Usuario"}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={manejarCerrarSesion}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                <MdLogout size={18} aria-hidden="true" />
              </button>
            </div>
          </footer>
        )}
      </aside>
    </>
  )
}
