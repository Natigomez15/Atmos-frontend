import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MdCloudOff, MdRefresh, MdShowChart } from "react-icons/md"

import PageWrapper from "../components/layout/PageWrapper"
import PredictionCard, { PredictionCardSkeleton } from "../components/common/PredictionCard"
import DecisionVariables from "../components/common/DecisionVariables"
import FeaturesChart from "../components/charts/FeaturesChart"
import ModelDetails from "../components/common/ModelDetails"
import { equiposDisponiblesSalon } from "../api/salonesAtmos"
import {
  obtenerCaracteristicasML,
  obtenerInfoModelo,
  obtenerPotenciaActivaFirebase,
  obtenerSalonesPrediciones,
  obtenerUltimaDecision,
  obtenerUltimaPrediccion,
} from "../api/predictions"

const MINUTOS_VIGENCIA = 5

function fechaValida(valor) {
  if (!valor) return null
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function obtenerVigencia(fecha, errorDecision) {
  if (errorDecision) return "sin_conexion"
  const fechaActualizacion = fechaValida(fecha)
  if (!fechaActualizacion) return "sin_conexion"
  return Date.now() - fechaActualizacion.getTime() <= MINUTOS_VIGENCIA * 60 * 1000
    ? "actualizada"
    : "desactualizada"
}

function primerValor(...valores) {
  return valores.find(valor => valor !== undefined && valor !== null)
}

function normalizarDecision(prediccion, decision, errorDecision) {
  const instantanea = prediccion?.instantanea_caracteristicas ?? prediccion?.snapshot_features ?? {}
  const variables = instantanea.features_usadas ?? prediccion?.modelo_ml?.features_usadas ?? {}
  const prediccionDecision = decision?.prediccion ?? {}
  const decisionFinal = decision?.decision ?? {}
  const ejecucion = decision?.ejecucion ?? { estado: "sin_registro" }
  const fechaDecision = decision?.actualizado_en
  const fechaPrediccion = primerValor(prediccion?.predicho_en, prediccion?.predicted_at)
  const hayDecisionActual = Boolean(decision?.decision)
  const actualizadoEn = hayDecisionActual ? fechaDecision : fechaPrediccion
  const instanteDecision = fechaValida(fechaDecision)?.getTime()
  const instantePrediccion = fechaValida(fechaPrediccion)?.getTime()
  const motivoPrediccion = primerValor(
    prediccion?.motivo_reglas_seguridad,
    instantanea.motivo_reglas_seguridad,
    prediccion?.modelo_ml?.motivo_reglas_seguridad,
  )
  const fuentesDesincronizadas = Boolean(
    instanteDecision && instantePrediccion && Math.abs(instanteDecision - instantePrediccion) > 5 * 60 * 1000,
  )

  return {
    prediccion: hayDecisionActual
      ? prediccionDecision.valor
      : primerValor(prediccion?.prediccion_original, instantanea.prediccion_modelo, prediccion?.modelo_ml?.prediccion_modelo),
    confianza: hayDecisionActual
      ? prediccionDecision.confianza
      : primerValor(prediccion?.confianza_prediccion, prediccion?.puntaje_confianza, prediccion?.confidence_score),
    recomendacion: hayDecisionActual
      ? decisionFinal.recomendacion_final
      : primerValor(prediccion?.recomendacion_final, instantanea.accion_final),
    accionSolicitada: hayDecisionActual
      ? decisionFinal.accion_solicitada
      : prediccion?.accion_solicitada,
    modificada: Boolean(hayDecisionActual
      ? decisionFinal.modificada_por_reglas
      : prediccion?.recomendacion_modificada),
    // No mezclar el motivo de una predicción histórica con una decisión más reciente.
    motivo: hayDecisionActual
      ? decisionFinal.motivo
      : motivoPrediccion,
    motivoReferencia: hayDecisionActual && !decisionFinal.motivo ? motivoPrediccion : null,
    motivoReferenciaEn: hayDecisionActual && !decisionFinal.motivo ? fechaPrediccion : null,
    ejecucion,
    advertencias: Array.isArray(decision?.advertencias) ? decision.advertencias : [],
    fuentesDesincronizadas,
    actualizadoEn,
    vigencia: obtenerVigencia(actualizadoEn, errorDecision),
    variables: {
      presencia: primerValor(variables.presencia, variables.presence),
      temperaturaAmbiente: primerValor(variables.temp_ambiente, variables.temperatura_ambiente, variables.temperature),
      temperaturaSalida: primerValor(variables.temperatura_salida_aire, variables.temp_ac, variables.outlet_temperature),
      deltaT: primerValor(variables.delta_t, variables.diferencia_temperatura),
      humedad: primerValor(variables.humedad, variables.humidity),
      potencia: primerValor(variables.potencia_activa_w, variables.potencia_w, variables.power_w),
    },
  }
}

function promedio(datos, campo, multiplicador = 1) {
  const valores = datos
    .map(dato => dato?.[campo])
    .filter(valor => valor != null && Number.isFinite(Number(valor)))
    .map(Number)
  if (!valores.length) return null
  return valores.reduce((total, valor) => total + valor, 0) / valores.length * multiplicador
}

function MetricaPeriodo({ etiqueta, valor, unidad, cargando }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-xs leading-snug text-muted">{etiqueta}</p>
      {cargando ? (
        <div className="mt-2 h-5 w-16 rounded bg-gray-200 motion-safe:animate-pulse" />
      ) : (
        <p className="mt-1 text-sm font-semibold text-dark tabular-nums break-words">
          {valor == null ? "No disponible" : `${valor}${unidad ? ` ${unidad}` : ""}`}
        </p>
      )}
    </div>
  )
}

