import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  MdAccessTime,
  MdBolt,
  MdCloudOff,
  MdInsights,
  MdOutlinePayments,
  MdRefresh,
} from "react-icons/md"

import PageWrapper from "../components/layout/PageWrapper"
import PageHeader from "../components/common/PageHeader"
import ConsumptionLineChart from "../components/charts/ConsumptionLineChart"
import UsefulEmptyBarChart from "../components/charts/UsefulEmptyBarChart"
import ConsumptionHeatmap from "../components/charts/ConsumptionHeatmap"
import { modoDemoDashboardActivo, obtenerEnergiaDashboard } from "../api/dashboard"
import { REFRESH_INTERVAL_MS } from "../constants/config"

const RANGOS = [
  { valor: "24h", etiqueta: "24 h" },
  { valor: "7d", etiqueta: "7 días" },
  { valor: "15d", etiqueta: "15 días" },
  { valor: "30d", etiqueta: "30 días" },
  { valor: "3m", etiqueta: "3 meses" },
]

function esNumero(valor) {
  return valor != null && Number.isFinite(Number(valor))
}

function numero(valor, decimales = 1) {
  return esNumero(valor) ? Number(valor).toFixed(decimales) : "Sin datos"
}

function duracion(horas) {
  if (!esNumero(horas)) return "Sin datos"
  const minutos = Math.max(0, Math.round(Number(horas) * 60))
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (!h) return `${m} min`
  return `${h} h${m ? ` ${m} min` : ""}`
}

function actualizado(valor, ahora) {
  if (!valor) return "Actualización no disponible"
  const segundos = Math.max(0, Math.floor((ahora - new Date(valor).getTime()) / 1000))
  if (segundos < 60) return "Actualizado hace menos de 1 min"
  if (segundos < 3600) return `Actualizado hace ${Math.floor(segundos / 60)} min`
  return `Actualizado hace ${Math.floor(segundos / 3600)} h`
}

