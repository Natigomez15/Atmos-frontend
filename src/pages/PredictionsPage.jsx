import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  MdAutoGraph,
  MdBolt,
  MdCheckCircle,
  MdVerified,
} from "react-icons/md"

import PageWrapper from "../components/layout/PageWrapper"
import PageHeader  from "../components/common/PageHeader"
import KPICard from "../components/common/KPICard"
import PredictionCard from "../components/common/PredictionCard"
import FeaturesChart from "../components/charts/FeaturesChart"

import {
  aplicarPrediccion,
  obtenerCaracteristicasML,
  obtenerInfoModelo,
  obtenerSalonesPrediciones,
  obtenerTodasUltimasPredicciones,
} from "../api/predictions"

const ZONA_PANAMA = "America/Panama"

function esPrediccionGuardada(prediccion) {
  return prediccion.disponible === true || prediccion.fuente === "ml_predictions"
}

function fechaPanamaYMD(iso) {
  if (!iso) return null
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return null
  return fecha.toLocaleDateString("en-CA", { timeZone: ZONA_PANAMA })
}

function BarraImportancia({ etiqueta, porcentaje }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-dark w-40 truncate" title={etiqueta}>{etiqueta}</p>
      <div className="flex-1 bg-gray-100 h-2 rounded-full">
        <div className="bg-secondary h-2 rounded-full" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-xs text-muted w-10 text-right tabular-nums">{porcentaje.toFixed(1)}%</p>
    </div>
  )
}

function FilaMetrica({ etiqueta, valor }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted">{etiqueta}</p>
      <p className="text-xs font-medium text-dark text-right tabular-nums">{valor}</p>
    </div>
  )
}