function ErrorSeccion({ titulo, mensaje, alReintentar }) {
  return (
    <div className="rounded-xl border border-danger/20 bg-danger/5 p-4" role="alert">
      <div className="flex items-start gap-3">
        <MdCloudOff size={19} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-dark">{titulo}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{mensaje}</p>
          <button type="button" onClick={alReintentar} className="btn-secondary mt-3 inline-flex items-center gap-1.5 text-xs">
            <MdRefresh size={15} aria-hidden="true" /> Reintentar
          </button>
        </div>
      </div>
    </div>
  )
}

function ModeloSkeleton() {
  return <div className="card h-24 rounded-2xl bg-gray-100 motion-safe:animate-pulse" aria-label="Cargando información del modelo" />
}

export default function PredictionsPage() {
  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState("")
  const [aireSeleccionado, setAireSeleccionado] = useState("")
  const [periodo, setPeriodo] = useState(7)
  const [variableGrafica, setVariableGrafica] = useState("temperatura")

  const consultaSalones = useQuery({
    queryKey: ["predictions-rooms"],
    queryFn: obtenerSalonesPrediciones,
  })

  const salones = consultaSalones.data ?? []
  const idSalonEfectivo = idSalonSeleccionado || (salones[0]?.id ? String(salones[0].id) : "")
  const salonSeleccionado = salones.find(salon => String(salon.id) === idSalonEfectivo) ?? null
  const equipos = useMemo(() => equiposDisponiblesSalon(salonSeleccionado), [salonSeleccionado])
  const aireEfectivo = equipos.includes(aireSeleccionado) ? aireSeleccionado : (equipos[0] ?? "")
  const pabellon = salonSeleccionado?.pabellon ?? salonSeleccionado?.pavilion ?? salonSeleccionado?.edificio ?? ""

  const consultaPrediccion = useQuery({
    queryKey: ["ml-latest-prediction", idSalonEfectivo],
    queryFn: () => obtenerUltimaPrediccion(idSalonEfectivo),
    enabled: Boolean(idSalonEfectivo),
    refetchInterval: 60000,
  })

  const consultaDecision = useQuery({
    queryKey: ["ml-latest-decision", pabellon, aireEfectivo],
    queryFn: () => obtenerUltimaDecision({ pabellon, aire: aireEfectivo }),
    enabled: Boolean(pabellon && aireEfectivo),
    refetchInterval: 60000,
  })

  const consultaHistorico = useQuery({
    queryKey: ["ml-features", idSalonEfectivo, periodo],
    queryFn: () => obtenerCaracteristicasML(idSalonEfectivo, periodo),
    enabled: Boolean(idSalonEfectivo),
  })

  const consultaPotencia = useQuery({
    queryKey: ["firebase-active-power", pabellon, aireEfectivo, periodo],
    queryFn: () => obtenerPotenciaActivaFirebase({
      pabellon,
      aire: aireEfectivo,
      dias: periodo,
    }),
    // La potencia se lee desde Firebase; no iniciar esa descarga si el usuario
    // está viendo otra métrica y no renovar una serie histórica cada minuto.
    enabled: variableGrafica === "potencia" && Boolean(pabellon && aireEfectivo),
    refetchInterval: 5 * 60 * 1000,
  })

  const consultaModelo = useQuery({
    queryKey: ["ml-model-info"],
    queryFn: obtenerInfoModelo,
    staleTime: 5 * 60 * 1000,
  })

  const datosDecision = useMemo(
    () => normalizarDecision(consultaPrediccion.data, consultaDecision.data, consultaDecision.isError),
    [consultaPrediccion.data, consultaDecision.data, consultaDecision.isError],
  )

  const historico = Array.isArray(consultaHistorico.data) ? consultaHistorico.data : []
  const historicoPotencia = Array.isArray(consultaPotencia.data) ? consultaPotencia.data : []
  const resumenPeriodo = {
    temperatura: promedio(historico, "avg_temp"),
    presencia: promedio(historico, "presence_ratio", 100),
    potencia: promedio(historicoPotencia, "avg_power_w"),
    horas: (variableGrafica === "potencia" ? historicoPotencia.length : historico.length) || null,
  }
  const cargandoDecisionCompleta =
    (consultaPrediccion.isLoading || consultaDecision.isLoading) &&
    !consultaPrediccion.data && !consultaDecision.data
  const sinDecision = !cargandoDecisionCompleta && !consultaPrediccion.data && !consultaDecision.data
  const historicoCombinado = equipos.length > 1

  return (
    <PageWrapper>
      <div className="w-full max-w-full min-w-0 space-y-6 overflow-x-hidden">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl min-w-0">
            <p className="meta-label mb-1">Motor de inteligencia</p>
            <h1 className="page-title">
              Predicciones ATMOS
            </h1>
            <p className="body-muted mt-1">
              Comprende qué predijo el modelo, qué decidió ATMOS y qué acción se envió.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[520px]">
            <label className="min-w-0">
              <span className="label-base">Espacio</span>
              <select
                aria-label="Seleccionar espacio"
                value={idSalonEfectivo}
                onChange={evento => {
                  setIdSalonSeleccionado(evento.target.value)
                  setAireSeleccionado("")
                }}
                className="input-base min-w-0"
                disabled={consultaSalones.isLoading || !salones.length}
              >
                {!salones.length && <option value="">Sin espacios disponibles</option>}
                {salones.map(salon => (
                  <option key={salon.id} value={salon.id}>{salon.name ?? salon.nombre}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <span className="label-base">Equipo</span>
              <select
                aria-label="Seleccionar equipo de aire acondicionado"
                value={aireEfectivo}
                onChange={evento => setAireSeleccionado(evento.target.value)}
                className="input-base min-w-0"
                disabled={!equipos.length}
              >
                {!equipos.length && <option value="">Sin equipos disponibles</option>}
                {equipos.map(aire => <option key={aire} value={aire}>{aire}</option>)}
              </select>
            </label>
          </div>
        </header>

        {consultaSalones.isError && (
          <ErrorSeccion
            titulo="No se pudieron cargar los espacios"
            mensaje="La selección de espacios no está disponible en este momento."
            alReintentar={consultaSalones.refetch}
          />
        )}

        {(consultaPrediccion.isError || consultaDecision.isError) && !sinDecision && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {consultaPrediccion.isError && (
              <ErrorSeccion
                titulo="No se pudo actualizar la predicción"
                mensaje="La decisión disponible se conserva, pero la predicción original no pudo actualizarse."
                alReintentar={consultaPrediccion.refetch}
              />
            )}
            {consultaDecision.isError && (
              <ErrorSeccion
                titulo="No se pudo actualizar la ejecución"
                mensaje="La predicción disponible se conserva, pero no fue posible consultar el estado de la señal infrarroja."
                alReintentar={consultaDecision.refetch}
              />
            )}
          </div>
        )}

        {cargandoDecisionCompleta ? (
          <PredictionCardSkeleton />
        ) : sinDecision ? (
          <ErrorSeccion
            titulo="No se pudo cargar la decisión actual"
            mensaje="No hay una predicción ni un registro de decisión disponibles para este equipo."
            alReintentar={() => {
              consultaPrediccion.refetch()
              consultaDecision.refetch()
            }}
          />
        ) : (
          <PredictionCard datos={datosDecision} />
        )}

        {!cargandoDecisionCompleta && !sinDecision && (
          <section className="card p-4 sm:p-6">
            <DecisionVariables variables={datosDecision.variables} />
          </section>
        )}

        <section className="card p-4 sm:p-6 min-w-0" aria-labelledby="evolucion-reciente-titulo">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MdShowChart size={20} className="text-secondary" aria-hidden="true" />
                <h2 id="evolucion-reciente-titulo" className="section-title">Evolución reciente</h2>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {variableGrafica === "potencia"
                  ? `Potencia activa de ${aireEfectivo || "este equipo"} leída directamente desde Firebase.`
                  : historicoCombinado
                    ? `Histórico combinado de ${salonSeleccionado?.name ?? salonSeleccionado?.nombre ?? "este espacio"}. El endpoint no separa los datos por equipo.`
                    : `Histórico de ${salonSeleccionado?.name ?? salonSeleccionado?.nombre ?? "este espacio"} en hora de Panamá.`}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
              <div className="flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Seleccionar periodo del histórico">
                {[
                  { valor: 1, etiqueta: "Últimas 24 h" },
                  { valor: 7, etiqueta: "Últimos 7 días" },
                ].map(opcion => (
                  <button
                    type="button"
                    key={opcion.valor}
                    onClick={() => setPeriodo(opcion.valor)}
                    aria-pressed={periodo === opcion.valor}
                    className={`min-w-0 flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 ${periodo === opcion.valor ? "bg-white text-primary shadow-sm" : "text-muted hover:text-dark"}`}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
              <select
                aria-label="Seleccionar variable del gráfico"
                value={variableGrafica}
                onChange={evento => setVariableGrafica(evento.target.value)}
                className="input-base py-2"
              >
                <option value="temperatura">Temperatura</option>
                <option value="potencia">Potencia</option>
                <option value="presencia">Presencia</option>
              </select>
            </div>
          </div>

          <div className="mt-5 min-w-0">
            {(variableGrafica === "potencia" ? consultaPotencia.isError : consultaHistorico.isError) ? (
              <ErrorSeccion
                titulo="No se pudo cargar la evolución reciente"
                mensaje={variableGrafica === "potencia"
                  ? "No se pudo leer la potencia activa desde Firebase."
                  : "El histórico falló, pero la decisión actual continúa disponible."}
                alReintentar={variableGrafica === "potencia" ? consultaPotencia.refetch : consultaHistorico.refetch}
              />
            ) : (
              <FeaturesChart
                datos={variableGrafica === "potencia" ? historicoPotencia : historico}
                variable={variableGrafica}
                cargando={variableGrafica === "potencia" ? consultaPotencia.isLoading : consultaHistorico.isLoading}
              />
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <MetricaPeriodo etiqueta="Temperatura promedio" valor={resumenPeriodo.temperatura?.toFixed(1)} unidad="°C" cargando={consultaHistorico.isLoading} />
            <MetricaPeriodo etiqueta="Presencia promedio" valor={resumenPeriodo.presencia?.toFixed(0)} unidad="%" cargando={consultaHistorico.isLoading} />
            <MetricaPeriodo etiqueta="Potencia promedio" valor={resumenPeriodo.potencia?.toFixed(0)} unidad="W" cargando={consultaPotencia.isLoading} />
            <MetricaPeriodo etiqueta="Horas con datos" valor={resumenPeriodo.horas} unidad="h" cargando={consultaHistorico.isLoading} />
          </div>
        </section>

        {consultaModelo.isLoading ? (
          <ModeloSkeleton />
        ) : consultaModelo.isError ? (
          <ErrorSeccion
            titulo="No se pudieron cargar los detalles del modelo"
            mensaje="La información técnica no está disponible; el resto de la página continúa operativo."
            alReintentar={consultaModelo.refetch}
          />
        ) : (
          <ModelDetails info={consultaModelo.data} />
        )}
      </div>
    </PageWrapper>
  )
}
