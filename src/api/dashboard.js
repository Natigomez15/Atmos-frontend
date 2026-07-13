import cliente from "./client"
import { airePrincipalSalon, filtrarSalonesAtmos } from "./salonesAtmos"
import { construirDashboardDemo } from "../demo/demoData"

export const obtenerResumenTablero = () =>
  cliente.get("/reports/summary/pavilion?period_days=1").then(res => res.data)

const TARIFA_USD_KWH = 0.17

export function modoDemoDashboardActivo() {
  if (typeof window === "undefined") return false
  const busquedas = [
    window.location.search,
    window.location.hash.includes("?") ? window.location.hash.slice(window.location.hash.indexOf("?")) : "",
  ]
  return busquedas.some(search => new URLSearchParams(search).get("demo") === "1")
}

function construirFallbackDashboardLegacy(resumen, rango = "24h") {
  const energiaKwh = Number(resumen?.total_energy_kwh ?? 0)
  const costoUsd = Number(resumen?.total_cost_usd ?? energiaKwh * TARIFA_USD_KWH)

  return {
    range: rango,
    range_label: rango,
    generated_at: new Date().toISOString(),
    timezone: "America/Panama",
    tariff_usd_per_kwh: TARIFA_USD_KWH,
    source: "legacy-summary-fallback",
    baseline: {
      kwh_per_day: null,
      period_kwh: null,
      chart_value: null,
      chart_unit: "W",
      configured_in: "reports/summary/pavilion",
    },
    metrics: {
      today_energy_kwh: energiaKwh > 0 ? energiaKwh : null,
      today_vs_week_avg_pct: null,
      week_avg_kwh: null,
      period_energy_kwh: energiaKwh > 0 ? energiaKwh : null,
      period_cost_usd: energiaKwh > 0 ? costoUsd : null,
      ac_hours_today: null,
      ac_outside_schedule_hours_today: 0,
      empty_energy_kwh: null,
      empty_energy_scope: "hoy",
      estimated_savings_usd: null,
      estimated_savings_available: false,
      estimated_savings_reason: "Endpoint de energia agregado no disponible",
    },
    chart: {
      mode: "power",
      unit: "W",
      value_key: "potencia_w",
      points: [],
      insufficient_data: true,
      empty_message: "Datos insuficientes",
    },
    phase2: {
      useful_vs_empty: [],
      activity: {
        events: [],
        counts: [],
        table_available: false,
        empty_message: "Endpoint de energia agregado no disponible",
      },
      heatmap: {
        days: [],
        hours: [],
        points: [],
        max_kwh: 0,
        insufficient_data: true,
        empty_message: "Acumulando datos historicos",
      },
    },
  }
}

export const obtenerEnergiaDashboard = (rango = "24h") => {
  // DEMO MODE - eliminar antes de producción
  if (modoDemoDashboardActivo()) {
    return Promise.resolve(construirDashboardDemo(rango))
  }
  return cliente.get("/dashboard/energy", { params: { range: rango } })
    .then(res => res.data)
    .catch(error => {
      if (error?.response?.status !== 404) throw error

      return obtenerResumenTablero()
        .then(resumen => construirFallbackDashboardLegacy(resumen, rango))
    })
}

function parametrosRegistro(salon) {
  return {
    pabellon: salon?.pabellon ?? salon?.pavilion ?? salon?.edificio,
    aire: airePrincipalSalon(salon),
  }
}

function datoSensorValido(valor) {
  return valor != null && Number(valor) !== 0 ? valor : null
}

function mapearRegistro(registro, salon) {
  return {
    ...registro,
    room_id: salon.id,
    room_name: salon.name ?? salon.nombre,
    temperature: datoSensorValido(registro.temperatura_ambiente),
    humidity: datoSensorValido(registro.humedad),
    presence: registro.estado_ocupacion ?? false,
    ac_is_on: registro.aire_encendido_atmos ?? false,
    power_w: registro.potencia_w ?? null,
    energy_kwh: registro.energia_kwh ?? null,
    recorded_at: registro.fecha_sync ?? null,
  }
}

export const obtenerUltimasLecturasSalones = async () => {
  const salones = await cliente.get("/rooms").then(res => filtrarSalonesAtmos(res.data))
  const ultimasLecturas = await Promise.all(
    salones.map(salon =>
      cliente.get("/lecturas/registros/reciente", {
        params: parametrosRegistro(salon),
      })
        .then(res => mapearRegistro(res.data, salon))
        .catch(() => ({
          room_id:     salon.id,
          room_name:   salon.name,
          temperature: null,
          humidity:    null,
          presence:    false,
          ac_is_on:    false,
          power_w:     null,
          recorded_at: null,
        }))
    )
  )
  return ultimasLecturas
}

export const obtenerResumenAlertas = () =>
  cliente.get("/alerts/summary").then(res => res.data)

export const obtenerAlertasRecientes = () =>
  cliente.get("/alerts?is_resolved=false&limit=5").then(res => res.data)

export const obtenerConsumoPorHora = (idSalon) =>
  cliente.get("/readings", {
    params: {
      room_id: idSalon,
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      limit: 2000,
    },
  }).then(res => res.data)
