import { useId, useState } from "react"
import {
  MdExpandMore,
  MdWarning,
} from "react-icons/md"

import DecisionFlow from "./DecisionFlow"

const ZONA_PANAMA = "America/Panama"

const ETIQUETAS_ACCION = {
  apagar: "Apagar",
  mantener: "Mantener",
  ahorro_24: "Modo ahorro a 24 °C",
  encender_22: "Encender a 22 °C",
  encender_23: "Encender a 23 °C",
  enfriar_fuerte: "Enfriar intensamente",
}

function etiquetaAccion(valor, recomendacionPrincipal = false) {
  if (valor == null || valor === "") return "No disponible"
  const normalizado = String(valor).trim().toLowerCase()
  if (recomendacionPrincipal && normalizado === "mantener") return "Mantener estado actual"
  return ETIQUETAS_ACCION[normalizado] ?? String(valor).replaceAll("_", " ")
}

function fechaValida(valor) {
  if (!valor) return null
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function porcentajeConfianza(valor) {
  const numero = Number(valor)
  if (valor == null || !Number.isFinite(numero)) return null
  return Math.max(0, Math.min(100, Math.round(numero <= 1 ? numero * 100 : numero)))
}

function partesFechaPanama(valor) {
  const fecha = fechaValida(valor)
  if (!fecha) return null
  const partes = new Intl.DateTimeFormat("es-PA", {
    timeZone: ZONA_PANAMA,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(fecha)
  const parte = tipo => partes.find(item => item.type === tipo)?.value
  const mes = parte("month")?.replace(".", "")
  return `${parte("day")} ${mes} ${parte("year")} · ${parte("hour")}:${parte("minute")} ${parte("dayPeriod")}`
}

function tiempoRelativo(valor) {
  const fecha = fechaValida(valor)
  if (!fecha) return null
  const minutos = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 60000))
  if (minutos < 1) return "hace un momento"
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`
}

function traducirAdvertencia(advertencia) {
  const texto = String(advertencia ?? "").trim()
  if (!texto) return null
  const normalizado = texto.toLowerCase()
  if (normalizado.includes("accion_no_reconocida")) {
    return "La ejecución devolvió un resultado que ATMOS no pudo verificar."
  }
  if (normalizado.includes("confirm")) {
    return "La señal fue enviada, pero no existe confirmación física del aire."
  }
  return texto
}

function DatoDetalle({ etiqueta, valor }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm font-medium leading-snug text-dark break-words">{valor ?? "No disponible"}</dd>
    </div>
  )
}

export function PredictionCardSkeleton() {
  return (
    <div className="card p-4 sm:p-6 motion-safe:animate-pulse" aria-label="Cargando decisión actual">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-gray-100" />
          <div className="h-6 w-56 max-w-full rounded bg-gray-100" />
        </div>
        <div className="h-7 w-36 rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 h-20 rounded-xl bg-gray-100" />
      <div className="mt-3 h-5 w-44 rounded bg-gray-100" />
    </div>
  )
}

export default function PredictionCard({ datos }) {
  const [detallesAbiertos, setDetallesAbiertos] = useState(false)
  const idDetalles = useId()
  const prediccion = etiquetaAccion(datos.prediccion)
  const recomendacion = etiquetaAccion(datos.recomendacion)
  const accionSolicitada = etiquetaAccion(datos.accionSolicitada)
  const confianza = porcentajeConfianza(datos.confianza)
  const fechaExacta = partesFechaPanama(datos.actualizadoEn) ?? "No disponible"
  const advertencias = (datos.advertencias ?? []).map(traducirAdvertencia).filter(Boolean)
  const valoresComparables = datos.recomendacion != null && datos.accionSolicitada != null
  const accionInconsistente = valoresComparables &&
    String(datos.recomendacion).trim().toLowerCase() !== String(datos.accionSolicitada).trim().toLowerCase()
  const ultimaAccion = etiquetaAccion(
    datos.ejecucion?.ultima_accion ?? datos.ejecucion?.ultima_accion_ejecutada,
  )
  const resultadoFirebase = datos.ejecucion?.resultado ?? datos.ejecucion?.resultado_raw ?? datos.ejecucion?.resultado_firebase ?? "No disponible"
  const fechaMotivoReferencia = partesFechaPanama(datos.motivoReferenciaEn)
  const motivoReglas = datos.motivo || (datos.motivoReferencia
    ? `El registro actual no incluyó el motivo. Último motivo disponible${fechaMotivoReferencia ? ` (${fechaMotivoReferencia})` : ""}: ${datos.motivoReferencia}`
    : "El registro actual no incluyó un motivo detallado.")
  const relativo = tiempoRelativo(datos.actualizadoEn) ?? "No disponible"
  const estadoEjecucion = String(datos.ejecucion?.estado ?? "sin_registro").trim().toLowerCase()
  const incidenciaEjecucion = ["fallida", "inconsistente"].includes(estadoEjecucion)

  return (
    <article className="card w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-5" aria-labelledby="decision-actual-titulo">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-violet-700">Decisión actual</p>
          <h2 id="decision-actual-titulo" className="section-title mt-0.5 leading-tight break-words">
            {etiquetaAccion(datos.recomendacion, true)}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
          <p className="text-xs text-muted">Actualizado {relativo}</p>
        </div>
      </header>

      <div className="mt-2">
        <DecisionFlow
          prediccion={prediccion}
          confianza={datos.confianza}
          modificada={datos.modificada}
          recomendacion={recomendacion}
          accionSolicitada={accionSolicitada}
          ejecucion={datos.ejecucion}
        />
      </div>

      {(datos.fuentesDesincronizadas || incidenciaEjecucion) && (
        <aside className="mt-2 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-1.5" role="status">
          <MdWarning size={17} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-dark">
            {datos.fuentesDesincronizadas
              ? "Los datos de predicción y ejecución no están sincronizados."
              : "ATMOS registró un problema de comunicación durante la ejecución."}
          </p>
        </aside>
      )}

      <div className="mt-2 border-t border-gray-100 pt-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          aria-expanded={detallesAbiertos}
          aria-controls={idDetalles}
          onClick={() => setDetallesAbiertos(abiertos => !abiertos)}
        >
          Ver detalles
          <MdExpandMore size={18} className={`transition-transform motion-reduce:transition-none ${detallesAbiertos ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {detallesAbiertos && (
          <div id={idDetalles} className="mt-3 rounded-xl bg-slate-50 p-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DatoDetalle etiqueta="Predicción original" valor={prediccion} />
              <DatoDetalle etiqueta="Confianza completa" valor={confianza == null ? "No disponible" : `${confianza} %`} />
              <DatoDetalle etiqueta="Reglas aplicadas" valor={datos.modificada ? "Predicción ajustada" : "Sin ajustes"} />
              <DatoDetalle etiqueta="Motivo del ajuste" valor={motivoReglas} />
              <DatoDetalle etiqueta="Recomendación final" valor={recomendacion} />
              <DatoDetalle etiqueta="Acción solicitada" valor={accionSolicitada} />
              <DatoDetalle etiqueta="Acción finalmente enviada" valor={ultimaAccion} />
              <DatoDetalle etiqueta="Confirmación del dispositivo" valor={datos.ejecucion?.confirmacion_ir_raw ?? datos.ejecucion?.confirmacion ?? datos.ejecucion?.mensaje ?? "No disponible"} />
              <DatoDetalle etiqueta="Resultado de Firebase" valor={resultadoFirebase} />
              <DatoDetalle etiqueta="Fecha exacta" valor={`${fechaExacta} · hora de Panamá`} />
            </dl>

            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-dark">Advertencias técnicas</p>
              {(advertencias.length || accionInconsistente) ? (
                <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted">
                  {accionInconsistente && <li>La acción solicitada y la recomendación final registradas son diferentes.</li>}
                  {advertencias.map((advertencia, indice) => <li key={`${advertencia}-${indice}`}>{advertencia}</li>)}
                </ul>
              ) : (
                <p className="mt-1.5 text-xs text-muted">Sin advertencias técnicas registradas.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
