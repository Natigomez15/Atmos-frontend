import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { MdInfo, MdLock } from "react-icons/md"
import { useAuth } from "../context/AuthContext"
import PageWrapper from "../components/layout/PageWrapper"
import FormularioPerfil from "../components/common/FormularioPerfil"
import FormularioConfiguracion from "../components/common/FormularioConfiguracion"
import TarjetaNotificaciones from "../components/common/TarjetaNotificaciones"
import PromptNotificacionesPush from "../components/common/PromptNotificacionesPush"
import { obtenerConfiguracionSistema, obtenerPerfil } from "../api/ajustes"

function AccesoDenegado() {
  const navegar = useNavigate()

  return (
    <PageWrapper>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <MdLock size={48} className="text-muted" />
        <p className="font-semibold text-dark">Inicia sesión para acceder a los ajustes</p>
        <button className="btn-primary" onClick={() => navegar("/login")}>
          Iniciar sesión
        </button>
      </div>
    </PageWrapper>
  )
}

function TarjetaSoloAdministrador() {
  return (
    <div className="card flex items-start gap-3">
      <MdInfo size={22} className="text-secondary flex-shrink-0 mt-0.5" />
      <p className="text-sm text-muted">
        La configuración del sistema solo puede ser modificada por el administrador.
      </p>
    </div>
  )
}

function InformacionSistema() {
  const datos = [
    ["Backend:", "URL de Render"],
    ["Frontend:", "URL de Vercel"],
    ["Base de datos:", "Supabase PostgreSQL"],
    ["Versión:", "ATMOS v1.0 — JIC 2025"],
  ]

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <p className="font-semibold text-dark text-sm mb-3">Información del sistema</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex items-center gap-2">
            <span className="font-medium text-muted">{etiqueta}</span>
            <span className="text-muted">{valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AjustesPage() {
  const { esAdmin, estaLogueado } = useAuth()

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
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Ajustes</h1>
          <p className="text-sm text-muted mt-0.5">Configura el sistema ATMOS</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cargandoPerfil || !perfil
              ? <div className="card h-64 animate-pulse bg-gray-50" />
              : <FormularioPerfil
                  key={perfil.correo}
                  perfil={perfil}
                  alGuardar={recargarPerfil}
                />
            }
            <PromptNotificacionesPush />
            <TarjetaNotificaciones />
          </div>

          <div className="lg:col-span-3">
            {esAdmin
              ? cargandoConfig || !configuracion
                ? <div className="card h-96 animate-pulse bg-gray-50" />
                : <FormularioConfiguracion
                    key={configuracion.actualizado_en ?? "configuracion"}
                    configuracion={configuracion}
                    alGuardar={recargarConfig}
                  />
              : <TarjetaSoloAdministrador />
            }
          </div>
        </div>

        {esAdmin && <InformacionSistema />}
      </div>
    </PageWrapper>
  )
}
