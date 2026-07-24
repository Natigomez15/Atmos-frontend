import { MdExpandMore } from "react-icons/md"

const ZONA_PANAMA = "America/Panama"

function porcentaje(valor) {
  const numero = Number(valor)
  if (valor == null || !Number.isFinite(numero)) return "No disponible"
  return `${(numero <= 1 ? numero * 100 : numero).toFixed(1)} %`
}

function fechaPanama(valor) {
  if (!valor) return "No disponible"
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return "No disponible"
  return new Intl.DateTimeFormat("es-PA", {
    timeZone: ZONA_PANAMA,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha)
}

function DatoTecnico({ etiqueta, valor }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <dt className="text-xs text-muted">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-semibold text-dark break-words tabular-nums">{valor ?? "No disponible"}</dd>
    </div>
  )
}

export default function ModelDetails({ info }) {
  const metricas = info?.metricas_disponibles ? info.metricas : null
  const importancias = info?.importancia_variables ?? []
  const aciertos = info?.aciertos_produccion

  return (
    <details className="group card p-0 overflow-hidden">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary/40"
        aria-label="Mostrar u ocultar detalles técnicos del modelo"
      >
        <div>
          <h2 className="section-title">Detalles técnicos del modelo</h2>
          <p className="mt-1 text-xs text-muted">Versión, validación e importancia de variables.</p>
        </div>
        <MdExpandMore size={22} className="shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>

      <div className="border-t border-gray-100 p-4 sm:p-6">
        <p className="mb-5 max-w-3xl rounded-xl bg-blue-50 px-4 py-3 text-sm leading-relaxed text-primary">
          Métricas obtenidas durante la validación del modelo. No representan por sí solas el rendimiento real en producción.
        </p>

        <dl className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-2.5">
          <DatoTecnico etiqueta="Tipo de modelo" valor={info?.tipo_modelo} />
          <DatoTecnico etiqueta="Versión" valor={info?.version_modelo} />
          <DatoTecnico etiqueta="Fecha de actualización" valor={fechaPanama(info?.fecha_entrenamiento)} />
          <DatoTecnico etiqueta="Cantidad de lecturas" valor={metricas?.n_muestras ?? "No disponible"} />
          <DatoTecnico etiqueta="Accuracy" valor={porcentaje(metricas?.accuracy)} />
          <DatoTecnico etiqueta="Precision" valor={porcentaje(metricas?.precision)} />
          <DatoTecnico etiqueta="Recall" valor={porcentaje(metricas?.recall)} />
          <DatoTecnico etiqueta="F1" valor={porcentaje(metricas?.f1)} />
        </dl>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section aria-labelledby="importancia-modelo-titulo">
            <h3 id="importancia-modelo-titulo" className="text-base font-semibold text-dark">Importancia de variables</h3>
            {importancias.length ? (
              <div className="mt-3 space-y-3">
                {importancias.map(variable => {
                  const importancia = Number(variable.importancia_pct)
                  const disponible = Number.isFinite(importancia)
                  return (
                    <div key={variable.variable}>
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-dark break-words">{variable.etiqueta ?? variable.variable}</span>
                        <span className="font-medium text-muted tabular-nums">{disponible ? `${importancia.toFixed(1)} %` : "No disponible"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        {disponible && <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, importancia))}%` }} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-muted">No disponible.</p>
            )}
          </section>

          <section aria-labelledby="aciertos-produccion-titulo">
            <h3 id="aciertos-produccion-titulo" className="text-base font-semibold text-dark">Aciertos en producción</h3>
            {aciertos?.estado === "disponible" ? (
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-muted">
                <p className="font-semibold text-dark">{porcentaje(aciertos.precision_pct)}</p>
                <p className="mt-1 leading-relaxed">
                  {aciertos.correctas} de {aciertos.evaluadas} recomendaciones evaluadas correctamente.
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <span className="badge-muted">En evaluación</span>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Aún no existen suficientes casos reales para calcular este indicador.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </details>
  )
}
