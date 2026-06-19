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

import {
  obtenerResumenTablero,
  obtenerUltimasLecturasSalones,
  obtenerResumenAlertas,
  obtenerAlertasRecientes,
} from "../api/dashboard"
import { useAuth }           from "../context/AuthContext"
import { REFRESH_INTERVAL_MS } from "../constants/config"

function etiquetaHoy() {
  return new Date().toLocaleDateString("es-PE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

function PanelConsumoActual({ salones = [], cargando = false }) {
  if (cargando) return <div className="h-[220px] bg-gray-100 rounded-xl animate-pulse" />

  if (!salones.length) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center rounded-2xl bg-gray-50 text-center px-6">
        <MdBolt size={34} className="text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-dark">Sin lecturas de consumo</p>
        <p className="text-xs text-muted mt-1">Cuando lleguen lecturas del ESP32 aparecera el consumo por laboratorio.</p>
      </div>
    )
  }

  const potenciaTotal = salones.reduce((total, salon) => total + Number(salon.power_w ?? 0), 0)
  const energiaTotal = salones.reduce((total, salon) => total + Number(salon.energy_kwh ?? 0), 0)
  const maxPotencia = Math.max(1500, ...salones.map(salon => Number(salon.power_w ?? 0)))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-secondary/8 px-4 py-3">
          <p className="text-xs text-muted">Potencia actual</p>
          <p className="text-2xl font-bold text-dark mt-1">{potenciaTotal.toFixed(0)} W</p>
        </div>
        <div className="rounded-2xl bg-success/8 px-4 py-3">
          <p className="text-xs text-muted">Energia acumulada</p>
          <p className="text-2xl font-bold text-dark mt-1">{energiaTotal.toFixed(2)} kWh</p>
        </div>
      </div>

      <div className="space-y-3">
        {salones.map((salon) => {
          const potencia = Number(salon.power_w ?? 0)
          const porcentaje = Math.min(100, (potencia / maxPotencia) * 100)
          return (
            <div key={salon.room_id} className="rounded-2xl border border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dark truncate">{salon.room_name}</p>
                  <p className="text-xs text-muted">{salon.ac_is_on ? "AC encendido" : "AC apagado"}</p>
                </div>
                <p className="text-sm font-bold text-dark tabular-nums">{potencia.toFixed(0)} W</p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${salon.ac_is_on ? "bg-secondary" : "bg-gray-300"}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
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

  const salonesActivos = datosSalones?.filter(s => s.ac_is_on).length ?? "-"
  const totalSalones   = datosSalones?.length ?? 0
  const totalAlertas   = resumenAlertas?.total_unresolved ?? 0

  return (
    <PageWrapper>

      <div className="mb-6">
        <PageHeader
          eyebrow={etiquetaHoy()}
          title={estaLogueado && perfil?.nombre ? `Hola, ${perfil.nombre}` : "Panel general"}
          description="Resumen en tiempo real del sistema de control energetico"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard titulo="Consumo hoy"      valor={resumen?.total_energy_kwh?.toFixed(2) ?? "-"} unidad="kWh"           icono={<MdBolt size={20} />}          color="secondary" cargando={cargandoResumen} />
        <KPICard titulo="Ahorro estimado"  valor={resumen?.total_savings_usd?.toFixed(2) ?? "-"} unidad="USD"          icono={<MdSavings size={20} />}        tendencia={resumen?.avg_savings_pct} color="success" cargando={cargandoResumen} />
        <KPICard titulo="Laboratorios activos" valor={salonesActivos} unidad={`/ ${totalSalones}`}                     icono={<MdMeetingRoom size={20} />}    color="primary"   cargando={cargandoSalones} />
        <KPICard titulo="Alertas activas"  valor={totalAlertas}                                                        icono={<MdNotifications size={20} />}  color={totalAlertas > 0 ? "danger" : "success"} cargando={false} />
      </div>

      {/* Alertas recientes */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* PanelConsumoActual oculto temporalmente hasta depurar el cálculo de consumo por aire/laboratorio. */}

            <div className="card flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-dark text-sm">Alertas recientes</p>
                <button onClick={() => navegar("/alerts")} className="text-xs text-secondary hover:underline">
                  Ver todas
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

          {/* Estado de laboratorios */}
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
