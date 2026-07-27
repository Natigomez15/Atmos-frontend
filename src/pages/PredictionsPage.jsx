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
  obtenerPrediccionActualFirebase,
  obtenerSalonesPrediciones,
} from "../api/predictions"

function primerValor(...valores) {
  return valores.find(valor => valor !== undefined && valor !== null)
}

function normalizarDecisionActual(datos) {
  if (!datos) return null
  const lectura = datos.lectura_firebase ?? {}
  const variables = datos.entrada_modelo ?? {}
  const resultado = datos.resultado_modelo ?? {}
  const modelo = datos.modelo_ml ?? {}
  const control = resultado.control ?? {}
  const probabilidades = Object.values(modelo.probabilidades ?? {})
    .map(Number)
    .filter(Number.isFinite)

  return {
    prediccion: primerValor(modelo.prediccion_modelo, resultado.prediccion_modelo),
    confianza: probabilidades.length ? Math.max(...probabilidades) : null,
    recomendacion: datos.recomendacion,
    accionSolicitada: datos.accion,
    modificada: Boolean(control.prediccion_modificada),
    motivo: primerValor(control.motivo, resultado.motivo, datos.mensaje),
    ejecucion: {
      estado: "sin_envio",
      mensaje: "La predicción actual no ejecuta comandos automáticamente.",
    },
    advertencias: Array.isArray(datos.advertencias) ? datos.advertencias : [],
    fuentesDesincronizadas: false,
    actualizadoEn: datos.prediccion_timestamp,
    vigencia: datos.lectura_desactualizada ? "desactualizada" : "actualizada",
    lecturaDesactualizada: datos.lectura_desactualizada === true,
    lecturaId: datos.firebase_key_usado,
    lecturaTimestamp: datos.lectura_timestamp,
    prediccionTimestamp: datos.prediccion_timestamp,
    edadLecturaSegundos: datos.edad_lectura_segundos,
    maxEdadLecturaSegundos: datos.max_edad_lectura_segundos,
    variables: {
      presencia: primerValor(variables.presencia, lectura.presencia, lectura.estado_ocupacion),
      temperaturaAmbiente: primerValor(variables.temp_ambiente, lectura.temp_ambiente, lectura.temperatura_ambiente),
      temperaturaSalida: primerValor(variables.temperatura_salida_aire, lectura.temp_ac, lectura.temperatura_salida_aire),
      deltaT: primerValor(variables.delta_t, lectura.delta_t),
      humedad: primerValor(variables.humedad, lectura.humedad),
      potencia: primerValor(lectura.potencia_activa_w, lectura.potencia_w),
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

  const consultaActual = useQuery({
    queryKey: ["ml-current-firebase", pabellon, aireEfectivo],
    queryFn: () => obtenerPrediccionActualFirebase({ pabellon, aire: aireEfectivo }),
    enabled: Boolean(pabellon && aireEfectivo),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
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
    () => normalizarDecisionActual(consultaActual.data),
    [consultaActual.data],
  )

  const historico = Array.isArray(consultaHistorico.data) ? consultaHistorico.data : []
  const historicoPotencia = Array.isArray(consultaPotencia.data) ? consultaPotencia.data : []
  const resumenPeriodo = {
    temperatura: promedio(historico, "avg_temp"),
    presencia: promedio(historico, "presence_ratio", 100),
    potencia: promedio(historicoPotencia, "avg_power_w"),
    horas: (variableGrafica === "potencia" ? historicoPotencia.length : historico.length) || null,
  }
  const cargandoDecisionCompleta = consultaActual.isLoading && !consultaActual.data
  const sinDecision = !cargandoDecisionCompleta && !consultaActual.data
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

        {consultaActual.isError && (
          <ErrorSeccion
            titulo="No se pudo evaluar la lectura actual"
            mensaje="ATMOS no pudo consultar o procesar la última lectura operacional de Firebase."
            alReintentar={consultaActual.refetch}
          />
        )}

        {cargandoDecisionCompleta ? (
          <PredictionCardSkeleton />
        ) : sinDecision ? (
          <ErrorSeccion
            titulo="No se pudo cargar la decisión actual"
            mensaje="No existe una lectura reciente de Firebase que ATMOS pueda presentar como decisión actual."
            alReintentar={consultaActual.refetch}
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
