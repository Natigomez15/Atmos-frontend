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

import AtmosIAIcon from "../atmos-ia/AtmosIAIcon"
import { useAuth } from "../../context/AuthContext"


const navPublico = [
  {
    etiqueta: "Dashboard",
    icono: MdDashboard,
    ruta: "/dashboard",
  },
  {
    etiqueta: "Espacios",
    icono: MdMeetingRoom,
    ruta: "/rooms",
  },
  {
    etiqueta: "Monitoreo",
    icono: MdMonitor,
    ruta: "/monitoring",
  },
  {
    etiqueta: "Predicciones ML",
    icono: MdAutoGraph,
    ruta: "/predictions",
  },

  // ==========================================
  // ATMOS IA
  // ==========================================
  {
    etiqueta: "ATMOS IA",
    icono: AtmosIAIcon,
    ruta: "/atmos-ia",
  },

  {
    etiqueta: "Alertas",
    icono: MdNotifications,
    ruta: "/alerts",
  },
]


const navAutenticado = [
  {
    etiqueta: "Comandos AC",
    icono: MdAir,
    ruta: "/commands",
  },
  {
    etiqueta: "Reportes",
    icono: MdAssessment,
    ruta: "/reports",
  },
  {
    etiqueta: "Ajustes",
    icono: MdSettings,
    ruta: "/settings",
  },
]


const navAdmin = [
  {
    etiqueta: "Nodos ESP32",
    icono: MdRouter,
    ruta: "/nodes",
  },
  {
    etiqueta: "Usuarios",
    icono: MdPeople,
    ruta: "/users",
  },
]


const estiloBase =
  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl mx-2 text-sm text-muted " +
  "hover:bg-gray-50 hover:text-dark transition-all duration-150 group"

const estiloActivo =
  "bg-secondary/10 text-secondary font-medium hover:bg-secondary/15"


function ElementoNav({
  elemento,
  cantidadAlertas,
}) {
  const Icono = elemento.icono

  return (
    <NavLink
      to={elemento.ruta}
      title={elemento.etiqueta}
      className={({ isActive }) =>
        isActive
          ? `${estiloBase} ${estiloActivo}`
          : estiloBase
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="
                absolute
                left-0
                top-1/2
                -translate-y-1/2
                w-0.5
                h-5
                bg-secondary
                rounded-full
              "
            />
          )}

          <Icono
            size={18}
            className="
              flex-shrink-0
              transition-transform
              duration-150
              group-hover:scale-105
            "
          />

          <span
            className="
              block
              md:hidden
              lg:block
              flex-1
              truncate
            "
          >
            {elemento.etiqueta}
          </span>

          {elemento.ruta === "/alerts" &&
            cantidadAlertas > 0 && (
              <span
                className="
                  relative
                  flex
                  items-center
                  justify-center
                  w-5
                  h-5
                  block
                  md:hidden
                  lg:flex
                "
              >
                <span
                  className="
                    absolute
                    inline-flex
                    w-full
                    h-full
                    rounded-full
                    bg-danger
                    opacity-30
                    animate-ping
                  "
                />

                <span
                  className="
                    relative
                    flex
                    items-center
                    justify-center
                    w-4
                    h-4
                    rounded-full
                    bg-danger
                    text-white
                    text-[10px]
                    font-bold
                    leading-none
                  "
                >
                  {cantidadAlertas > 9
                    ? "9+"
                    : cantidadAlertas}
                </span>
              </span>
            )}

          {elemento.ruta === "/alerts" &&
            cantidadAlertas > 0 && (
              <span
                className="
                  lg:hidden
                  absolute
                  top-1.5
                  right-1.5
                  w-1.5
                  h-1.5
                  rounded-full
                  bg-danger
                "
              />
            )}
        </>
      )}
    </NavLink>
  )
}


const ETIQUETAS_ROL = {
  admin: "Administrador",
  mantenimiento: "Mantenimiento",
  usuario: "Usuario",
}


function Iniciales({ nombre }) {
  const partes = (nombre ?? "U")
    .trim()
    .split(" ")

  const ini =
    partes.length >= 2
      ? partes[0][0] +
        partes[partes.length - 1][0]
      : partes[0].slice(0, 2)

  return ini.toUpperCase()
}


