import { useEffect, useState } from "react"
import { MdClose } from "react-icons/md"
import { crearSalon, actualizarSalon } from "../../api/rooms"

const DATOS_VACIOS = {
  name:     "",
  pavilion: "",
  capacity: "",
  area_m2:  "",
  ac_model: "",
  ac_btu:   "",
  ac_type:  "",
}

const TIPOS_AC = ["Seleccionar tipo", "Split", "Ventana", "Cassette", "Piso techo"]

function validar(datos) {
  const errores = {}
  if (!datos.name || datos.name.trim().length < 3) {
    errores.name = "El nombre es obligatorio (mínimo 3 caracteres)"
  }
  if (datos.capacity !== "" && (isNaN(datos.capacity) || Number(datos.capacity) < 1 || !Number.isInteger(Number(datos.capacity)))) {
    errores.capacity = "Debe ser un número entero positivo"
  }
  if (datos.area_m2 !== "" && (isNaN(datos.area_m2) || Number(datos.area_m2) <= 0)) {
    errores.area_m2 = "Debe ser un número positivo"
  }
  if (datos.ac_btu !== "" && (isNaN(datos.ac_btu) || Number(datos.ac_btu) <= 0)) {
    errores.ac_btu = "Debe ser un número positivo"
  }
  return errores
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
  const [errores,         setErrores]         = useState({})
  const [guardando,       setGuardando]        = useState(false)
  const [errorGeneral,    setErrorGeneral]     = useState(null)

  const modoEdicion = !!salon

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (salon) {
      setDatosFormulario({
        name:     salon.nombre   ?? "",
        pavilion: salon.pavilion ?? "",
        capacity: salon.capacity != null ? String(salon.capacity) : "",
        area_m2:  salon.area_m2  != null ? String(salon.area_m2)  : "",
        ac_model: salon.ac_model ?? "",
        ac_btu:   salon.ac_btu   != null ? String(salon.ac_btu)   : "",
        ac_type:  salon.ac_type  ?? "",
      })
    } else {
      setDatosFormulario(DATOS_VACIOS)
    }
    setErrores({})
    setErrorGeneral(null)
  }, [salon, estaAbierto])

  if (!estaAbierto) return null

  function actualizarCampo(campo, valor) {
    setDatosFormulario(prev => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: undefined }))
  }

  async function manejarEnvio(e) {
    e.preventDefault()
    const erroresValidacion = validar(datosFormulario)
    if (Object.keys(erroresValidacion).length) {
      setErrores(erroresValidacion)
      return
    }

    setGuardando(true)
    setErrorGeneral(null)

    const carga = {
      ...datosFormulario,
      capacity: datosFormulario.capacity !== "" ? Number(datosFormulario.capacity) : undefined,
      area_m2:  datosFormulario.area_m2  !== "" ? Number(datosFormulario.area_m2)  : undefined,
      ac_btu:   datosFormulario.ac_btu   !== "" ? Number(datosFormulario.ac_btu)   : undefined,
      ac_type:  datosFormulario.ac_type  === "Seleccionar tipo" ? "" : datosFormulario.ac_type,
    }

    try {
      if (modoEdicion) {
        await actualizarSalon(salon.sala_id, carga)
      } else {
        await crearSalon(carga)
      }
      alGuardar()
      alCerrar()
    } catch {
      setErrorGeneral("Error al guardar el salón")
    } finally {
      setGuardando(false)
    }
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
        {/* Encabezado */}
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

        {/* Formulario */}
        <form onSubmit={manejarEnvio} className="px-6 py-5 flex flex-col gap-4">

          {/* 1. Nombre */}
          <CampoFormulario etiqueta="Nombre del salón" requerido error={errores.name}>
            <input
              type="text"
              value={datosFormulario.name}
              onChange={e => actualizarCampo("name", e.target.value)}
              placeholder="Ej: Salón 3A-101"
              className={estiloInput}
            />
          </CampoFormulario>

          {/* 2. Pabellón */}
          <CampoFormulario etiqueta="Pabellón" error={errores.pavilion}>
            <input
              type="text"
              value={datosFormulario.pavilion}
              onChange={e => actualizarCampo("pavilion", e.target.value)}
              placeholder="Ej: Pabellón A"
              className={estiloInput}
            />
          </CampoFormulario>

          {/* 3. Capacidad + 4. Área */}
          <div className="grid grid-cols-2 gap-4">
            <CampoFormulario etiqueta="Capacidad (personas)" error={errores.capacity}>
              <input
                type="number"
                min={1} max={200}
                value={datosFormulario.capacity}
                onChange={e => actualizarCampo("capacity", e.target.value)}
                className={estiloInput}
              />
            </CampoFormulario>

            <CampoFormulario etiqueta="Área (m²)" error={errores.area_m2}>
              <input
                type="number"
                min={1} step={0.5}
                value={datosFormulario.area_m2}
                onChange={e => actualizarCampo("area_m2", e.target.value)}
                className={estiloInput}
              />
            </CampoFormulario>
          </div>

          {/* 5. Modelo AC + 6. BTU */}
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

          {/* 7. Tipo de AC */}
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

          {/* Pie del modal */}
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
    </div>
  )
}
