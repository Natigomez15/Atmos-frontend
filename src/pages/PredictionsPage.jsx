import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  MdSavings,
  MdBolt,
  MdCheckCircle,
  MdAutoGraph,
  MdAssessment,
} from "react-icons/md"

import PageWrapper      from "../components/layout/PageWrapper"
import KPICard          from "../components/common/KPICard"
import PredictionCard   from "../components/common/PredictionCard"
import FeaturesChart    from "../components/charts/FeaturesChart"

import {
  obtenerSalonesPrediciones,
  obtenerTodasUltimasPredicciones,
  obtenerCaracteristicasML,
  aplicarPrediccion,
  dispararEvaluacion,
  decidirAtmos,
  obtenerImpactoDecisiones,
  obtenerImpactoReal,
} from "../api/predictions"

const IMPORTANCIA_VARIABLES = [
  { etiqueta: "Ratio de presencia",   porcentaje: 42 },
  { etiqueta: "Hora del día",         porcentaje: 28 },
  { etiqueta: "Temperatura promedio", porcentaje: 15 },
  { etiqueta: "Día de la semana",     porcentaje:  9 },
  { etiqueta: "Consumo previo",       porcentaje:  6 },
]

function BarraImportancia({ etiqueta, porcentaje }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-dark w-40 truncate">{etiqueta}</p>
      <div className="flex-1 bg-gray-100 h-2 rounded-full">
        <div
          className="bg-secondary h-2 rounded-full"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="text-xs text-muted w-8 text-right">{porcentaje}%</p>
    </div>
  )
}

