import { useState } from "react"
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

  return null
}

function CampoTexto({ etiqueta, tipo = "text", valor, alCambiar }) {
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
    </div>
  )
}

export default function FormularioPerfil({ perfil, alGuardar }) {
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
        return "La nueva contraseña debe tener al menos 8 caracteres"
      }

      if (contraseniaNueva !== confirmar) {
        return "La confirmación no coincide con la nueva contraseña"
      }

      if (!contraseniaActual) {
        return "Ingresa tu contraseña actual"
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
    <form onSubmit={manejarEnvio} className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-dark">Mi perfil</p>
          <p className="text-xs text-muted mt-0.5">{perfil?.correo}</p>
        </div>
        <InsigniaRol rol={perfil?.rol} />
      </div>

      <hr className="border-gray-100" />

      <CampoTexto etiqueta="Nombre completo" valor={nombre} alCambiar={setNombre} />

      <div className="flex flex-col gap-3 pt-1">
        <div>
          <p className="text-sm font-medium text-dark">Cambiar contraseña</p>
          <p className="text-xs text-muted">Dejar en blanco para no cambiar</p>
        </div>

        <CampoTexto
          etiqueta="Contraseña actual"
          tipo="password"
          valor={contraseniaActual}
          alCambiar={setContraseniaActual}
        />
        <CampoTexto
          etiqueta="Nueva contraseña"
          tipo="password"
          valor={contraseniaNueva}
          alCambiar={setContraseniaNueva}
        />
        <CampoTexto
          etiqueta="Confirmar nueva contraseña"
          tipo="password"
          valor={confirmar}
          alCambiar={setConfirmar}
        />
      </div>

      {error && <p className="text-danger text-xs">{error}</p>}
      {exito && <span className="badge-success w-fit">Perfil actualizado correctamente</span>}

      <button
        type="submit"
        disabled={guardando}
        className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {guardando && (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        Guardar cambios
      </button>
    </form>
  )
}
