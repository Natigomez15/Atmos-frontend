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
    { id: "cuenta", etiqueta: "Mi cuenta", Icono: MdPerson },
    { id: "seguridad", etiqueta: "Seguridad", Icono: MdSecurity },
    { id: "notificaciones", etiqueta: "Notificaciones", Icono: MdNotifications },
    { id: "sistema", etiqueta: "Sistema", Icono: MdSettings },
  ]

  return (
    <aside className="card lg:sticky lg:top-24 p-3">
      <p className="text-xs text-muted uppercase tracking-wide px-2 mb-2">Secciones</p>
      <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        {secciones.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => alCambiarSeccion(id)}
            className={`min-w-fit flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors text-left ${
              seccionActiva === id
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-dark hover:bg-gray-50"
            }`}
          >
            <Icono size={17} />
            {etiqueta}
            {id === "sistema" && !esAdmin && (
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                seccionActiva === id ? "bg-white/20 text-white" : "bg-gray-100 text-muted"
              }`}>
                admin
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
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
  } = useQuery({
    queryKey: ["perfil-usuario"],
    queryFn: obtenerPerfil,
    enabled: estaLogueado,
  })

  if (!estaLogueado) {
    return <AccesoDenegado />
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs text-secondary uppercase tracking-wide font-semibold">Configuracion</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-dark mt-1">Ajustes de ATMOS</h1>
            <p className="text-sm text-muted mt-1">
              Gestiona tu cuenta, seguridad, notificaciones y parametros del sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="badge-success text-xs">Sesion activa</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-muted font-medium">
              {esAdmin ? "Administrador" : "Usuario autenticado"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5 items-start">
          <NavegacionAjustes
            esAdmin={esAdmin}
            seccionActiva={seccionActiva}
            alCambiarSeccion={setSeccionActiva}
          />

          <div className="min-h-[520px]">
            {seccionActiva === "cuenta" && (
              cargandoPerfil || !perfil
                ? <div className="card h-72 animate-pulse bg-gray-50" />
                : <FormularioPerfil
                    key={`cuenta-${perfil.correo}`}
                    modo="cuenta"
                    perfil={perfil}
                    alGuardar={recargarPerfil}
                  />
            )}

            {seccionActiva === "seguridad" && (
              cargandoPerfil || !perfil
                ? <div className="card h-96 animate-pulse bg-gray-50" />
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
