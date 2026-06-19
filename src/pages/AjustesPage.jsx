import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  MdInfo,
  MdLock,
  MdNotifications,
  MdPerson,
  MdSecurity,
  MdSettings,
} from "react-icons/md"
import { useAuth } from "../context/AuthContext"
import PageWrapper from "../components/layout/PageWrapper"
import PageHeader from "../components/common/PageHeader"
import FormularioPerfil from "../components/common/FormularioPerfil"
import FormularioConfiguracion from "../components/common/FormularioConfiguracion"
import TarjetaNotificaciones from "../components/common/TarjetaNotificaciones"
import { obtenerConfiguracionSistema, obtenerPerfil } from "../api/ajustes"

function AccesoDenegado() {
  const navegar = useNavigate()

  return (
    <PageWrapper>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <MdLock size={48} className="text-muted" />
        <p className="font-semibold text-dark">Inicia sesion para acceder a los ajustes</p>
        <button className="btn-primary" onClick={() => navegar("/login")}>
          Iniciar sesion
        </button>
      </div>
    </PageWrapper>
  )
}

function NavegacionAjustes({ esAdmin, seccionActiva, alCambiarSeccion }) {
  const secciones = [
    { id: "cuenta",        etiqueta: "Cuenta",    Icono: MdPerson },
    { id: "seguridad",     etiqueta: "Seguridad", Icono: MdSecurity },
    { id: "notificaciones",etiqueta: "Alertas",   Icono: MdNotifications },
    { id: "sistema",       etiqueta: "Sistema",   Icono: MdSettings },
  ]

  const claseActiva   = "bg-gray-100 text-dark font-semibold"
  const claseInactiva = "text-muted hover:bg-gray-50 hover:text-dark"

  return (
    <>
      {/* Mobile: tabs horizontales */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl lg:hidden">
        {secciones.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => alCambiarSeccion(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              seccionActiva === id ? "bg-white text-dark shadow-sm" : "text-muted hover:text-dark"
            }`}
          >
            <Icono size={14} />
            {etiqueta}
          </button>
        ))}
      </div>

      {/* Desktop: nav vertical */}
      <nav className="hidden lg:flex lg:flex-col lg:gap-0.5 lg:w-48 lg:flex-shrink-0 lg:pt-1">
        {secciones.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => alCambiarSeccion(id)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              seccionActiva === id ? claseActiva : claseInactiva
            }`}
          >
            <Icono size={17} className="flex-shrink-0" />
            {etiqueta}
          </button>
        ))}
      </nav>
    </>
  )
}

function TarjetaSoloAdministrador() {
  return (
    <section id="sistema" className="card flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MdSettings size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">Sistema</p>
          <h2 className="font-semibold text-dark mt-0.5">Configuracion administrativa</h2>
          <p className="text-xs text-muted mt-0.5">
            Parametros generales de operacion y alertas.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-start gap-3">
        <MdInfo size={20} className="text-secondary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted">
          La configuracion del sistema solo puede ser modificada por el administrador.
        </p>
      </div>
    </section>
  )
}

function InformacionSistema() {
  const datos = [
    ["Backend", "Render"],
    ["Frontend", "Vercel"],
    ["Base de datos", "Supabase PostgreSQL"],
    ["Version", "ATMOS v1.0"],
  ]

  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
      <p className="font-semibold text-dark text-sm mb-3">Informacion del sistema</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex items-center justify-between gap-3">
            <span className="font-medium text-muted">{etiqueta}</span>
            <span className="text-dark text-right">{valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AjustesPage() {
  const { esAdmin, estaLogueado } = useAuth()
  const [seccionActiva, setSeccionActiva] = useState("cuenta")

  const {
    data: configuracion,
    refetch: recargarConfig,
    isLoading: cargandoConfig,
  } = useQuery({
    queryKey: ["configuracion-sistema"],
    queryFn: obtenerConfiguracionSistema,
    enabled: estaLogueado && esAdmin,
  })

  const {
    data: perfil,
    refetch: recargarPerfil,
    isLoading: cargandoPerfil,
    isError: errorPerfil,
  } = useQuery({
    queryKey: ["perfil-usuario"],
    queryFn: obtenerPerfil,
    enabled: estaLogueado,
    retry: 1,
  })

  if (!estaLogueado) {
    return <AccesoDenegado />
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Ajustes de ATMOS"
          description="Gestiona tu cuenta, seguridad, notificaciones y parámetros del sistema."
        />

        {/* Layout: mobile = apilado, desktop = nav lateral + contenido */}
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-0 lg:items-start lg:max-w-[900px]">
          <NavegacionAjustes
            esAdmin={esAdmin}
            seccionActiva={seccionActiva}
            alCambiarSeccion={setSeccionActiva}
          />

          {/* Separador vertical solo en desktop */}
          <div className="hidden lg:block w-px bg-gray-100 self-stretch flex-shrink-0 mx-5" />

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {seccionActiva === "cuenta" && (
              cargandoPerfil
                ? <div className="card h-72 animate-pulse bg-gray-50" />
                : errorPerfil || !perfil
                  ? <div className="card flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <MdPerson size={36} className="text-muted" />
                      <p className="text-sm text-muted">No se pudo cargar el perfil</p>
                      <button className="btn-secondary text-sm" onClick={recargarPerfil}>Reintentar</button>
                    </div>
                  : <FormularioPerfil
                      key={`cuenta-${perfil.correo}`}
                      modo="cuenta"
                      perfil={perfil}
                      alGuardar={recargarPerfil}
                    />
            )}

            {seccionActiva === "seguridad" && (
              cargandoPerfil
                ? <div className="card h-96 animate-pulse bg-gray-50" />
                : errorPerfil || !perfil
                  ? <div className="card flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <MdPerson size={36} className="text-muted" />
                      <p className="text-sm text-muted">No se pudo cargar el perfil</p>
                      <button className="btn-secondary text-sm" onClick={recargarPerfil}>Reintentar</button>
                    </div>
                  : <FormularioPerfil
                      key={`seguridad-${perfil.correo}`}
                      modo="seguridad"
                      perfil={perfil}
                      alGuardar={recargarPerfil}
                    />
            )}

            {seccionActiva === "notificaciones" && <TarjetaNotificaciones />}

            {seccionActiva === "sistema" && (
              esAdmin
                ? cargandoConfig || !configuracion
                  ? <div className="card h-96 animate-pulse bg-gray-50" />
                  : <div className="flex flex-col gap-4">
                      <FormularioConfiguracion
                        key={configuracion.actualizado_en ?? "configuracion"}
                        configuracion={configuracion}
                        alGuardar={recargarConfig}
                      />
                      <InformacionSistema />
                    </div>
                : <TarjetaSoloAdministrador />
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