export default function Sidebar({
  cantidadAlertas = 0,
  estaAbierto = false,
  alCerrar,
}) {
  const {
    estaLogueado,
    esAdmin,
    perfil,
    cerrarSesion,
  } = useAuth()

  const navegar = useNavigate()


  async function manejarCerrarSesion() {
    await cerrarSesion()
    navegar("/login")
  }


  return (
    <>
      {/* ==========================================
          FONDO OSCURO EN MÓVIL
      ========================================== */}

      {estaAbierto && (
        <div
          className="
            fixed
            inset-0
            bg-black/40
            backdrop-blur-sm
            z-40
            md:hidden
          "
          onClick={alCerrar}
        />
      )}


      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside
        className={`
          fixed
          left-0
          top-0
          h-screen
          bg-white
          border-r
          border-gray-100
          flex
          flex-col
          flex-shrink-0
          z-50
          transition-transform
          duration-300
          ease-out

          w-64
          md:w-16
          lg:w-60

          ${
            estaAbierto
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >

        {/* ==========================================
            LOGO
        ========================================== */}

        <div
          className="
            h-14
            lg:h-28
            flex
            items-center
            justify-center
            px-4
            lg:px-0
            border-b
            border-gray-100
            shrink-0
            relative
            overflow-hidden
          "
        >
          <button
            onClick={alCerrar}
            className="
              md:hidden
              absolute
              right-3
              p-1
              rounded-lg
              text-muted
              hover:text-dark
              hover:bg-gray-100
              transition-colors
            "
          >
            <MdClose size={18} />
          </button>


          {/* Logo móvil / tablet */}

          <img
            src={logoAtmos}
            alt="ATMOS"
            className="
              h-7
              w-auto
              object-contain
              lg:hidden
            "
          />


          {/* Logo escritorio */}

          <img
            src="/LOGO1.png"
            alt="ATMOS"
            className="
              hidden
              lg:block
              h-32
              w-full
              object-contain
              object-center
              translate-x-1
            "
          />
        </div>


        {/* ==========================================
            NAVEGACIÓN
        ========================================== */}

        <nav
          className="
            flex-1
            px-0
            py-2
            overflow-y-auto
            hide-scrollbar
          "
        >
          <p
            className="
              block
              md:hidden
              lg:block
              px-5
              mb-1.5
              text-[10px]
              font-semibold
              text-muted/70
              uppercase
              tracking-widest
            "
          >
            Menú principal
          </p>


          <div className="flex flex-col gap-0.5">

            {/* Navegación pública */}

            {navPublico.map((elemento) => (
              <div
                key={elemento.ruta}
                className="relative"
              >
                <ElementoNav
                  elemento={elemento}
                  cantidadAlertas={
                    cantidadAlertas
                  }
                />
              </div>
            ))}


            {/* Navegación para usuarios autenticados */}

            {estaLogueado &&
              navAutenticado.map(
                (elemento) => (
                  <div
                    key={elemento.ruta}
                    className="relative"
                  >
                    <ElementoNav
                      elemento={elemento}
                      cantidadAlertas={
                        cantidadAlertas
                      }
                    />
                  </div>
                )
              )}
          </div>


          {/* ==========================================
              OPCIONES DE ADMINISTRADOR
          ========================================== */}

          {esAdmin && (
            <>
              <p
                className="
                  block
                  md:hidden
                  lg:block
                  px-5
                  mt-5
                  mb-1.5
                  text-[10px]
                  font-semibold
                  text-muted/70
                  uppercase
                  tracking-widest
                "
              >
                Sistema
              </p>


              <div
                className="
                  flex
                  flex-col
                  gap-0.5
                  mt-3
                  lg:mt-0
                "
              >
                {navAdmin.map(
                  (elemento) => (
                    <div
                      key={elemento.ruta}
                      className="relative"
                    >
                      <ElementoNav
                        elemento={elemento}
                        cantidadAlertas={
                          cantidadAlertas
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </nav>


        {/* ==========================================
            INFORMACIÓN DEL USUARIO
        ========================================== */}

        {perfil && (
          <div
            className="
              px-3
              py-3
              border-t
              border-gray-100
              block
              md:hidden
              lg:block
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
                px-1
              "
            >

              {/* Usuario */}

              <button
                onClick={() =>
                  navegar("/settings")
                }
                className="
                  flex
                  items-center
                  gap-2.5
                  min-w-0
                  text-left
                  rounded-xl
                  px-2
                  py-1.5
                  -mx-2
                  hover:bg-gray-50
                  transition-colors
                  group
                "
              >
                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-primary/10
                    text-primary
                    text-xs
                    font-bold
                    flex
                    items-center
                    justify-center
                    shrink-0
                    border
                    border-primary/10
                  "
                >
                  <Iniciales
                    nombre={perfil.nombre}
                  />
                </div>


                <div className="min-w-0">
                  <p
                    className="
                      text-xs
                      font-semibold
                      text-dark
                      truncate
                      leading-tight
                    "
                  >
                    {perfil.nombre}
                  </p>


                  <p
                    className="
                      text-[10px]
                      text-muted
                      truncate
                      mt-0.5
                      font-medium
                    "
                  >
                    {ETIQUETAS_ROL[
                      perfil.rol
                    ] ??
                      perfil.rol ??
                      "Usuario"}
                  </p>
                </div>
              </button>


              {/* Cerrar sesión */}

              <button
                onClick={
                  manejarCerrarSesion
                }
                title="Cerrar sesión"
                className="
                  shrink-0
                  p-1.5
                  rounded-lg
                  text-muted
                  hover:text-danger
                  hover:bg-danger/10
                  transition-all
                  duration-150
                  active:scale-95
                "
              >
                <MdLogout size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
