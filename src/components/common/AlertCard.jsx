import { useState } from "react"
import {
  MdError, MdWarning, MdInfo, MdCheckCircle, MdAccessTime,
} from "react-icons/md"
import AccionProtegida from "./AccionProtegida"

function minutosDesde(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function etiquetaTiempoAtras(minutos) {
  if (minutos == null) return "—"
  if (minutos < 1)     return "Ahora mismo"
  if (minutos < 60)    return `hace ${minutos} min`
  const h = Math.floor(minutos / 60)
  return `hace ${h} h`
}

function formatearFechaHora(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const CONFIG_SEVERIDAD = {
  high:   { color: "danger",  etiqueta: "Alta",  Icono: MdError,   claseBorde: "border-l-danger",   claseInsignia: "badge-danger",   claseIcono: "text-danger" },
  medium: { color: "warning", etiqueta: "Media", Icono: MdWarning, claseBorde: "border-l-warning",  claseInsignia: "badge-warning",  claseIcono: "text-warning" },
  low:    { color: "success", etiqueta: "Baja",  Icono: MdInfo,    claseBorde: "border-l-success",  claseInsignia: "badge-success",  claseIcono: "text-success" },
}

const ETIQUETAS_TIPO = {
  node_offline:       "Nodo sin señal",
  power_anomaly:      "Consumo anómalo",
  temperature_stuck:  "Temperatura estancada",
}

const ETIQUETAS_DETALLE = {
  last_seen:        "Última señal",
  current_power_w:  "Potencia actual",
  baseline_power_w: "Potencia histórica",
  excess_pct:       "Exceso",
  avg_temperature:  "Temperatura promedio",
}

export default function AlertCard({ alerta, nombreSalon, alResolver, resolviendo, puedeResolver = true }) {
  const [detalleAbierto, setDetalleAbierto] = useState(false)

  const config    = CONFIG_SEVERIDAD[alerta.severity] ?? CONFIG_SEVERIDAD.medium
  const { Icono } = config
  const minutos   = minutosDesde(alerta.created_at)
  const tieneDetalle = alerta.detail && Object.keys(alerta.detail).length > 0

  return (
    <div className={`card border-l-4 ${config.claseBorde} flex flex-col gap-3`}>

      {/* Fila superior */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icono size={18} className={config.claseIcono} />
          <span className="font-medium text-dark text-sm">
            {ETIQUETAS_TIPO[alerta.alert_type] ?? alerta.alert_type ?? "Alerta"}
          </span>
        </div>
        {alerta.is_resolved
          ? <span className="badge-success">Resuelta</span>
          : <span className={config.claseInsignia}>{config.etiqueta}</span>
        }
      </div>

      {/* Mensaje */}
      <div>
        <p className="text-sm text-dark">{alerta.message ?? "Sin descripción"}</p>
        <p className="text-xs text-muted mt-0.5">
          {nombreSalon} • {etiquetaTiempoAtras(minutos)}
        </p>
      </div>

      {/* Detalle colapsable */}
      {tieneDetalle && (
        <div>
          <button
            onClick={() => setDetalleAbierto(p => !p)}
            className="text-xs text-secondary hover:underline"
          >
            {detalleAbierto ? "Ocultar ▴" : "Ver detalles ▾"}
          </button>
          {detalleAbierto && (
            <div className="bg-gray-50 rounded-xl p-3 mt-2 flex flex-col gap-1">
              {Object.entries(alerta.detail).map(([clave, valor]) => (
                <div key={clave} className="flex justify-between gap-4">
                  <span className="text-xs text-muted">
                    {ETIQUETAS_DETALLE[clave] ?? clave}
                  </span>
                  <span className="text-xs font-mono text-dark">{String(valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fila inferior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-gray-50">
        <div className="flex items-center gap-1 text-xs text-muted">
          <MdAccessTime size={13} />
          {formatearFechaHora(alerta.created_at)}
        </div>
        {alerta.is_resolved
          ? <span className="text-xs text-muted">
              Resuelta: {formatearFechaHora(alerta.resolved_at)}
            </span>
          : puedeResolver
            ? <AccionProtegida requiereRol="mantenimiento">
                <button
                  onClick={() => alResolver(alerta.id)}
                  disabled={resolviendo}
                  className="btn-secondary flex items-center justify-center gap-1.5 text-xs py-1.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resolviendo
                    ? <span className="w-3.5 h-3.5 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
                    : <MdCheckCircle size={14} />
                  }
                  Marcar resuelta
                </button>
              </AccionProtegida>
            : null
        }
      </div>

    </div>
  )
}