export default function PredictionsPage() {
  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState("")
  const [idAplicando,         setIdAplicando]         = useState(null)
  const [evaluando,           setEvaluando]           = useState(false)
  const [evaluandoAtmos,      setEvaluandoAtmos]      = useState(false)
  const [resultadoAtmos,      setResultadoAtmos]      = useState(null)
  const [errorAtmos,          setErrorAtmos]          = useState("")
  const [lecturaAtmos,        setLecturaAtmos]        = useState({
    presencia:             1,
    temp_ambiente:         30,
    temp_ac:               22,
    humedad:               75,
    minutos_sin_presencia: 0,
  })

  // ── Queries ────────────────────────────────────────────────────────

  const { data: todasPredicciones, isLoading: cargandoPredicciones, refetch: recargarPredicciones } = useQuery({
    queryKey:        ["all-predictions"],
    queryFn:         obtenerTodasUltimasPredicciones,
    refetchInterval: 60000,
  })

  const { data: salones } = useQuery({
    queryKey: ["rooms"],
    queryFn:  obtenerSalonesPrediciones,
    onSuccess: (datos) => {
      if (!idSalonSeleccionado && datos?.length) {
        setIdSalonSeleccionado(String(datos[0].id))
      }
    },
  })

  const { data: impactoDecisiones, isLoading: cargandoImpacto } = useQuery({
    queryKey:        ["ml-impacto-decisiones"],
    queryFn:         obtenerImpactoDecisiones,
    refetchInterval: 60000,
  })

  const { data: impactoReal } = useQuery({
    queryKey:        ["ml-impacto-real"],
    queryFn:         obtenerImpactoReal,
    refetchInterval: 300000,
  })

  const { data: caracteristicas, isLoading: cargandoCaracteristicas } = useQuery({
    queryKey: ["ml-features", idSalonSeleccionado],
    queryFn:  () => obtenerCaracteristicasML(idSalonSeleccionado, 7),
    enabled:  !!idSalonSeleccionado,
  })

  // ── Datos derivados ────────────────────────────────────────────────

  const versionModelo = useMemo(
    () => todasPredicciones?.find(p => p.model_version)?.model_version ?? "—",
    [todasPredicciones]
  )

  const promedioAhorro = useMemo(() => {
    const conDatos = todasPredicciones?.filter(p => p.predicted_savings_pct != null) ?? []
    if (!conDatos.length) {
      return impactoDecisiones?.total_lecturas
        ? impactoDecisiones.ahorro_predicho_pct
        : impactoReal?.ahorro_promedio_pct ?? null
    }
    return (conDatos.reduce((acc, p) => acc + p.predicted_savings_pct, 0) / conDatos.length).toFixed(1)
  }, [todasPredicciones, impactoDecisiones, impactoReal])

  const conteoConPrediccion = useMemo(
    () => todasPredicciones?.filter(p => p.recommended_setpoint != null).length ?? 0,
    [todasPredicciones]
  )

  const conteoAplicadas = useMemo(
    () => todasPredicciones?.filter(p => p.was_applied).length ?? 0,
    [todasPredicciones]
  )

  const promedioTemperatura = useMemo(() => {
    const validos = caracteristicas?.filter(c => c.avg_temp != null) ?? []
    if (!validos.length) return null
    return (validos.reduce((a, c) => a + c.avg_temp, 0) / validos.length).toFixed(1)
  }, [caracteristicas])

  const promedioPresencia = useMemo(() => {
    const validos = caracteristicas?.filter(c => c.presence_ratio != null) ?? []
    if (!validos.length) return null
    return (validos.reduce((a, c) => a + c.presence_ratio, 0) / validos.length * 100).toFixed(0)
  }, [caracteristicas])

  const promedioPotencia = useMemo(() => {
    const validos = caracteristicas?.filter(c => c.avg_power_w != null) ?? []
    if (!validos.length) return null
    return (validos.reduce((a, c) => a + c.avg_power_w, 0) / validos.length).toFixed(0)
  }, [caracteristicas])

  // ── Handlers ───────────────────────────────────────────────────────

  async function manejarAplicar(idPrediccion) {
    setIdAplicando(idPrediccion)
    try {
      await aplicarPrediccion(idPrediccion)
      recargarPredicciones()
    } catch (err) {
      console.error("Error al aplicar predicción:", err)
    } finally {
      setIdAplicando(null)
    }
  }

  async function manejarEvaluar() {
    setEvaluando(true)
    try {
      await dispararEvaluacion()
      recargarPredicciones()
    } catch (err) {
      console.error("Error al evaluar:", err)
    } finally {
      setEvaluando(false)
    }
  }

  function actualizarLecturaAtmos(campo, valor) {
    setLecturaAtmos(prev => ({
      ...prev,
      [campo]: ["presencia", "minutos_sin_presencia"].includes(campo)
        ? Number.parseInt(valor, 10)
        : Number.parseFloat(valor),
    }))
  }

  async function manejarDecisionAtmos(evento) {
    evento.preventDefault()
    setEvaluandoAtmos(true)
    setErrorAtmos("")
    try {
      const resultado = await decidirAtmos(lecturaAtmos)
      setResultadoAtmos(resultado)
    } catch (err) {
      setResultadoAtmos(null)
      setErrorAtmos(err.response?.data?.detail?.mensaje ?? "No se pudo evaluar la lectura ATMOS.")
    } finally {
      setEvaluandoAtmos(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <PageWrapper>

      {/* ── Fila 1: Encabezado ──────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark">Predicciones ML</h2>
          <p className="text-sm text-muted mt-0.5">
            Recomendaciones del modelo Random Forest
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Píldora de modelo */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
          >
            <MdAutoGraph size={14} /> Random Forest v1.0
          </span>

          {/* Botón evaluar */}
          <button
            onClick={manejarEvaluar}
            disabled={evaluando}
            title="Compara predicciones anteriores con datos reales"
            className="btn-secondary flex items-center gap-1.5 disabled:opacity-50"
          >
            {evaluando
              ? <span className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
              : <MdAssessment size={16} />
            }
            Evaluar precisión
          </button>
        </div>
      </div>

      {/* ── Fila 2: KPI globales ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard
          titulo="Ahorro promedio proyectado"
          valor={promedioAhorro ?? "—"}
          unidad={promedioAhorro != null ? "%" : undefined}
          icono={<MdSavings size={20} />}
          color="success"
          cargando={cargandoPredicciones || cargandoImpacto}
        />
        <KPICard
          titulo="Salones con predicción"
          valor={conteoConPrediccion}
          unidad={`/ ${todasPredicciones?.length ?? 0}`}
          icono={<MdBolt size={20} />}
          color="secondary"
          cargando={cargandoPredicciones}
        />
        <KPICard
          titulo="Predicciones aplicadas"
          valor={conteoAplicadas}
          icono={<MdCheckCircle size={20} />}
          color="primary"
          cargando={cargandoPredicciones}
        />
      </div>

      {/* ── Fila 3: Cuadrícula de tarjetas ──────────────────────────── */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="text-lg font-semibold text-dark">Decision ATMOS en vivo</h3>
            <p className="text-xs text-muted mt-0.5">
              Prueba directa del modelo con una lectura manual de sensores.
            </p>
          </div>
          {resultadoAtmos?.modelo?.decision_ml && (
            <span className="badge-muted">
              ML: {resultadoAtmos.modelo.decision_ml}
            </span>
          )}
        </div>

        <form onSubmit={manejarDecisionAtmos} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Presencia
            <select
              value={lecturaAtmos.presencia}
              onChange={e => actualizarLecturaAtmos("presencia", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-dark bg-white"
            >
              <option value={1}>Detectada</option>
              <option value={0}>Sin presencia</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted">
            Temp. ambiente
            <input
              type="number"
              min="10"
              max="45"
              step="0.1"
              value={lecturaAtmos.temp_ambiente}
              onChange={e => actualizarLecturaAtmos("temp_ambiente", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-dark"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted">
            Temp. AC
            <input
              type="number"
              min="5"
              max="35"
              step="0.1"
              value={lecturaAtmos.temp_ac}
              onChange={e => actualizarLecturaAtmos("temp_ac", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-dark"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted">
            Humedad
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={lecturaAtmos.humedad}
              onChange={e => actualizarLecturaAtmos("humedad", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-dark"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-muted">
            Min. sin presencia
            <input
              type="number"
              min="0"
              step="1"
              value={lecturaAtmos.minutos_sin_presencia}
              onChange={e => actualizarLecturaAtmos("minutos_sin_presencia", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-dark"
            />
          </label>

          <button
            type="submit"
            disabled={evaluandoAtmos}
            className="btn-primary self-end justify-center disabled:opacity-50"
          >
            {evaluandoAtmos ? "Evaluando..." : "Evaluar ATMOS"}
          </button>
        </form>

        {errorAtmos && (
          <p className="text-sm text-danger mt-3">{errorAtmos}</p>
        )}

        {resultadoAtmos && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-muted">Decision final</p>
              <p className="text-lg font-bold text-primary">
                {resultadoAtmos.control?.decision_final}
              </p>
              <p className="text-xs text-muted mt-1">
                Delta T: {resultadoAtmos.lectura?.delta_t} C
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-muted mb-2">Probabilidades</p>
              {Object.entries(resultadoAtmos.modelo?.probabilidades ?? {}).map(([clase, prob]) => (
                <div key={clase} className="flex justify-between text-xs text-dark">
                  <span>{clase}</span>
                  <span className="font-semibold">{prob}%</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-muted">Accion AC</p>
              <p className="text-sm font-semibold text-dark mt-1">
                {resultadoAtmos.control?.accion_ac?.accion}
              </p>
              <p className="text-xs text-muted mt-1">
                Modo: {resultadoAtmos.control?.accion_ac?.modo} | Ventilacion: {resultadoAtmos.control?.accion_ac?.ventilacion}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="text-lg font-semibold text-dark">Recomendación por salón</h3>
        <span className="text-xs text-muted">Actualizado cada 60 segundos</span>
      </div>

      {cargandoPredicciones ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {todasPredicciones?.map((prediccion, i) => (
            <PredictionCard
              key={prediccion.room_id ?? i}
              prediccion={prediccion}
              alAplicar={manejarAplicar}
              aplicando={idAplicando === prediccion.id}
            />
          ))}
        </div>
      )}

      {/* ── Fila 4: Análisis detallado + Info del modelo ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Columna izquierda — 60% */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="font-semibold text-dark text-sm">Análisis detallado</p>
            <select
              value={idSalonSeleccionado}
              onChange={e => setIdSalonSeleccionado(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-dark
                         focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              <option value="">Seleccionar salón</option>
              {salones?.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted mb-3">Últimos 7 días de datos del modelo</p>

          <FeaturesChart datos={caracteristicas ?? []} cargando={cargandoCaracteristicas} />

          <hr className="border-gray-100 my-4" />

          {/* Píldoras de estadísticas */}
          <div className="flex flex-wrap gap-2">
            {[
              { etiqueta: `Temp promedio: ${promedioTemperatura ?? "—"}°C` },
              { etiqueta: `Presencia: ${promedioPresencia ?? "—"}%` },
              { etiqueta: `Consumo promedio: ${promedioPotencia ?? "—"}W` },
              { etiqueta: `Horas con datos: ${caracteristicas?.length ?? 0}` },
            ].map(pildora => (
              <span
                key={pildora.etiqueta}
                className="text-xs bg-gray-50 text-muted px-3 py-1 rounded-full"
              >
                {pildora.etiqueta}
              </span>
            ))}
          </div>
        </div>

        {/* Columna derecha — 40% */}
        <div className="lg:col-span-2 card flex flex-col gap-4">
          <p className="font-semibold text-dark text-sm">Sobre el modelo</p>

          {/* Filas de información */}
          <div className="flex flex-col gap-2">
            {[
              { etiqueta: "Tipo",        valor: "Random Forest Regressor" },
              { etiqueta: "Features",    valor: "8 variables de entrada" },
              { etiqueta: "Entrenado",   valor: "Con datos históricos de 30 días" },
              { etiqueta: "Actualiza",   valor: "Cada 24 horas" },
              { etiqueta: "Versión",     valor: versionModelo },
            ].map(fila => (
              <div key={fila.etiqueta} className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted">{fila.etiqueta}</p>
                <p className="text-xs font-medium text-dark text-right">{fila.valor}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Importancia de variables */}
          <div>
            <p className="text-sm font-medium text-dark mb-0.5">
              Variables más importantes
            </p>
            <p className="text-xs text-muted mb-3">
              Impacto en la predicción de ahorro
            </p>
            <div className="flex flex-col gap-2.5">
              {IMPORTANCIA_VARIABLES.map(variable => (
                <BarraImportancia
                  key={variable.etiqueta}
                  etiqueta={variable.etiqueta}
                  porcentaje={variable.porcentaje}
                />
              ))}
            </div>
            <p className="text-xs text-muted italic mt-3">
              Los porcentajes son estimados basados en el comportamiento típico del modelo.
            </p>
          </div>
        </div>
      </div>

    </PageWrapper>
  )
}
