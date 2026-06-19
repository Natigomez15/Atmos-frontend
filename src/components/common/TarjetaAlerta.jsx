import { useState } from "react"
import {
  MdError, MdWarning, MdInfo,
  MdAccessTime, MdCheckCircle,
  MdExpandMore, MdExpandLess,
} from "react-icons/md"

const CONFIG_SEVERIDAD = {
  high:   { etiqueta: "Alta",  Icono: MdError,   bordeClase: "border-l-danger",  insignia: "badge-danger",  fondoIcono: "bg-danger/10",  textoIcono: "text-danger" },
  medium: { etiqueta: "Media", Icono: MdWarning, bordeClase: "border-l-warning", insignia: "badge-warning", fondoIcono: "bg-warning/10", textoIcono: "text-warning" },
  low:    { etiqueta: "Baja",  Icono: MdInfo,    bordeClase: "border-l-success", insignia: "badge-success", fondoIcono: "bg-success/10", textoIcono: "text-success" },
}

const ETIQUETA_TIPO = {
  node_offline:           "Nodo sin señal",
  power_anomaly:          "Consumo anómalo",
  temperature_stuck:      "Temperatura estancada",
  sensor_datos_invalidos: "Sensor con datos inválidos",
  temperatura_alta:       "Temperatura alta",
  temperatura_fuera_rango:"Temperatura fuera de rango",
  humedad_alta:           "Humedad alta",
  humedad_invalida:       "Humedad inválida",
  aire_sin_datos:         "Aire sin datos",
  control_ir_inactivo:    "Señal IR detenida",
}

function tiempoTranscurrido(isoFecha) {
  if (!isoFecha) return "—"
  const segundos = Math.floor((Date.now() - new Date(isoFecha).getTime()) / 1000)
  if (segundos < 60)    return "hace un momento"
  if (segundos < 3600)  return `hace ${Math.floor(segundos / 60)} min`
  if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`
  return `hace ${Math.floor(segundos / 86400)} días`
}

function formatearFecha(isoFecha) {
  if (!isoFecha) return "—"
  return new Date(isoFecha).toLocaleString("es-PA", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
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

  const cfg = CONFIG_SEVERIDAD[alerta.severidad] ?? CONFIG_SEVERIDAD.low
  const { Icono, etiqueta, bordeClase, insignia, fondoIcono, textoIcono } = cfg
  const etiquetaTipo = ETIQUETA_TIPO[alerta.tipo_alerta] ?? alerta.tipo_alerta

  return (
    <div className={`card border-l-4 ${bordeClase} flex flex-col gap-3 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200`}>

      {/* Fila superior */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-xl ${fondoIcono} flex items-center justify-center shrink-0`}>
            <Icono size={15} className={textoIcono} />
          </span>
          <span className="font-semibold text-dark text-sm leading-tight">{etiquetaTipo}</span>
        </div>
        {alerta.esta_resuelta
          ? <span className="badge-success whitespace-nowrap">Resuelta</span>
          : <span className={`${insignia} whitespace-nowrap`}>{etiqueta}</span>
        }
      </div>

      {/* Cuerpo */}
      <div>
        <p className="text-sm text-dark leading-relaxed">{alerta.mensaje}</p>
        <p className="text-xs text-muted mt-1">
          {nombreSala ?? "Sala desconocida"} · {tiempoTranscurrido(alerta.creado_en)}
        </p>
      </div>

      {/* Detalles colapsables */}
      {alerta.detalle && Object.keys(alerta.detalle).length > 0 && (
        <div>
          <button
            onClick={() => setDetalleVisible(v => !v)}
            className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 font-medium transition-colors"
          >
            {detalleVisible ? <MdExpandLess size={15} /> : <MdExpandMore size={15} />}
            {detalleVisible ? "Ocultar detalles" : "Ver detalles"}
          </button>
          {detalleVisible && (
            <div className="bg-gray-50 rounded-xl p-3 mt-2 flex flex-col gap-2 border border-gray-100">
              {Object.entries(alerta.detalle).map(([clave, valor]) => (
                <div key={clave} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted capitalize">
                    {clave.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-mono text-dark bg-white px-2 py-0.5 rounded-md border border-gray-100 shrink-0">
                    {String(valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fila inferior */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MdAccessTime size={13} />
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
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
