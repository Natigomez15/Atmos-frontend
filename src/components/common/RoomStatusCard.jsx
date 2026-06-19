import { MdAir, MdThermostat, MdWaterDrop, MdBolt } from "react-icons/md"

function minutosAtras(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function ColorTemperatura({ temperatura }) {
  if (temperatura == null) return <span className="text-muted">—</span>
  const clase = temperatura > 26 ? "text-warning" : temperatura <= 24 ? "text-success" : "text-dark"
  return <span className={`font-semibold ${clase}`}>{temperatura.toFixed(1)}</span>
}

function Metrica({ icono: Icono, valor, unidad, render }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl bg-gray-50">
      <Icono size={13} className="text-muted" />
      <div className="text-xs text-center leading-none">
        {render ? render() : (
          valor != null
            ? <><span className="font-semibold text-dark">{valor}</span><span className="text-muted"> {unidad}</span></>
            : <span className="text-muted">—</span>
        )}
      </div>
    </div>
  )
}

export default function RoomStatusCard({
  room_name,
  temperature = null,
  humidity    = null,
  presence    = false,
  ac_is_on    = false,
  power_w     = null,
  recorded_at = null,
  onClick,
}) {
  const minutos  = minutosAtras(recorded_at)
  const sinSenal = minutos == null || minutos > 10

  return (
    <div
      className="card cursor-pointer hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <span className="font-semibold text-dark text-sm leading-tight block truncate">{room_name}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              sinSenal ? "bg-gray-300" : ac_is_on ? "bg-success animate-pulse" : "bg-gray-300"
            }`} />
            <span className="text-[11px] text-muted">
              {ac_is_on ? "AC encendido" : "AC apagado"}
            </span>
          </div>
        </div>
        <span className={presence ? "badge-success" : "badge-muted"}>
          {presence ? "Ocupado" : "Vacío"}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <Metrica
          icono={MdThermostat}
          render={() => (
            <><ColorTemperatura temperatura={temperature} />{temperature != null && <span className="text-muted"> °C</span>}</>
          )}
        />
        <Metrica
          icono={MdWaterDrop}
          valor={humidity != null ? humidity.toFixed(0) : null}
          unidad="%"
        />
        <Metrica
          icono={MdBolt}
          valor={power_w != null ? power_w.toFixed(0) : null}
          unidad="W"
        />
      </div>

      {/* Timestamp */}
      <p className={`text-[11px] font-medium ${sinSenal ? "text-danger" : "text-muted"}`}>
        {sinSenal
          ? "● Sin señal"
          : minutos === 0 ? "Actualizado ahora" : `Actualizado hace ${minutos} min`
        }
      </p>
    </div>
  )
}
