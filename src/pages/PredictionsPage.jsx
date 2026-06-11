import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  MdAssessment,
  MdAutoGraph,
  MdBolt,
  MdCheckCircle,
  MdSavings,
} from "react-icons/md"

import PageWrapper from "../components/layout/PageWrapper"
import KPICard from "../components/common/KPICard"
import PredictionCard from "../components/common/PredictionCard"
import FeaturesChart from "../components/charts/FeaturesChart"

import {
  aplicarPrediccion,
  dispararEvaluacion,
  obtenerCaracteristicasML,
  obtenerImpactoDecisiones,
  obtenerImpactoReal,
  obtenerSalonesPrediciones,
  obtenerTodasUltimasPredicciones,
} from "../api/predictions"

const SENALES_OPERATIVAS = [
  { etiqueta: "Presencia registrada", porcentaje: 42 },
  { etiqueta: "Horario de lectura", porcentaje: 28 },
  { etiqueta: "Temperatura ambiente", porcentaje: 15 },
  { etiqueta: "Humedad", porcentaje: 9 },
  { etiqueta: "Potencia estimada", porcentaje: 6 },
]

const INFO_MOTOR_ATMOS = [
  { etiqueta: "Tipo",      valor: "RandomForestClassifier" },
  { etiqueta: "Estado",    valor: "Disponible" },
  { etiqueta: "Actualiza", valor: "Por lectura" },
  { etiqueta: "Versión",   valor: "modelo_atmos_rf_v1" },
]

function BarraSenal({ etiqueta, porcentaje }) {
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
  const [idAplicando, setIdAplicando] = useState(null)
  const [evaluando, setEvaluando] = useState(false)

  const { data: salones } = useQuery({
    queryKey: ["rooms"],
    queryFn: obtenerSalonesPrediciones,
    onSuccess: datos => {
      if (!idSalonSeleccionado && datos?.length) {
        setIdSalonSeleccionado(String(datos[0].id))
      }
    },
  })

  const {
    data: todasPredicciones,
    isLoading: cargandoPredicciones,
    refetch: recargarPredicciones,
  } = useQuery({
    queryKey: ["all-predictions"],
    queryFn: obtenerTodasUltimasPredicciones,
    refetchInterval: 60000,
  })

  const { data: impactoDecisiones, isLoading: cargandoImpacto } = useQuery({
    queryKey: ["ml-impacto-decisiones"],
    queryFn: obtenerImpactoDecisiones,
    refetchInterval: 60000,
  })

  const { data: impactoReal } = useQuery({
    queryKey: ["ml-impacto-real"],
    queryFn: obtenerImpactoReal,
    refetchInterval: 300000,
  })

  const { data: caracteristicas, isLoading: cargandoCaracteristicas } = useQuery({
    queryKey: ["ml-features", idSalonSeleccionado],
    queryFn: () => obtenerCaracteristicasML(idSalonSeleccionado, 7),
    enabled: !!idSalonSeleccionado,
  })

  const promedioAhorro = useMemo(() => {
    const conPrediccion = todasPredicciones?.filter(p => p.predicted_savings_pct != null) ?? []
    if (conPrediccion.length) {
      return (
        conPrediccion.reduce((acc, p) => acc + p.predicted_savings_pct, 0) /
        conPrediccion.length
      ).toFixed(1)
    }
    if (impactoDecisiones?.total_lecturas) return impactoDecisiones.ahorro_predicho_pct
    return impactoReal?.ahorro_promedio_pct ?? null
  }, [todasPredicciones, impactoDecisiones, impactoReal])

  const conteoPrediccionesGuardadas = useMemo(
    () => todasPredicciones?.filter(p => p.disponible === true || p.fuente === "ml_predictions").length ?? 0,
    [todasPredicciones]
  )

  const conteoRecomendacionesOperativas = useMemo(
    () => todasPredicciones?.filter(p => p.fallback_disponible).length ?? 0,
    [todasPredicciones]
  )

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

  async function manejarEvaluar() {
    setEvaluando(true)
    try {
      await dispararEvaluacion()
      recargarPredicciones()
    } finally {
      setEvaluando(false)
    }
  }

  return (
    <PageWrapper>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark">Predicciones ATMOS</h2>
          <p className="text-xs text-muted mt-0.5">
            Recomendaciones y predicciones en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
          >
            <MdAutoGraph size={14} /> Motor ATMOS v1
          </span>

          <button
            onClick={manejarEvaluar}
            disabled={evaluando}
            title="Compara predicciones guardadas con datos reales cuando existan"
            className="btn-secondary flex items-center gap-1.5 disabled:opacity-50"
          >
            {evaluando
              ? <span className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
              : <MdAssessment size={16} />
            }
            Evaluar precision
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <KPICard
          titulo="Ahorro proyectado"
          valor={promedioAhorro ?? "-"}
          unidad={promedioAhorro != null ? "%" : undefined}
          icono={<MdSavings size={20} />}
          color="success"
          cargando={cargandoPredicciones || cargandoImpacto}
        />
        <KPICard
          titulo="Predicciones guardadas"
          valor={conteoPrediccionesGuardadas}
          unidad={`/ ${todasPredicciones?.length ?? 0}`}
          icono={<MdBolt size={20} />}
          color="secondary"
          cargando={cargandoPredicciones}
        />
        <KPICard
          titulo="Recomendaciones operativas"
          valor={conteoRecomendacionesOperativas}
          icono={<MdCheckCircle size={20} />}
          color="primary"
          cargando={cargandoPredicciones}
        />
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="text-lg font-semibold text-dark">Recomendacion por salon</h3>
        <span className="text-xs text-muted">Actualizado cada 60 segundos</span>
      </div>

      {cargandoPredicciones ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, indice) => (
            <div key={indice} className="card h-52 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
            <p className="font-semibold text-dark text-sm">Analisis detallado</p>
            <select
              value={idSalonSeleccionado}
              onChange={evento => setIdSalonSeleccionado(evento.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-dark
                         focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              <option value="">Seleccionar salon</option>
              {salones?.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name ?? salon.nombre}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted mb-3">
            Ultimos 7 dias disponibles desde registros reales.
          </p>

          <FeaturesChart datos={caracteristicas ?? []} cargando={cargandoCaracteristicas} />

          <hr className="border-gray-100 my-4" />

          <div className="flex flex-wrap gap-2">
            {[
              { etiqueta: `Temp promedio: ${promedioTemperatura ?? "-"} C` },
              { etiqueta: `Presencia: ${promedioPresencia ?? "-"}%` },
              { etiqueta: `Potencia promedio: ${promedioPotencia ?? "-"} W` },
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

        <div className="lg:col-span-2 card flex flex-col gap-4">
          <p className="font-semibold text-dark text-sm">Sobre el motor</p>

          <div className="flex flex-col gap-2">
            {INFO_MOTOR_ATMOS.map(fila => (
              <div key={fila.etiqueta} className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted">{fila.etiqueta}</p>
                <p className="text-xs font-medium text-dark text-right">{fila.valor}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          <div>
            <p className="text-sm font-medium text-dark mb-3">Señales usadas</p>
            <div className="flex flex-col gap-2.5">
              {SENALES_OPERATIVAS.map(variable => (
                <BarraSenal
                  key={variable.etiqueta}
                  etiqueta={variable.etiqueta}
                  porcentaje={variable.porcentaje}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
