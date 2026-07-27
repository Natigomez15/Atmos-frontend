import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MdGroup, MdRefresh } from "react-icons/md"
import { actualizarUsuario, obtenerUsuarios } from "../../api/ajustes"

const NOMBRES_ROL = {
  admin: "Administrador",
  mantenimiento: "Mantenimiento",
  usuario: "Usuario",
}

export default function GestionUsuarios({ usuarioActualId }) {
  const queryClient = useQueryClient()

  const {
    data: usuarios = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["usuarios-sistema"],
    queryFn: obtenerUsuarios,
  })

  const mutacion = useMutation({
    mutationFn: ({ usuarioId, cambios }) =>
      actualizarUsuario(usuarioId, cambios),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["usuarios-sistema"],
      })
    },
  })

  const actualizar = (usuarioId, cambios) => {
    mutacion.mutate({ usuarioId, cambios })
  }

  if (isLoading) {
    return <div className="card h-72 animate-pulse bg-gray-50" />
  }

  if (isError) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 gap-3 text-center">
        <MdGroup size={36} className="text-muted" />

        <div>
          <p className="font-medium text-dark">
            No se pudieron cargar los usuarios
          </p>
          <p className="text-sm text-muted mt-1">
            Comprueba la conexión con el servidor e inténtalo nuevamente.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary text-sm flex items-center gap-2"
          onClick={() => refetch()}
        >
          <MdRefresh size={16} />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <section className="card flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MdGroup size={20} className="text-primary" />
        </div>

        <div>
          <p className="text-xs text-muted uppercase tracking-wide">
            Administración
          </p>

          <h2 className="font-semibold text-dark mt-0.5">
            Usuarios y roles
          </h2>

          <p className="text-xs text-muted mt-0.5">
            Gestiona el nivel de acceso y el estado de las cuentas de ATMOS.
          </p>
        </div>
      </div>

      {mutacion.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {mutacion.error?.response?.data?.detail ??
            "No se pudo actualizar el usuario."}
        </div>
      )}

      {usuarios.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
          <p className="text-sm text-muted">
            No hay usuarios registrados.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {usuarios.map((usuario) => {
            const esPropio =
              String(usuario.id) === String(usuarioActualId)

            return (
              <div
                key={usuario.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-dark">
                      {usuario.nombre || "Sin nombre"}
                    </p>

                    {esPropio && (
                      <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-muted">
                        Tú
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted mt-0.5 break-all">
                    {usuario.correo}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    value={usuario.rol || "usuario"}
                    disabled={esPropio || mutacion.isPending}
                    onChange={(evento) =>
                      actualizar(usuario.id, {
                        rol: evento.target.value,
                      })
                    }
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-dark bg-white disabled:opacity-60"
                    aria-label={`Rol de ${usuario.nombre || usuario.correo}`}
                  >
                    <option value="admin">
                      {NOMBRES_ROL.admin}
                    </option>

                    <option value="mantenimiento">
                      {NOMBRES_ROL.mantenimiento}
                    </option>

                    <option value="usuario">
                      {NOMBRES_ROL.usuario}
                    </option>
                  </select>

                  <button
                    type="button"
                    disabled={esPropio || mutacion.isPending}
                    onClick={() =>
                      actualizar(usuario.id, {
                        esta_activo: !usuario.esta_activo,
                      })
                    }
                    className={`min-w-[90px] rounded-xl px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                      usuario.esta_activo
                        ? "bg-success/10 text-success"
                        : "bg-gray-100 text-muted"
                    }`}
                  >
                    {usuario.esta_activo ? "Activo" : "Inactivo"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
        <p className="text-xs text-muted">
          Administrador: acceso completo. Mantenimiento: puede operar el
          sistema y responder decisiones de control. Usuario: acceso sin
          privilegios administrativos.
        </p>
      </div>
    </section>
  )
}
