import { MdError, MdWarning, MdInfo } from "react-icons/md"

function TarjetaSeveridad({ Icono, color, cantidad, etiqueta }) {
  return (
    <div className={`bg-${color}/5 border border-${color}/20 rounded-2xl px-4 py-3 flex items-center gap-3`}>
      <Icono size={24} className={`text-${color} flex-shrink-0`} />
      <div>
        <p className={`text-2xl font-bold text-${color} leading-none`}>{cantidad ?? 0}</p>
        <p className="text-xs text-muted mt-0.5">{etiqueta}</p>
      </div>
    </div>
  )
}

export default function BarraEstadisticasAlertas({ resumen }) {
  const porSeveridad = resumen?.por_severidad ?? { high: 0, medium: 0, low: 0 }
  const porTipo      = resumen?.por_tipo      ?? {}

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Tarjetas de severidad */}
      <TarjetaSeveridad
        Icono={MdError}
        color="danger"
        cantidad={porSeveridad.high}
        etiqueta="Severidad alta"
      />
      <TarjetaSeveridad
        Icono={MdWarning}
        color="warning"
        cantidad={porSeveridad.medium}
        etiqueta="Severidad media"
      />
      <TarjetaSeveridad
        Icono={MdInfo}
        color="success"
        cantidad={porSeveridad.low}
        etiqueta="Severidad baja"
      />

      {/* Pills de tipo (ocultos en mobile) */}
      <div className="hidden md:flex flex-wrap gap-2">
        <span className="bg-gray-100 px-3 py-2 rounded-xl text-xs text-muted">
          Sin señal: <span className="font-semibold text-dark">{porTipo.node_offline ?? 0}</span>
        </span>
        <span className="bg-gray-100 px-3 py-2 rounded-xl text-xs text-muted">
          Consumo: <span className="font-semibold text-dark">{porTipo.power_anomaly ?? 0}</span>
        </span>
        <span className="bg-gray-100 px-3 py-2 rounded-xl text-xs text-muted">
          Temperatura: <span className="font-semibold text-dark">{(porTipo.temperature_stuck ?? 0) + (porTipo.temperatura_alta ?? 0) + (porTipo.temperatura_fuera_rango ?? 0)}</span>
        </span>
        <span className="bg-gray-100 px-3 py-2 rounded-xl text-xs text-muted">
          Sensor: <span className="font-semibold text-dark">{porTipo.sensor_datos_invalidos ?? 0}</span>
        </span>
        <span className="bg-gray-100 px-3 py-2 rounded-xl text-xs text-muted">
          Humedad: <span className="font-semibold text-dark">{(porTipo.humedad_alta ?? 0) + (porTipo.humedad_invalida ?? 0)}</span>
        </span>
      </div>
    </div>
  )
}
