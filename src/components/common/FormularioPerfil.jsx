import { useState } from "react"
import { MdPerson, MdSecurity } from "react-icons/md"
import { actualizarPerfil } from "../../api/ajustes"

const estiloCampo =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

function InsigniaRol({ rol }) {
  if (rol === "admin") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
        Administrador
      </span>
    )
  }

  if (rol === "mantenimiento") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
        Mantenimiento
      </span>
    )
  }

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-muted font-medium">
      Usuario
    </span>
  )
}

function CampoTexto({ etiqueta, tipo = "text", valor, alCambiar, ayuda }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
        {etiqueta}
      </label>
      <input
        type={tipo}
        value={valor}
        onChange={evento => alCambiar(evento.target.value)}
        className={estiloCampo}
      />
      {ayuda && <p className="text-xs text-muted mt-1">{ayuda}</p>}
    </div>
  )
}

export default function FormularioPerfil({ perfil, alGuardar, modo = "todo" }) {
  const [nombre, setNombre] = useState(perfil?.nombre ?? "")
  const [contraseniaActual, setContraseniaActual] = useState("")
  const [contraseniaNueva, setContraseniaNueva] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)

  function validarFormulario() {
    const nombreLimpio = nombre.trim()

    if (nombreLimpio.length < 3) {
      return "El nombre debe tener al menos 3 caracteres"
    }

    if (contraseniaNueva) {
      if (contraseniaNueva.length < 8) {
        return "La nueva contrasena debe tener al menos 8 caracteres"
      }

      if (contraseniaNueva !== confirmar) {
        return "La confirmacion no coincide con la nueva contrasena"
      }

      if (!contraseniaActual) {
        return "Ingresa tu contrasena actual"
      }
    }

    return null
  }

  function construirDatos() {
    const datos = {}
    const nombreLimpio = nombre.trim()

    if (nombreLimpio !== perfil?.nombre) {
      datos.nombre = nombreLimpio
    }

    if (contraseniaNueva) {
      datos.contrasenia_actual = contraseniaActual
      datos.contrasenia_nueva = contraseniaNueva
    }

    return datos
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    const mensajeError = validarFormulario()

    if (mensajeError) {
      setError(mensajeError)
      setExito(false)
      return
    }

    const datos = construirDatos()

    setGuardando(true)
    setError(null)
    setExito(false)

    try {
      await actualizarPerfil(datos)
      setContraseniaActual("")
      setContraseniaNueva("")
      setConfirmar("")
      setExito(true)
      await alGuardar?.()
    } catch (fallo) {
      setError(fallo.response?.data?.detail ?? "No se pudo actualizar el perfil")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="contents">
      {(modo === "todo" || modo === "cuenta") && (
      <section className="card flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MdPerson size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Mi cuenta</p>
              <h2 className="font-semibold text-dark mt-0.5">Perfil de usuario</h2>
              <p className="text-xs text-muted mt-0.5">Datos visibles dentro de ATMOS.</p>
            </div>
          </div>
          <InsigniaRol rol={perfil?.rol} />
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs text-muted uppercase tracking-wide">Correo</p>
          <p className="text-sm font-medium text-dark mt-1 break-all">{perfil?.correo}</p>
        </div>

        <CampoTexto etiqueta="Nombre completo" valor={nombre} alCambiar={setNombre} />

        {modo === "cuenta" && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="flex flex-col gap-1">
              {error && <p className="text-danger text-xs">{error}</p>}
              {exito && <span className="badge-success w-fit">Perfil actualizado correctamente</span>}
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary w-full sm:w-fit flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Guardar cambios
            </button>
          </div>
        )}
      </section>
      )}

      {(modo === "todo" || modo === "seguridad") && (
      <section className="card flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <MdSecurity size={20} className="text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide">Seguridad</p>
            <h2 className="font-semibold text-dark mt-0.5">Cambiar contrasena</h2>
            <p className="text-xs text-muted mt-0.5">
              Deja estos campos en blanco si no quieres cambiarla.
            </p>
          </div>
        </div>

        <CampoTexto
          etiqueta="Contrasena actual"
          tipo="password"
          valor={contraseniaActual}
          alCambiar={setContraseniaActual}
        />
        <CampoTexto
          etiqueta="Nueva contrasena"
          tipo="password"
          valor={contraseniaNueva}
          alCambiar={setContraseniaNueva}
          ayuda="Minimo 8 caracteres."
        />
        <CampoTexto
          etiqueta="Confirmar nueva contrasena"
          tipo="password"
          valor={confirmar}
          alCambiar={setConfirmar}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1">
            {error && <p className="text-danger text-xs">{error}</p>}
            {exito && <span className="badge-success w-fit">Perfil actualizado correctamente</span>}
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="btn-primary w-full sm:w-fit flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Guardar cambios
          </button>
        </div>
      </section>
      )}
    </form>
  )
}
