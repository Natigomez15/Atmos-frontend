import { useEffect, useState } from "react"
import { MdClose } from "react-icons/md"
import { crearSalon, actualizarSalon } from "../../api/rooms"
import DialogoConfirmacion from "./DialogoConfirmacion"

const DATOS_VACIOS = {
  name:     "",
  pavilion: "",
  tipo:     "laboratorio",
  ac_model: "",
  ac_btu:   "",
  ac_type:  "",
}

const TIPOS_AC = ["Seleccionar tipo", "Split", "Ventana", "Cassette", "Piso techo"]
const TIPOS_ESPACIO = [
  { valor: "laboratorio", etiqueta: "Laboratorio" },
  { valor: "oficina",     etiqueta: "Oficina" },
  { valor: "salon",       etiqueta: "Aula" },
]

function validar(datos) {
  const errores = {}
  if (!datos.name || datos.name.trim().length < 3) {
    errores.name = "El nombre es obligatorio (mínimo 3 caracteres)"
  }
  if (datos.ac_btu !== "" && (isNaN(datos.ac_btu) || Number(datos.ac_btu) <= 0)) {
    errores.ac_btu = "Debe ser un número positivo"
  }
  return errores
}

function normalizarTexto(valor) {
  return String(valor ?? "").trim()
}

function extraerMensajeApi(error) {
  const estado = error?.response?.status
  const detalle = error?.response?.data?.detail
  let mensaje = null

  if (typeof detalle === "string") {
    mensaje = detalle
  } else if (Array.isArray(detalle)) {
    mensaje = detalle
      .map(item => item?.msg || item?.message || JSON.stringify(item))
      .filter(Boolean)
      .join(". ")
  } else if (detalle && typeof detalle === "object") {
    mensaje = detalle.message || detalle.error || JSON.stringify(detalle)
  }

  if (!mensaje) mensaje = error?.message || "Error al guardar el salón"
  return estado ? `HTTP ${estado}: ${mensaje}` : mensaje
}

const estiloInput =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 " +
  "focus:border-secondary transition-colors"