function contextoComparacion(metricas) {
  if (!metricas.comparison_available || !esNumero(metricas.comparison_delta_kwh)) {
    return "Historial insuficiente para comparar."
  }
  const delta = Number(metricas.comparison_delta_kwh)
  const base = Math.abs(delta) < 0.05
    ? "Similar al promedio reciente"
    : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} kWh respecto al promedio reciente`
  return `${base} · Comparado con ${metricas.comparison_days} días válidos`
}

function Kpi({
  label,
  ariaLabel,
  valor,
  unidad,
  contexto,
  icono,
  disponible = true,
  tono = "text-dark",
}) {
  return (
    <article
      className="min-w-0 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm"
      aria-label={ariaLabel ?? label}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="meta-label min-w-0">{label}</p>
        <span className="shrink-0 text-secondary" aria-hidden="true">{icono}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={disponible
          ? `text-3xl font-semibold leading-none tabular-nums ${tono}`
          : "card-label text-muted"
        }>
          {disponible ? valor : "—"}
        </span>
        {disponible && unidad && <span className="body-muted">{unidad}</span>}
      </div>
      <p className="caption mt-1.5 min-h-7 leading-3.5">
        {disponible ? contexto : "Sin datos disponibles"}
      </p>
    </article>
  )
}

function Insights({ metricas }) {
  const elementos = []

  if (esNumero(metricas.empty_energy_pct) && Number(metricas.empty_energy_pct) > 0) {
    elementos.push(
      `${numero(metricas.empty_energy_pct, 0)}% del consumo de hoy ocurrió sin ocupación.`
    )
  }
  if (metricas.peak_relevant && esNumero(metricas.peak_power_w) && metricas.peak_power_at) {
    elementos.push(
      `El mayor pico del período ocurrió a las ${new Date(metricas.peak_power_at).toLocaleTimeString("es-PA", {
        hour: "numeric",
        minute: "2-digit",
      })}, con ${numero(metricas.peak_power_w, 0)} W.`
    )
  }
  if (metricas.comparison_available && esNumero(metricas.today_vs_week_avg_pct)) {
    const porcentaje = Number(metricas.today_vs_week_avg_pct)
    elementos.push(
      `El consumo de hoy está ${Math.abs(porcentaje).toFixed(0)}% ${
        porcentaje > 0 ? "por encima" : "por debajo"
      } del promedio reciente al mismo horario.`
    )
  }
  return (
    <section className="card" aria-labelledby="insights-atmos">
      <div className="flex items-center gap-2">
        <MdInsights size={19} className="text-secondary" />
        <h2 id="insights-atmos" className="section-title">Insights de ATMOS</h2>
      </div>
      {elementos.length ? (
        <ul className="mt-4 divide-y divide-gray-100">
          {elementos.slice(0, 4).map(texto => (
            <li key={texto} className="flex gap-2.5 py-3 text-sm leading-5 text-dark first:pt-0 last:pb-0">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
              {texto}
            </li>
          ))}
        </ul>
      ) : (
        <p className="body-muted mt-4">
          Aún no hay suficiente información para generar insights confiables.
        </p>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const [rango, setRango] = useState("24h")
  const [ahora] = useState(() => Date.now())
  const demoActivo = modoDemoDashboardActivo()
  const {
    data: energia,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-energy", rango, demoActivo ? "demo" : "real"],
    queryFn: () => obtenerEnergiaDashboard(rango),
    refetchInterval: REFRESH_INTERVAL_MS,
  })

  const metricas = energia?.metrics ?? {}
  const grafica = energia?.chart ?? {}
  const phase2 = energia?.phase2 ?? {}
  const sinDatosHoy = Number(metricas.today_records ?? 0) === 0
  const datosNoRecientes = !sinDatosHoy && metricas.data_recent === false
  const contextoActualidad = datosNoRecientes ? "Datos no recientes" : null
  const costoVacio = esNumero(metricas.empty_cost_usd)
    ? `Costo asociado: $${numero(metricas.empty_cost_usd, 2)}`
    : "Costo asociado no disponible"
  const porcentajeVacio = esNumero(metricas.empty_energy_pct)
    ? `${numero(metricas.empty_energy_pct, 0)}% del consumo de hoy · ${costoVacio}`
    : "Sin datos suficientes de ocupación."
  const agrupacionGrafica = grafica.grouping
    ?? (grafica.mode === "energy" ? "day" : null)
  const etiquetaAgrupacion = {
    hour: "Por hora",
    day: "Por día",
    week: "Por semana",
  }[agrupacionGrafica]
  const valoresGrafica = (grafica.points ?? [])
    .map(punto => punto?.[grafica.value_key ?? "energia_kwh"])
    .filter(esNumero)
    .map(Number)
  const promedioGrafica = valoresGrafica.length
    ? valoresGrafica.reduce((total, valor) => total + valor, 0) / valoresGrafica.length
    : null
  const picoGrafica = valoresGrafica.length ? Math.max(...valoresGrafica) : null

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-[1480px]">
        <PageHeader
          title="Dashboard energético"
          description="Resumen energético del Aire 1"
          actions={
            <>
              <span className={`inline-flex min-h-7 items-center gap-1.5 ${
                isError || !energia?.generated_at
                  ? "badge-danger"
                  : "badge-success"
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {isError || !energia?.generated_at
                  ? "Sin conexión"
                  : actualizado(energia.generated_at, ahora)}
              </span>
              <button onClick={refetch} className="btn-secondary min-h-11 text-sm">
                <MdRefresh size={17} aria-hidden="true" /> Actualizar
              </button>
            </>
          }
        />

        {demoActivo && (
          <p className="badge-warning mt-3 w-fit">
            Datos de demostración
          </p>
        )}

        {isError && !demoActivo && (
          <div className="mt-4 rounded-xl border border-danger/20 bg-danger/5 p-3" role="alert">
            <div className="flex items-start gap-2.5">
              <MdCloudOff size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              <div className="min-w-0">
                <p className="card-label">No se pudieron cargar los datos energéticos</p>
                <p className="caption mt-0.5 break-words">
                  {error?.response?.data?.detail ?? error?.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Consumo hoy"
            valor={numero(metricas.today_energy_kwh, 1)}
            unidad="kWh"
            disponible={!sinDatosHoy && esNumero(metricas.today_energy_kwh)}
            contexto={contextoActualidad ?? contextoComparacion(metricas)}
            icono={<MdBolt size={18} />}
          />
          <Kpi
            label="Costo hoy"
            valor={numero(metricas.today_cost_usd, 2)}
            unidad="USD"
            disponible={!sinDatosHoy && esNumero(metricas.today_cost_usd)}
            contexto={
              contextoActualidad ?? (esNumero(energia?.tariff_usd_per_kwh)
                ? `Tarifa: $${numero(energia.tariff_usd_per_kwh, 2)} por kWh`
                : "Tarifa no disponible")
            }
            icono={<MdOutlinePayments size={18} />}
          />
          <Kpi
            label="Tiempo encendido"
            ariaLabel="Tiempo encendido hoy"
            valor={duracion(metricas.ac_hours_today)}
            disponible={!sinDatosHoy && esNumero(metricas.ac_hours_today)}
            contexto={contextoActualidad ?? "Tiempo acumulado de funcionamiento hoy"}
            icono={<MdAccessTime size={18} />}
          />
          <Kpi
            label="Sin ocupación"
            ariaLabel="Consumo sin ocupación hoy"
            valor={numero(metricas.empty_energy_kwh, 1)}
            unidad="kWh"
            disponible={!sinDatosHoy && esNumero(metricas.empty_energy_kwh)}
            contexto={contextoActualidad ?? porcentajeVacio}
            icono={<MdAccessTime size={18} />}
            tono={Number(metricas.empty_energy_kwh ?? 0) > 0 ? "text-warning" : "text-dark"}
          />
        </div>

        <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.7fr)]">
          <section className="card min-w-0">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="section-title">
                  {grafica.mode === "energy" ? "Consumo eléctrico" : "Potencia y ocupación"}
                </h2>
                <p className="caption mt-1">
                  {etiquetaAgrupacion
                    ? `${etiquetaAgrupacion} · ${energia?.range_label ?? rango}`
                    : "Últimas 24 horas"
                  } · Azul: {grafica.mode === "energy" ? "energía" : "potencia"} · Turquesa claro: ocupación
                </p>
                {grafica.mode === "energy" && (
                  <p className="caption mt-1">
                    Promedio: <strong className="text-dark">
                      {promedioGrafica != null ? `${promedioGrafica.toFixed(2)} kWh` : "Sin datos"}
                    </strong>
                    {" · "}
                    Pico: <strong className="text-dark">
                      {picoGrafica != null ? `${picoGrafica.toFixed(2)} kWh` : "Sin datos"}
                    </strong>
                  </p>
                )}
              </div>
              <div className="flex max-w-full gap-1 overflow-x-auto pb-1">
                {RANGOS.map(opcion => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setRango(opcion.valor)}
                    className={`min-h-9 shrink-0 rounded-lg px-2.5 text-xs font-semibold ${
                      rango === opcion.valor ? "bg-primary text-white" : "bg-gray-100 text-muted"
                    }`}
                  >
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
            </div>
            <ConsumptionLineChart
              datos={grafica.points ?? []}
              cargando={isLoading && !demoActivo}
              unidad={grafica.unit === "kWh/dia" ? "kWh" : grafica.unit ?? "W"}
              valueKey={grafica.value_key ?? "potencia_w"}
              mensajeVacio={grafica.empty_message}
            />
          </section>
          <Insights metricas={metricas} />
        </div>

        <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
          <UsefulEmptyBarChart
            datos={phase2.useful_vs_empty ?? []}
            insufficientData={phase2.useful_vs_empty_insufficient_data}
          />
          <ConsumptionHeatmap heatmap={phase2.heatmap ?? {}} />
        </div>
      </div>
    </PageWrapper>
  )
}
