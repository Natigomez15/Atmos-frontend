import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { MdAccessTime, MdAir, MdBolt, MdSavings } from "react-icons/md"

import PageWrapper                from "../components/layout/PageWrapper"
import PageHeader                 from "../components/common/PageHeader"
import ConsumptionLineChart       from "../components/charts/ConsumptionLineChart"
import UsefulEmptyBarChart        from "../components/charts/UsefulEmptyBarChart"
import ActivityWidget             from "../components/charts/ActivityWidget"
import ConsumptionHeatmap         from "../components/charts/ConsumptionHeatmap"
import { modoDemoDashboardActivo, obtenerEnergiaDashboard } from "../api/dashboard"
import { useAuth }                from "../context/AuthContext"
import { REFRESH_INTERVAL_MS }    from "../constants/config"

const RANGOS = [
  { valor: "24h", etiqueta: "24 h" },
  { valor: "7d", etiqueta: "7 días" },
  { valor: "15d", etiqueta: "15 días" },
  { valor: "30d", etiqueta: "30 días" },
  { valor: "3m", etiqueta: "3 meses" },
]

function etiquetaHoy() {
  return new Date().toLocaleDateString("es-PA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

function tieneDato(valor) {
  return valor != null && !Number.isNaN(Number(valor))
}

function formatearNumero(valor, decimales = 1) {
  return tieneDato(valor) ? Number(valor).toFixed(decimales) : "–"
}

function textoPorcentaje(valor) {
  if (!tieneDato(valor)) return "Sin datos aún"
  const numero = Number(valor)
  const signo = numero > 0 ? "+" : "−"
  return `${signo}${Math.abs(numero).toFixed(1)}% vs 7 días`
}

function clasePorTendencia(valor) {
  if (!tieneDato(valor)) return "text-muted"
  return Number(valor) > 0 ? "text-warning" : "text-success"
}

function TarjetaEnergia({
  titulo,
  valor,
  unidad,
  secundaria,
  icono,
  valorClase = "text-dark",
  secundariaClase = "text-muted",
}) {
  const sinDato = valor === "–"

  return (
    <article className="rounded-xl border border-gray-100 bg-white px-[14px] py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted uppercase tracking-[0.05em] truncate">
          {titulo}
        </p>
        <span className="text-muted [&>svg]:w-4 [&>svg]:h-4 shrink-0">{icono}</span>
      </div>

      <div className="mt-1 flex items-baseline gap-1 h-8">
        <span className={`text-2xl font-semibold tabular-nums leading-none ${sinDato ? "text-muted" : valorClase}`}>
          {valor}
        </span>
        {unidad && <span className="text-[13px] font-normal text-muted">{unidad}</span>}
      </div>

      <p className={`mt-0.5 text-xs leading-4 truncate ${secundariaClase}`}>
        {secundaria}
      </p>
    </article>
  )
}

function DemoBadge() {
  return (
    <div className="fixed top-16 right-4 z-40">
      <span className="badge-warning shadow-sm">Datos de demostración</span>
    </div>
  )
}

export default function DashboardPage() {
  const ubicacion = useLocation()
  const { estaLogueado, perfil } = useAuth()
  const [rango, setRango] = useState("24h")

  const demoActivo = useMemo(() => {
    return modoDemoDashboardActivo()
  }, [ubicacion.search, ubicacion.hash])

  const {
    data: energia,
    isLoading: cargandoEnergia,
    isError: errorEnergia,
    error: detalleErrorEnergia,
    refetch: recargarEnergia,
  } = useQuery({
    queryKey:        ["dashboard-energy", rango, demoActivo ? "demo" : "real"],
    queryFn:         () => obtenerEnergiaDashboard(rango),
    refetchInterval: REFRESH_INTERVAL_MS,
  })

  const metricas = energia?.metrics ?? {}
  const grafica = energia?.chart ?? {}
  const baseline = energia?.baseline ?? {}
  const phase2 = energia?.phase2 ?? {}

  const consumoHoy = formatearNumero(metricas.today_energy_kwh, 1)
  const costoPeriodo = formatearNumero(metricas.period_cost_usd, 2)
  const horasAc = formatearNumero(metricas.ac_hours_today, 1)
  const energiaVacio = formatearNumero(metricas.empty_energy_kwh, 1)
  const porcentajeVacio = (
    tieneDato(metricas.empty_energy_kwh)
    && tieneDato(metricas.today_energy_kwh)
    && Number(metricas.today_energy_kwh) > 0
  )
    ? `${((Number(metricas.empty_energy_kwh) / Number(metricas.today_energy_kwh)) * 100).toFixed(0)}% del consumo`
    : "Sin datos aún"

  const ahorroSecundario = tieneDato(metricas.estimated_savings_usd)
    ? `Ahorro est. ${Number(metricas.estimated_savings_usd).toFixed(2)} USD`
    : "Sin datos aún"
  const horarioSecundario = Number(metricas.ac_outside_schedule_hours_today ?? 0) > 0
    ? `${Number(metricas.ac_outside_schedule_hours_today).toFixed(1)} h fuera de horario`
    : "Dentro de horario"

  return (
    <PageWrapper>
      <div className="mb-5">
        <PageHeader
          eyebrow={etiquetaHoy()}
          title={estaLogueado && perfil?.nombre ? `Hola, ${perfil.nombre}` : "Panel general"}
          description="Decisiones energéticas, ocupación y consumo real de ATMOS"
          actions={
            <div className="flex items-center gap-2">
              <button onClick={recargarEnergia} className="btn-secondary text-sm">
                Actualizar
              </button>
            </div>
          }
        />
      </div>

      {demoActivo && <DemoBadge />}

      {errorEnergia && !demoActivo && (
        <div className="mb-4 rounded-xl bg-danger/5 text-danger px-4 py-3 text-sm font-medium">
          Error al cargar datos energéticos: {detalleErrorEnergia?.response?.data?.detail ?? detalleErrorEnergia?.message ?? "revisa el backend del dashboard."}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <TarjetaEnergia
          titulo="Consumo hoy"
          valor={consumoHoy}
          unidad="kWh"
          icono={<MdBolt />}
          secundaria={textoPorcentaje(metricas.today_vs_week_avg_pct)}
          secundariaClase={clasePorTendencia(metricas.today_vs_week_avg_pct)}
        />

        <TarjetaEnergia
          titulo="Costo estimado"
          valor={costoPeriodo}
          unidad="USD"
          icono={<MdSavings />}
          secundaria={ahorroSecundario}
        />

        <TarjetaEnergia
          titulo="Horas AC hoy"
          valor={horasAc}
          unidad="h"
          icono={<MdAir />}
          secundaria={horarioSecundario}
          secundariaClase={Number(metricas.ac_outside_schedule_hours_today ?? 0) > 0 ? "text-danger" : "text-muted"}
        />

        <TarjetaEnergia
          titulo="Energía en vacío"
          valor={energiaVacio}
          unidad="kWh"
          icono={<MdAccessTime />}
          valorClase={Number(metricas.empty_energy_kwh ?? 0) > 0 ? "text-danger" : "text-dark"}
          secundaria={porcentajeVacio}
        />
      </div>

      <section className="card mb-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4 pr-0 sm:pr-40">
          <div>
            <p className="font-semibold text-dark">Consumo energético y ocupación</p>
            <div className="flex items-center gap-4 text-xs text-muted mt-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-primary rounded-full" /> Consumo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-4 h-2 rounded-sm bg-[#D8F6F2]" /> Ocupado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {RANGOS.map(opcion => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setRango(opcion.valor)}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  rango === opcion.valor
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted hover:bg-gray-200"
                }`}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {errorEnergia && !demoActivo ? (
          <div className="h-[150px] rounded-xl bg-danger/5 text-danger flex flex-col items-center justify-center text-center px-6">
            <p className="font-semibold">Error al cargar</p>
            <p className="text-xs mt-1 max-w-md">
              {detalleErrorEnergia?.response?.data?.detail ?? detalleErrorEnergia?.message ?? "No se pudo cargar el resumen energético."}
            </p>
          </div>
        ) : (
          <ConsumptionLineChart
            datos={grafica.points ?? []}
            cargando={cargandoEnergia && !demoActivo}
            unidad={grafica.unit ?? "W"}
            valueKey={grafica.value_key ?? "potencia_w"}
            baseline={baseline.chart_value}
            mensajeVacio={grafica.empty_message}
          />
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <UsefulEmptyBarChart datos={phase2.useful_vs_empty ?? []} />
        <ActivityWidget actividad={phase2.activity ?? {}} />
      </div>

      <ConsumptionHeatmap heatmap={phase2.heatmap ?? {}} />
    </PageWrapper>
  )
}
