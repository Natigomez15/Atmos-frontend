import { useState } from "react"
import { MdAutoGraph, MdExpandMore, MdSchedule } from "react-icons/md"
import AccionProtegida from "../common/AccionProtegida"

const ACCIONES = {
  apagar: "Apagar el Aire 1",
  encender_22: "Encender / regular a 22 °C",
  encender_23: "Regular a 23 °C",
  ahorro_24: "Modo ahorro a 24 °C",
  enfriar_fuerte: "Enfriamiento fuerte a 22 °C",
}

function numero(valor, decimales = 1) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido.toFixed(decimales) : "—"
}

function fecha(iso) {
  if (!iso) return "—"
  const valor = new Date(iso)
  if (Number.isNaN(valor.getTime())) return "—"
  return valor.toLocaleString("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function tiempoRelativo(iso) {
  if (!iso) return "hace un momento"
  const diferencia = Math.max(0, Date.now() - new Date(iso).getTime())
  const minutos = Math.floor(diferencia / 60000)
  if (minutos < 1) return "hace menos de 1 min"
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`
}

function presencia(valor) {
  if (valor === true || Number(valor) === 1) return "Con presencia"
  if (valor === false || Number(valor) === 0) return "Sin presencia"
  return "—"
}

function Metric({ valor, etiqueta }) {
  return (
    <div className="min-w-0">
      <p className="text-lg font-semibold text-dark leading-tight">{valor}</p>
      <p className="mt-1 text-xs text-muted">{etiqueta}</p>
    </div>
  )
}

export default function MLDecisionCard({
  decision,
  procesando,
  puedeControlar,
  alAceptar,
  alRechazar,
}) {
  const lectura = decision.lectura_contexto ?? {}
  const [ahora] = useState(() => Date.now())
  const expira = decision.expira_en ? new Date(decision.expira_en).getTime() : null
  const expirada = Number.isFinite(expira) && ahora >= expira
  const confianza = Number(decision.confianza_ml)
  const confianzaTexto = Number.isFinite(confianza)
    ? `${Math.round(confianza * 100)} % confianza`
    : "Confianza no disponible"
  const accion = ACCIONES[String(decision.accion ?? "").trim().toLowerCase()]
    ?? decision.accion
    ?? "Acción no disponible"
  const explicacion =
    decision.motivo_reglas_seguridad
    ?? decision.explicacion
    ?? decision.motivo
    ?? "Recomendación calculada a partir de las condiciones ambientales actuales."
  const variables = decision.features_usadas
    ?? decision.variables_ml
    ?? decision.metadata_modelo?.features_usadas

  return (
    <article
      id={`decision-${decision.decision_id}`}
      className="rounded-2xl border border-secondary/20 bg-white shadow-card-sm"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <MdAutoGraph size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark">ATMOS recomienda</p>
              <p className="mt-1 text-xs text-muted">
                {decision.aire?.replace("_", " ") ?? "Aire 1"} · {tiempoRelativo(decision.creada_en)}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            expirada ? "bg-gray-100 text-muted" : "bg-secondary/10 text-secondary"
          }`}>
            {expirada ? "Expirada" : confianzaTexto}
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-dark">{accion}</h2>

        <div className="mt-5 grid grid-cols-3 gap-3 border-y border-gray-100 py-4">
          <Metric
            valor={lectura.temperatura_ambiente != null ? `${numero(lectura.temperatura_ambiente)} °C` : "—"}
            etiqueta="Ambiente"
          />
          <Metric
            valor={lectura.humedad != null ? `${numero(lectura.humedad)} %` : "—"}
            etiqueta="Humedad"
          />
          <Metric valor={presencia(lectura.presencia)} etiqueta="Ocupación" />
        </div>

        <p className="mt-4 text-sm leading-6 text-muted line-clamp-2">{explicacion}</p>

        <details className="group mt-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30 rounded-lg">
            <MdExpandMore className="transition-transform group-open:rotate-180" size={19} />
            Ver detalles
          </summary>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl bg-gray-50 p-4 text-xs sm:grid-cols-2">
            <p className="text-muted">Temperatura de salida <strong className="block mt-1 text-dark">{lectura.temperatura_salida_aire != null ? `${numero(lectura.temperatura_salida_aire)} °C` : "—"}</strong></p>
            <p className="text-muted">Potencia <strong className="block mt-1 text-dark">{lectura.potencia_w != null ? `${numero(lectura.potencia_w)} W` : "—"}</strong></p>
            <p className="text-muted">Creada <strong className="block mt-1 text-dark">{fecha(decision.creada_en)}</strong></p>
            <p className="text-muted">Expira <strong className="block mt-1 text-dark">{fecha(decision.expira_en)}</strong></p>
            <p className="text-muted">Estado eléctrico <strong className="block mt-1 text-dark">{decision.estado_electrico_observado ?? "No confirmado"}</strong></p>
            <p className="text-muted">Modelo <strong className="block mt-1 text-dark">{decision.tipo_modelo ?? decision.version_modelo ?? "—"}</strong></p>
            <div className="sm:col-span-2">
              <p className="text-muted">Explicación completa</p>
              <p className="mt-1 leading-5 text-dark">{explicacion}</p>
            </div>
            {variables && (
              <div className="sm:col-span-2">
                <p className="text-muted">Variables utilizadas por el ML</p>
                <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-words font-sans leading-5 text-dark">
                  {typeof variables === "string" ? variables : JSON.stringify(variables, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </details>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className={`flex items-center gap-1.5 text-xs font-medium ${expirada ? "text-danger" : "text-warning"}`}>
            <MdSchedule size={16} aria-hidden="true" />
            {expirada ? "Esta recomendación ya no puede enviarse" : "Esperando tu aprobación"}
          </p>

          {puedeControlar ? (
            <AccionProtegida requiereRol="mantenimiento">
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  onClick={alRechazar}
                  disabled={procesando || expirada}
                  className="btn-secondary min-h-11 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={alAceptar}
                  disabled={procesando || expirada}
                  className="btn-primary min-h-11 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {procesando ? "Procesando…" : "Aceptar y enviar"}
                </button>
              </div>
            </AccionProtegida>
          ) : (
            <p className="text-xs text-muted">Requiere rol de mantenimiento o administrador.</p>
          )}
        </div>
      </div>
    </article>
  )
}
