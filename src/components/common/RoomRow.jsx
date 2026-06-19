import { MdMonitor, MdEdit } from "react-icons/md"

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

function ColorTemperatura({ temperatura }) {
  if (temperatura == null) return <span className="text-muted">—</span>
  const clase = temperatura > 26 ? "text-warning" : temperatura <= 24 ? "text-success" : "text-dark"
  return <span className={`font-medium ${clase}`}>{temperatura.toFixed(1)} °C</span>
}

export default function RoomRow({ salon, lectura, alEditar, alMonitorear, puedeEditar = false }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      {/* Nombre */}
      <td className="px-2 py-2 lg:px-4 lg:py-3">
        <p className="font-medium text-dark text-sm">{salon.nombre}</p>
        <p className="text-xs text-muted">
          {salon.pavilion && `${salon.pavilion} · `}
          {salon.floor != null && `Piso ${salon.floor}`}
        </p>
      </td>

      {/* Estado */}
      <td className="px-2 py-2 lg:px-4 lg:py-3">
        <InsigniaEstado lectura={lectura} />
      </td>

      {/* Temperatura */}
      <td className="px-2 py-2 lg:px-4 lg:py-3 text-sm">
        <ColorTemperatura temperatura={lectura?.temperatura ?? null} />
      </td>

      {/* Humedad */}
      <td className="px-2 py-2 lg:px-4 lg:py-3 text-sm text-dark hidden md:table-cell">
        {lectura?.humedad != null ? `${lectura.humedad.toFixed(0)} %` : "—"}
      </td>

      {/* Consumo */}
      <td className="px-2 py-2 lg:px-4 lg:py-3 text-sm text-dark hidden md:table-cell">
        {lectura?.potencia_w != null ? `${lectura.potencia_w.toFixed(0)} W` : "—"}
      </td>

      {/* AC */}
      <td className="px-2 py-2 lg:px-4 lg:py-3">
        {lectura?.ac_encendido
          ? <span className="inline-flex items-center gap-1.5 text-xs text-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
              Encendido
            </span>
          : <span className="text-xs text-muted">Apagado</span>
        }
      </td>

      {/* Capacidad */}
      <td className="px-2 py-2 lg:px-4 lg:py-3 text-sm text-dark hidden lg:table-cell">
        {salon.capacity != null ? `${salon.capacity} personas` : "—"}
      </td>

      {/* Acciones */}
      <td className="px-2 py-2 lg:px-4 lg:py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={alMonitorear}
            title="Ver monitoreo"
            className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"
          >
            <MdMonitor size={17} />
          </button>
          {puedeEditar && (
            <button
              onClick={alEditar}
              title="Editar salón"
              className="p-1.5 rounded-lg text-muted hover:bg-gray-100 transition-colors"
            >
              <MdEdit size={17} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