export default function PredictionsPage() {
  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState("")
  const [idAplicando, setIdAplicando] = useState(null)

  const { data: salones } = useQuery({
    queryKey: ["rooms"],
    queryFn: obtenerSalonesPrediciones,
  })

  // Auto-selección del primer espacio (cubre el caso de un solo espacio) como
  // valor DERIVADO: si el usuario aún no eligió, se usa el primero disponible.
  const idSalonEfectivo = idSalonSeleccionado || (salones?.length ? String(salones[0].id) : "")

  const {
    data: todasPredicciones,
    isLoading: cargandoPredicciones,
    isError: errorPredicciones,
    error: detalleErrorPredicciones,
    refetch: recargarPredicciones,
  } = useQuery({
    queryKey: ["all-predictions"],
    queryFn: obtenerTodasUltimasPredicciones,
    refetchInterval: 60000,
  })

  const { data: infoModelo, isLoading: cargandoModelo } = useQuery({
    queryKey: ["ml-modelo-info"],
    queryFn: obtenerInfoModelo,
    refetchInterval: 60000,
  })

  const { data: caracteristicas, isLoading: cargandoCaracteristicas } = useQuery({
    queryKey: ["ml-features", idSalonEfectivo],
    queryFn: () => obtenerCaracteristicasML(idSalonEfectivo, 7),
    enabled: !!idSalonEfectivo,
  })

  const metricas = infoModelo?.metricas
  const metricasDisponibles = infoModelo?.metricas_disponibles === true
  const aciertos = infoModelo?.aciertos_produccion

  // La tarjeta principal usa únicamente resultados observados en producción.
  // No presenta la validación sintética como si fuera precisión del mundo real.
  const precisionRealValor = aciertos?.estado === "disponible"
    ? Number(aciertos.precision_pct).toFixed(1)
    : null
  const precisionRealDescripcion = precisionRealValor != null
    ? `${aciertos.correctas} de ${aciertos.evaluadas} apagados acertados`
    : "En evaluación con lecturas reales"

  // 4b) Predicciones hoy: conteo real de predicciones guardadas hoy (Panamá).
  const hoyPanama = fechaPanamaYMD(new Date().toISOString())
  const prediccionesHoy = useMemo(() =>
    todasPredicciones?.filter(p =>
      esPrediccionGuardada(p) && fechaPanamaYMD(p.predicted_at) === hoyPanama
    ).length ?? 0,
    [todasPredicciones, hoyPanama]
  )

  // 4c) Recomendaciones activas: espacios con recomendación (guardada u operativa).
  const recomendacionesActivas = useMemo(() =>
    todasPredicciones?.filter(p => esPrediccionGuardada(p) || p.fallback_disponible).length ?? 0,
    [todasPredicciones]
  )
  const hayEspacios = (todasPredicciones?.length ?? 0) > 0
  const activasInactivo = recomendacionesActivas === 0 && hayEspacios

  const promedioTemperatura = useMemo(() => {
    const validos = caracteristicas?.filter(c => c.avg_temp != null) ?? []
    if (!validos.length) return null
    return (validos.reduce((acc, c) => acc + c.avg_temp, 0) / validos.length).toFixed(1)
  }, [caracteristicas])

  const promedioPresencia = useMemo(() => {
    const validos = caracteristicas?.filter(c => c.presence_ratio != null) ?? []
    if (!validos.length) return null
    return (validos.reduce((acc, c) => acc + c.presence_ratio, 0) / validos.length * 100).toFixed(0)
  }, [caracteristicas])

  const promedioPotencia = useMemo(() => {
    const validos = caracteristicas?.filter(c => c.avg_power_w != null) ?? []
    if (!validos.length) return null
    return (validos.reduce((acc, c) => acc + c.avg_power_w, 0) / validos.length).toFixed(0)
  }, [caracteristicas])

  const importancias = infoModelo?.importancia_variables ?? []

  async function manejarAplicar(idPrediccion) {
    if (!idPrediccion) return
    setIdAplicando(idPrediccion)
    try {
      await aplicarPrediccion(idPrediccion)
      recargarPredicciones()
    } finally {
      setIdAplicando(null)
    }
  }

  // Chips del análisis: sin dato → "–" fino gris, nunca la unidad pegada al guión.
  const hayCaracteristicas = (caracteristicas?.length ?? 0) > 0
  const chips = [
    { etiqueta: "Temp promedio", valor: promedioTemperatura, unidad: "°C" },
    { etiqueta: "Presencia",     valor: promedioPresencia,    unidad: "%" },
    { etiqueta: "Potencia promedio", valor: promedioPotencia, unidad: "W" },
    { etiqueta: "Horas con datos", valor: String(caracteristicas?.length ?? 0), unidad: "" },
  ]

  const unaPrediccion = (todasPredicciones?.length ?? 0) === 1

  return (
    <PageWrapper>
      <div className="mb-6">
        <PageHeader
          eyebrow="Motor de inteligencia"
          title="Predicciones ATMOS"
          description="Recomendaciones y predicciones en tiempo real."
          actions={
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
            >
              <MdAutoGraph size={14} /> Motor ATMOS v1
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        <KPICard
          titulo="Aciertos reales de apagado"
          valor={precisionRealValor ?? "–"}
          unidad={precisionRealValor != null ? "%" : undefined}
          icono={<MdVerified size={20} />}
          linea={precisionRealDescripcion}
          cargando={cargandoModelo}
        />
        <KPICard
          titulo="Predicciones hoy"
          valor={prediccionesHoy}
          icono={<MdBolt size={20} />}
          linea="Guardadas por el motor hoy"
          cargando={cargandoPredicciones}
        />
        <KPICard
          titulo="Recomendaciones activas"
          valor={recomendacionesActivas}
          icono={<MdCheckCircle size={20} />}
          linea="Espacios con recomendación ahora"
          badgeTexto={activasInactivo ? "Inactivo" : undefined}
          tono={activasInactivo ? "warning" : "neutral"}
          cargando={cargandoPredicciones}
        />
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="text-lg font-semibold text-dark">Recomendación por espacio</h3>
        <span className="text-xs text-muted">Actualizado cada 60 segundos</span>
      </div>

      {cargandoPredicciones ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, indice) => (
            <div key={indice} className="card h-52 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : errorPredicciones ? (
        <div className="card mb-6 border-l-4 border-l-danger">
          <p className="font-semibold text-dark text-sm">No se pudieron cargar las recomendaciones</p>
          <p className="text-xs text-muted mt-1">
            El frontend no recibió la respuesta de predicciones desde el backend.
          </p>
          <p className="text-xs text-danger mt-2">
            {detalleErrorPredicciones?.message ?? "Error desconocido"}
          </p>
          <button onClick={() => recargarPredicciones()} className="btn-secondary mt-3 text-xs">
            Reintentar
          </button>
        </div>
      ) : !todasPredicciones?.length ? (
        <div className="card mb-6">
          <p className="font-semibold text-dark text-sm">Sin espacios para mostrar</p>
          <p className="text-xs text-muted mt-1">
            El backend no devolvió espacios ni recomendaciones operativas para esta vista.
          </p>
          <button onClick={() => recargarPredicciones()} className="btn-secondary mt-3 text-xs">
            Reintentar
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 mb-6 ${unaPrediccion ? "" : "md:grid-cols-2"}`}>
          {todasPredicciones?.map((prediccion, indice) => (
            <PredictionCard
              key={prediccion.room_id ?? indice}
              prediccion={prediccion}
              alAplicar={manejarAplicar}
              aplicando={idAplicando === prediccion.id}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="font-semibold text-dark text-sm">Análisis detallado</p>
            <select
              value={idSalonEfectivo}
              onChange={evento => setIdSalonSeleccionado(evento.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-dark
                         focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              <option value="">Seleccionar espacio</option>
              {salones?.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name ?? salon.nombre}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted mb-3">
            Últimos 7 días disponibles desde registros reales.
          </p>

          <FeaturesChart datos={caracteristicas ?? []} cargando={cargandoCaracteristicas} />

          <hr className="border-gray-100 my-4" />

          {hayCaracteristicas ? (
            <div className="flex flex-wrap gap-2">
              {chips.map(chip => (
                <span
                  key={chip.etiqueta}
                  className="text-xs bg-gray-50 text-muted px-3 py-1 rounded-full"
                >
                  {chip.etiqueta}: {chip.valor == null
                    ? <span className="text-gray-300">–</span>
                    : <>{chip.valor}{chip.unidad && ` ${chip.unidad}`}</>}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted bg-gray-50 rounded-xl px-3 py-2">
              Aún no hay lecturas válidas suficientes para calcular promedios.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 card flex flex-col gap-4">
          <p className="font-semibold text-dark text-sm">Sobre el motor</p>

          <div className="flex flex-col gap-2">
            <FilaMetrica etiqueta="Tipo" valor={infoModelo?.tipo_modelo ?? "RandomForestClassifier"} />
            <FilaMetrica etiqueta="Versión" valor={infoModelo?.version_modelo ?? "modelo_atmos_rf_v1"} />
            <FilaMetrica etiqueta="Se actualiza" valor="Con cada lectura nueva" />
          </div>

          <hr className="border-gray-100" />

          {/* Validación sintética (estática por versión, no equivale a producción) */}
          <div>
            <p className="text-sm font-medium text-dark mb-1">Validación sintética</p>
            <p className="text-[11px] text-muted mb-2">
              Prueba controlada del entrenamiento; no representa precisión real.
            </p>
            {cargandoModelo ? (
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ) : metricasDisponibles && metricas ? (
              <div className="flex flex-col gap-1.5">
                <FilaMetrica etiqueta="Accuracy" valor={`${(metricas.accuracy * 100).toFixed(1)}%`} />
                <FilaMetrica etiqueta="Precisión" valor={`${(metricas.precision * 100).toFixed(1)}%`} />
                <FilaMetrica etiqueta="Recall" valor={`${(metricas.recall * 100).toFixed(1)}%`} />
                <FilaMetrica etiqueta="F1" valor={`${(metricas.f1 * 100).toFixed(1)}%`} />
                {metricas.n_muestras != null && (
                  <FilaMetrica etiqueta="Dataset" valor={`${metricas.n_muestras} lecturas`} />
                )}
                {infoModelo?.fecha_entrenamiento && (
                  <FilaMetrica etiqueta="Entrenado" valor={infoModelo.fecha_entrenamiento} />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted bg-gray-50 rounded-xl px-3 py-2">
                No disponible para esta versión. Las métricas se registrarán en el próximo reentrenamiento.
              </p>
            )}
          </div>

          {/* Aciertos en producción (Fase 2.3) */}
          <div>
            <p className="text-sm font-medium text-dark mb-1">Aciertos en producción</p>
            {aciertos?.estado === "disponible" ? (
              <p className="text-xs text-muted">
                <span className="font-semibold text-dark">{aciertos.precision_pct}%</span>{" "}
                de {aciertos.evaluadas} recomendaciones de apagado correctas
                (sin ocupación en {aciertos.ventana_min} min, usando lecturas de Firebase).
              </p>
            ) : (
              <p className="text-xs text-muted bg-gray-50 rounded-xl px-3 py-2">
                Pendiente: aún no hay apagados con {aciertos?.ventana_min ?? 45} minutos cumplidos
                para evaluarlos con las lecturas reales de Firebase.
              </p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* 5) Importancia de variables (real, del entrenamiento) */}
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <p
                className="text-sm font-medium text-dark"
                title="Peso de cada variable en las decisiones del modelo, calculado durante el entrenamiento."
              >
                Importancia de variables del modelo
              </p>
            </div>
            <p className="text-[11px] text-muted mb-3">
              Del entrenamiento · {infoModelo?.version_modelo ?? "modelo_atmos_rf_v1"}
            </p>
            {cargandoModelo ? (
              <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ) : importancias.length ? (
              <div className="flex flex-col gap-2.5">
                {importancias.map(variable => (
                  <BarraImportancia
                    key={variable.variable}
                    etiqueta={variable.etiqueta}
                    porcentaje={variable.importancia_pct}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No disponible.</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
