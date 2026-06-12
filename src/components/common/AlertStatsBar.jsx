import { MdError, MdWarning, MdInfo, MdRouter, MdBolt, MdThermostat } from "react-icons/md"

export default function AlertStatsBar({ resumen }) {
  const porSeveridad = resumen?.by_severity ?? {}
  const porTipo      = resumen?.by_type     ?? {}

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">

      {/* Grid de severidades */}
      <div className="grid grid-cols-3 gap-2 sm:contents">

        {/* Severidad alta */}
        <div className="bg-danger/5 border border-danger/20 rounded-2xl px-3 lg:px-4 py-3 flex items-center gap-2 lg:gap-3">
          <MdError size={20} className="text-danger flex-shrink-0" />
          <div>
            <p className="text-xl lg:text-2xl font-bold text-danger">{porSeveridad.high ?? 0}</p>
            <p className="text-xs text-muted">Alta</p>
          </div>
        </div>

        {/* Severidad media */}
        <div className="bg-warning/5 border border-warning/20 rounded-2xl px-3 lg:px-4 py-3 flex items-center gap-2 lg:gap-3">
          <MdWarning size={20} className="text-warning flex-shrink-0" />
          <div>
            <p className="text-xl lg:text-2xl font-bold text-warning">{porSeveridad.medium ?? 0}</p>
            <p className="text-xs text-muted">Media</p>
          </div>
        </div>

        {/* Severidad baja */}
        <div className="bg-success/5 border border-success/20 rounded-2xl px-3 lg:px-4 py-3 flex items-center gap-2 lg:gap-3">
          <MdInfo size={20} className="text-success flex-shrink-0" />
          <div>
            <p className="text-xl lg:text-2xl font-bold text-success">{porSeveridad.low ?? 0}</p>
            <p className="text-xs text-muted">Baja</p>
          </div>
        </div>

      </div>

      <div className="hidden sm:block w-px h-12 bg-gray-200" />

      {/* Pills por tipo — ocultas en mobile */}
      <div className="hidden md:flex flex-wrap gap-2">
        <div className="bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-muted">
          <MdRouter size={14} />
          Sin señal: <span className="font-semibold text-dark">{(porTipo.node_offline ?? 0) + (porTipo.aire_sin_datos ?? 0) + (porTipo.control_ir_inactivo ?? 0)}</span>
        </div>
        <div className="bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-muted">
          <MdBolt size={14} />
          Consumo: <span className="font-semibold text-dark">{porTipo.power_anomaly ?? 0}</span>
        </div>
        <div className="bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-muted">
          <MdThermostat size={14} />
          Temperatura: <span className="font-semibold text-dark">{(porTipo.temperature_stuck ?? 0) + (porTipo.temperatura_alta ?? 0) + (porTipo.temperatura_fuera_rango ?? 0)}</span>
        </div>
        <div className="bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-muted">
          <MdThermostat size={14} />
          Sensor: <span className="font-semibold text-dark">{porTipo.sensor_datos_invalidos ?? 0}</span>
        </div>
        <div className="bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs text-muted">
          <MdThermostat size={14} />
          Humedad: <span className="font-semibold text-dark">{(porTipo.humedad_alta ?? 0) + (porTipo.humedad_invalida ?? 0)}</span>
        </div>
      </div>

    </div>
  )
}