function CampoFormulario({ etiqueta, requerido, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1">
        {etiqueta}
        {requerido && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}

export default function RoomFormModal({ estaAbierto, alCerrar, alGuardar, salon }) {
  const [datosFormulario, setDatosFormulario] = useState(DATOS_VACIOS)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [mostrarAdvertenciaPabellon, setMostrarAdvertenciaPabellon] = useState(false)

  const modoEdicion = !!salon

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (salon) {
      setDatosFormulario({
        name:     salon.nombre   ?? "",
        pavilion: salon.pavilion ?? "",
        tipo:     salon.tipo     ?? "laboratorio",
        ac_model: salon.ac_model ?? "",
        ac_btu:   salon.ac_btu   != null ? String(salon.ac_btu) : "",
        ac_type:  salon.ac_type  ?? "",
      })
    } else {
      setDatosFormulario(DATOS_VACIOS)
    }
    setErrores({})
    setErrorGeneral(null)
    setMostrarAdvertenciaPabellon(false)
  }, [salon, estaAbierto])

  if (!estaAbierto) return null

  function actualizarCampo(campo, valor) {
    setDatosFormulario(prev => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: undefined }))
  }

  function cambioPabellonRequiereConfirmacion() {
    if (!modoEdicion) return false
    const pabellonAnterior = normalizarTexto(salon?.pavilion ?? salon?.pabellon)
    const pabellonNuevo = normalizarTexto(datosFormulario.pavilion)
    return pabellonAnterior !== pabellonNuevo
  }

  async function guardar(confirmarCambioPabellon = false) {
    const erroresValidacion = validar(datosFormulario)
    if (Object.keys(erroresValidacion).length) {
      setErrores(erroresValidacion)
      return
    }

    if (cambioPabellonRequiereConfirmacion() && !confirmarCambioPabellon) {
      setMostrarAdvertenciaPabellon(true)
      return
    }

    setGuardando(true)
    setErrorGeneral(null)
    setMostrarAdvertenciaPabellon(false)

    const carga = {
      ...datosFormulario,
      ac_btu:  datosFormulario.ac_btu !== "" ? Number(datosFormulario.ac_btu) : undefined,
      ac_type: datosFormulario.ac_type === "Seleccionar tipo" ? "" : datosFormulario.ac_type,
      tipo:    datosFormulario.tipo || "laboratorio",
    }

    try {
      if (modoEdicion) {
        await actualizarSalon(salon.sala_id, carga)
      } else {
        await crearSalon(carga)
      }
      alGuardar()
      alCerrar()
    } catch (error) {
      setErrorGeneral(extraerMensajeApi(error))
    } finally {
      setGuardando(false)
    }
  }

  async function manejarEnvio(e) {
    e.preventDefault()
    await guardar(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={alCerrar}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-dark">
            {modoEdicion ? "Editar salón" : "Nuevo salón"}
          </h2>
          <button
            onClick={alCerrar}
            className="text-muted hover:text-dark transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="px-6 py-5 flex flex-col gap-4">
          <CampoFormulario etiqueta="Nombre del salón" requerido error={errores.name}>
            <input
              type="text"
              value={datosFormulario.name}
              onChange={e => actualizarCampo("name", e.target.value)}
              placeholder="Ej: Aula 3A-101"
              className={estiloInput}
            />
          </CampoFormulario>

          <CampoFormulario etiqueta="Pabellón" error={errores.pavilion}>
            <input
              type="text"
              value={datosFormulario.pavilion}
              onChange={e => actualizarCampo("pavilion", e.target.value)}
              placeholder="Ej: Pabellón A"
              className={estiloInput}
            />
          </CampoFormulario>

          <CampoFormulario etiqueta="Tipo de espacio" error={errores.tipo}>
            <select
              value={datosFormulario.tipo}
              onChange={e => actualizarCampo("tipo", e.target.value)}
              className={estiloInput + " bg-white"}
            >
              {TIPOS_ESPACIO.map(tipo => (
                <option key={tipo.valor} value={tipo.valor}>{tipo.etiqueta}</option>
              ))}
            </select>
          </CampoFormulario>

          <div className="grid grid-cols-2 gap-4">
            <CampoFormulario etiqueta="Modelo del AC" error={errores.ac_model}>
              <input
                type="text"
                value={datosFormulario.ac_model}
                onChange={e => actualizarCampo("ac_model", e.target.value)}
                placeholder="Ej: LW1216ER"
                className={estiloInput}
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="BTU del AC" error={errores.ac_btu}>
              <input
                type="number"
                min={1}
                value={datosFormulario.ac_btu}
                onChange={e => actualizarCampo("ac_btu", e.target.value)}
                placeholder="Ej: 12000"
                className={estiloInput}
              />
            </CampoFormulario>
          </div>

          <CampoFormulario etiqueta="Tipo de AC" error={errores.ac_type}>
            <select
              value={datosFormulario.ac_type || "Seleccionar tipo"}
              onChange={e => actualizarCampo("ac_type", e.target.value)}
              className={estiloInput + " bg-white"}
            >
              {TIPOS_AC.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </CampoFormulario>

          {errorGeneral && (
            <p className="text-xs text-danger">{errorGeneral}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="text-sm text-muted hover:text-dark transition-colors px-3 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {modoEdicion ? "Guardar cambios" : "Guardar salón"}
            </button>
          </div>
        </form>
      </div>

      <DialogoConfirmacion
        abierto={mostrarAdvertenciaPabellon}
        titulo="Cambiar pabellón"
        mensaje="Cambiar el pabellón modifica la ruta usada para asociar lecturas y comandos del ESP32. Si el dispositivo físico sigue reportando al pabellón anterior, puede dejar de verse o controlar el aire correcto. ¿Quieres continuar?"
        etiquetaConfirmar="Continuar"
        etiquetaCancelar="Cancelar"
        alConfirmar={() => guardar(true)}
        alCancelar={() => setMostrarAdvertenciaPabellon(false)}
      />
    </div>
  )
}
