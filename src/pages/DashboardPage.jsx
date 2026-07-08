import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  MdBolt, MdSavings, MdMeetingRoom, MdNotifications,
  MdCheckCircle, MdGridView, MdAssessment, MdAir,
  MdAutoGraph,
} from "react-icons/md"

import PageWrapper          from "../components/layout/PageWrapper"
import PageHeader           from "../components/common/PageHeader"
import KPICard              from "../components/common/KPICard"
import RoomStatusCard       from "../components/common/RoomStatusCard"
import AlertItem            from "../components/common/AlertItem"
import ConsumptionLineChart from "../components/charts/ConsumptionLineChart"

import {
  obtenerResumenTablero,
  obtenerUltimasLecturasSalones,
  obtenerResumenAlertas,
  obtenerAlertasRecientes,
} from "../api/dashboard"
import { useAuth }           from "../context/AuthContext"
import { REFRESH_INTERVAL_MS } from "../constants/config"

function construirDatosPorHora(salones) {
  if (!salones?.length) return []
  const cubetas = {}
  salones.forEach(salon => {
    if (salon.recorded_at && salon.power_w != null) {
      const hora     = new Date(salon.recorded_at).getHours()
      const etiqueta = `${String(hora).padStart(2, "0")}:00`
      if (!cubetas[etiqueta]) cubetas[etiqueta] = { suma: 0, conteo: 0 }
      cubetas[etiqueta].suma   += salon.power_w
      cubetas[etiqueta].conteo += 1
    }
  })
  return Object.entries(cubetas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hora, { suma, conteo }]) => ({ hora, potencia_w: suma / conteo }))
}

function etiquetaHoy() {
  return new Date().toLocaleDateString("es-PE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}


export default function DashboardPage() {
  const navegar = useNavigate()
  const { estaLogueado, esAdmin, perfil } = useAuth()

  const { data: resumen, isLoading: cargandoResumen, refetch: recargarResumen } = useQuery({
    queryKey:        ["dashboard-summary"],
    queryFn:         obtenerResumenTablero,
    refetchInterval: REFRESH_INTERVAL_MS,
  })

  const { data: datosSalones, isLoading: cargandoSalones, refetch: recargarSalones } = useQuery({
    queryKey:        ["rooms-latest"],
    queryFn:         obtenerUltimasLecturasSalones,
    refetchInterval: REFRESH_INTERVAL_MS,
  })

  const { data: resumenAlertas } = useQuery({
    queryKey:        ["alerts-summary"],
    queryFn:         obtenerResumenAlertas,
    refetchInterval: 60000,
  })

  const { data: alertasRecientes, isLoading: cargandoAlertas } = useQuery({
    queryKey:        ["recent-alerts"],
    queryFn:         obtenerAlertasRecientes,
    refetchInterval: 60000,
  })

  function recargarTodo() { recargarResumen(); recargarSalones() }

  const datosPorHora   = construirDatosPorHora(datosSalones)
  const salonesActivos = datosSalones?.filter(s => s.ac_is_on).length ?? "—"
  const totalSalones   = datosSalones?.length ?? 0
  const totalAlertas   = resumenAlertas?.total_unresolved ?? 0

  return (
    <PageWrapper>

      <div className="mb-6">
        <PageHeader
          eyebrow={etiquetaHoy()}
          title={estaLogueado && perfil?.nombre ? `Hola, ${perfil.nombre}` : "Panel general"}
          description="Resumen en tiempo real del sistema de control energético"
        />
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard titulo="Consumo hoy"      valor={resumen?.total_energy_kwh?.toFixed(2) ?? "—"} unidad="kWh"           icono={<MdBolt size={20} />}          color="secondary" cargando={cargandoResumen} />
        <KPICard titulo="Ahorro estimado"  valor={resumen?.total_savings_usd?.toFixed(2) ?? "—"} unidad="USD"          icono={<MdSavings size={20} />}        tendencia={resumen?.avg_savings_pct} color="success" cargando={cargandoResumen} />
        <KPICard titulo="Laboratorios activos" valor={salonesActivos} unidad={`/ ${totalSalones}`}                     icono={<MdMeetingRoom size={20} />}    color="primary"   cargando={cargandoSalones} />
        <KPICard titulo="Alertas activas"  valor={totalAlertas}                                                        icono={<MdNotifications size={20} />}  color={totalAlertas > 0 ? "danger" : "success"} cargando={false} />
      </div>

      {/* ── Gráfico + Alertas recientes ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-3 card">
              <div className="mb-4">
                <p className="font-semibold text-dark">Consumo eléctrico — últimas 24h</p>
                <p className="text-xs text-muted mt-0.5">Potencia promedio por hora del pabellón</p>
              </div>
              <ConsumptionLineChart datos={datosPorHora} cargando={cargandoSalones} />
            </div>

            <div className="lg:col-span-2 card flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-dark text-sm">Alertas recientes</p>
                <button onClick={() => navegar("/alerts")} className="text-xs text-secondary hover:underline">
                  Ver todas →
                </button>
              </div>

              {cargandoAlertas ? (
                <div className="space-y-3 mt-2">
                  {[0, 1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : !alertasRecientes?.length ? (
                <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2">
                  <MdCheckCircle size={32} className="text-success" />
                  <p className="text-sm text-muted">Sin alertas activas</p>
                </div>
              ) : (
                <div>
                  {alertasRecientes.map((alerta, i) => (
                    <AlertItem
                      key={alerta.id ?? i}
                      alert_type={alerta.alert_type}
                      severity={alerta.severity}
                      message={alerta.message}
                      created_at={alerta.created_at}
                      room_name={alerta.room_name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Estado de laboratorios ───────────────────────────────────── */}
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-dark tracking-tight">Estado de laboratorios</h3>
              <p className="text-xs text-muted mt-0.5">Se actualiza cada 30 segundos</p>
            </div>
          </div>

          {cargandoSalones ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card h-36 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datosSalones?.map(salon => (
                <RoomStatusCard
                  key={salon.room_id}
                  {...salon}
                  onClick={() => navegar(`/monitoring?room_id=${salon.room_id}`)}
                />
              ))}
            </div>
          )}
    </PageWrapper>
  )
}
