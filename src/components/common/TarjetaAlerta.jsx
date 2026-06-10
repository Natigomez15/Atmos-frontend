import { useState } from "react"
import {
  MdError, MdWarning, MdInfo,
  MdAccessTime, MdCheckCircle,
  MdExpandMore, MdExpandLess,
} from "react-icons/md"

// Configuración visual por nivel de severidad
const CONFIG_SEVERIDAD = {
  high:   { color: "danger",  etiqueta: "Alta",  Icono: MdError,   bordeClase: "border-l-danger" },
  medium: { color: "warning", etiqueta: "Media", Icono: MdWarning, bordeClase: "border-l-warning" },
  low:    { color: "success", etiqueta: "Baja",  Icono: MdInfo,    bordeClase: "border-l-success" },
}

// Etiquetas en español para cada tipo de alerta
const ETIQUETA_TIPO = {
  node_offline:      "Nodo sin señal",
  power_anomaly:     "Consumo anómalo",
  temperature_stuck: "Temperatura estancada",
  sensor_datos_invalidos: "Sensor con datos inválidos",
  temperatura_alta: "Temperatura alta",
  temperatura_fuera_rango: "Temperatura fuera de rango",
  humedad_alta: "Humedad alta",
  humedad_invalida: "Humedad inválida",
}

function tiempoTranscurrido(isoFecha) {
  if (!isoFecha) return "—"
  const segundos = Math.floor((Date.now() - new Date(isoFecha).getTime()) / 1000)
  if (segundos < 60)   return "hace un momento"
  if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} min`
  if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`
  return `hace ${Math.floor(segundos / 86400)} días`
}

function formatearFecha(isoFecha) {
  if (!isoFecha) return "—"
  return new Date(isoFecha).toLocaleString("es-PA", {
    day:    "2-digit",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

export default function TarjetaAlerta({
  alerta,
  nombreSala,
  alResolver,
  resolviendo,
  puedeResolver,
}) {
  const [detalleVisible, setDetalleVisible] = useState(false)

  const cfg    = CONFIG_SEVERIDAD[alerta.severidad] ?? CONFIG_SEVERIDAD.low
  const { Icono, color, etiqueta, bordeClase } = cfg
  const etiquetaTipo = ETIQUETA_TIPO[alerta.tipo_alerta] ?? alerta.tipo_alerta

  return (
    <div className={`card border-l-4 ${bordeClase} flex flex-col gap-3`}>

      {/* Fila superior: tipo + badge estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icono size={18} className={`text-${color} flex-shrink-0`} />
          <span className="font-medium text-dark text-sm">{etiquetaTipo}</span>
        </div>

        {alerta.esta_resuelta
          ? <span className="badge-success whitespace-nowrap">Resuelta</span>
          : <span className={`badge-${color} whitespace-nowrap`}>{etiqueta}</span>
        }
      </div>

      {/* Cuerpo: mensaje y metadatos */}
      <div>
        <p className="text-sm text-dark">{alerta.mensaje}</p>
        <p className="text-xs text-muted mt-1">
          {nombreSala ?? "Sala desconocida"}
          {" • "}
          {tiempoTranscurrido(alerta.creado_en)}
        </p>
      </div>

      {/* Detalles colapsables */}
      {alerta.detalle && Object.keys(alerta.detalle).length > 0 && (
        <div>
          <button
            onClick={() => setDetalleVisible(v => !v)}
            className="flex items-center gap-1 text-xs text-secondary cursor-pointer hover:underline"
          >
            {detalleVisible
              ? <><MdExpandLess size={14} /> Ocultar detalles</>
              : <><MdExpandMore size={14} /> Ver detalles</>
            }
          </button>

          {detalleVisible && (
            <div className="bg-gray-50 rounded-xl p-3 mt-2 flex flex-col gap-1.5">
              {Object.entries(alerta.detalle).map(([clave, valor]) => (
                <div key={clave} className="flex items-start gap-2">
                  <span className="text-xs text-muted min-w-[140px] capitalize">
                    {clave.replace(/_/g, " ")}:
                  </span>
                  <span className="text-xs font-mono text-dark break-all">
                    {String(valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fila inferior: timestamp + acción */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MdAccessTime size={14} />
          <span>{formatearFecha(alerta.creado_en)}</span>
        </div>

        {alerta.esta_resuelta
          ? <span className="text-xs text-muted">
              Resuelta: {formatearFecha(alerta.resuelto_en)}
            </span>
          : puedeResolver && (
            <button
              onClick={() => alResolver(alerta.id)}
              disabled={resolviendo}
              className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resolviendo
                ? <span className="w-3 h-3 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                : <MdCheckCircle size={14} />
              }
              Marcar resuelta
            </button>
          )
        }
      </div>
    </div>
  )
}
