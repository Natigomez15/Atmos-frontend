import { useState } from "react"
import { MdMonitor, MdEdit, MdDelete, MdMoreVert } from "react-icons/md"

function minutosDesde(iso) {
  if (!iso) return Infinity
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function InsigniaEstado({ lectura }) {
  if (!lectura) return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
      Sin datos
    </span>
  )

  const minutos = minutosDesde(lectura.registrado_en)
  if (minutos > 10) return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
      Sin señal
    </span>
  )

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-dark">
      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
      En línea
    </span>
  )
}

function Temperatura({ temperatura }) {
  // Sin rango de confort configurado, la temperatura se muestra como texto normal
  // (no se colorea sin una fuente de umbrales). Ver tarea 5.
  if (temperatura == null) return <span className="text-muted">-</span>
  return <span className="font-medium text-dark">{temperatura.toFixed(1)} °C</span>
}

// Ocupación: "Ocupado" neutro / "Vacío" gris. Si está Vacío con el AC encendido,
// es la condición de desperdicio que ATMOS detecta → se resalta en ámbar.
function InsigniaOcupacion({ lectura }) {
  if (!lectura) return <span className="text-xs text-muted">-</span>

  const ocupado = !!lectura.presencia
  if (ocupado) return <span className="text-xs text-dark">Ocupado</span>

  const desperdicio = !!lectura.ac_encendido
  return desperdicio
    ? <span className="badge-warning">Vacío</span>
    : <span className="text-xs text-muted">Vacío</span>
}

const TIPO_ESPACIO = {
  laboratorio: { texto: "Laboratorio", clase: "badge-success" },
  oficina:     { texto: "Oficina",     clase: "badge-warning" },
  salon:       { texto: "Aula",        clase: "badge-muted" },
}

function BadgeTipo({ tipo }) {
  const config = TIPO_ESPACIO[tipo] ?? TIPO_ESPACIO.laboratorio
  return <span className={config.clase}>{config.texto}</span>
}

export default function RoomRow({ salon, lectura, alEditar, alEliminar, alMonitorear, puedeEditar = false }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  function manejarEliminar() {
    setMenuAbierto(false)
    alEliminar?.()
  }

  const ubicacion = [
    salon.pavilion,
    salon.floor != null ? `Piso ${salon.floor}` : null,
  ].filter(Boolean).join(" - ")

  return (
    <tr
      onClick={alMonitorear}
      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
    >
      <td className="px-2 py-2 lg:px-4 lg:py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-dark text-sm">{salon.nombre}</p>
          <BadgeTipo tipo={salon.tipo} />
          <span className="sm:hidden"><InsigniaOcupacion lectura={lectura} /></span>
        </div>
        {ubicacion && <p className="text-xs text-muted">{ubicacion}</p>}
      </td>

      <td className="px-2 py-2 lg:px-4 lg:py-3">
        <InsigniaEstado lectura={lectura} />
      </td>

      <td className="px-2 py-2 lg:px-4 lg:py-3 text-sm">
        <Temperatura temperatura={lectura?.temperatura ?? null} />
      </td>

      <td className="px-2 py-2 lg:px-4 lg:py-3 text-sm text-dark hidden md:table-cell">
        {lectura?.potencia_w != null ? `${lectura.potencia_w.toFixed(0)} W` : "-"}
      </td>

      <td className="px-2 py-2 lg:px-4 lg:py-3 hidden sm:table-cell">
        <InsigniaOcupacion lectura={lectura} />
      </td>

      <td className="px-2 py-2 lg:px-4 lg:py-3">
        {lectura?.ac_encendido
          ? <span className="inline-flex items-center gap-1.5 text-xs text-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
              Encendido
            </span>
          : <span className="text-xs text-muted">Apagado</span>
        }
      </td>

      <td className="px-2 py-2 lg:px-4 lg:py-3" onClick={evento => evento.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button
            onClick={alMonitorear}
            title="Ver monitoreo en tiempo real de este espacio"
            className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"
          >
            <MdMonitor size={17} />
          </button>
          {puedeEditar && (
            <button
              onClick={alEditar}
              title="Editar datos del espacio"
              className="p-1.5 rounded-lg text-muted hover:bg-gray-100 transition-colors"
            >
              <MdEdit size={17} />
            </button>
          )}
          {puedeEditar && (
            <div
              className="relative"
              onBlur={evento => {
                if (!evento.currentTarget.contains(evento.relatedTarget)) {
                  setMenuAbierto(false)
                }
              }}
            >
              <button
                onClick={() => setMenuAbierto(abierto => !abierto)}
                title="Más acciones (eliminar espacio)"
                aria-haspopup="menu"
                aria-expanded={menuAbierto}
                className="p-1.5 rounded-lg text-muted hover:bg-gray-100 transition-colors"
              >
                <MdMoreVert size={17} />
              </button>
              {menuAbierto && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 min-w-32 rounded-xl border border-gray-100 bg-white p-1 shadow-card"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={manejarEliminar}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                  >
                    <MdDelete size={15} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
