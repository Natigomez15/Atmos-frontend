const TARIFA = 0.17
const BASELINE_KWH_DIA = 36
const DEMO_AHORA = new Date("2026-07-09T16:00:00-05:00")

function inicioDia(fecha) {
  const copia = new Date(fecha)
  copia.setHours(0, 0, 0, 0)
  return copia
}

function potenciaDemo(fecha) {
  const hora = fecha.getHours()
  const diaSemana = fecha.getDay()
  if (diaSemana === 0 || hora < 6 || hora >= 23) return 0
  const base = hora >= 9 && hora <= 16 ? 1280 : 760
  const valleMediodia = hora >= 12 && hora <= 13 ? -280 : 0
  const pico = Math.sin((hora - 6) / 17 * Math.PI) * 210
  const variacion = ((fecha.getDate() * 31 + hora * 17) % 120) - 60
  return Math.max(0, Math.round(base + valleMediodia + pico + variacion))
}

function ocupadoDemo(fecha) {
  const hora = fecha.getHours()
  const diaSemana = fecha.getDay()
  if (diaSemana === 0 || hora < 7 || hora > 20) return false
  const bloqueClase = (hora >= 8 && hora <= 11) || (hora >= 14 && hora <= 17)
  const hueco = (fecha.getDate() + hora) % 6 === 0
  return bloqueClase && !hueco
}

function generarLecturas() {
  const ahora = new Date(DEMO_AHORA)
  const inicio = new Date(ahora)
  inicio.setDate(inicio.getDate() - 30)
  inicio.setMinutes(0, 0, 0)
  const lecturas = []
  for (let t = inicio.getTime(); t <= ahora.getTime(); t += 60 * 60 * 1000) {
    const fecha = new Date(t)
    const potencia_w = potenciaDemo(fecha)
    const ocupado = ocupadoDemo(fecha)
    lecturas.push({
      fecha,
      potencia_w,
      kwh: potencia_w / 1000,
      ocupado,
      ac_on: potencia_w > 100,
    })
  }
  return lecturas
}

function diasPorRango(rango) {
  if (rango === "3m") return 90
  if (rango === "30d") return 30
  if (rango === "15d") return 15
  if (rango === "7d") return 7
  return 1
}

function puntosPrincipales(lecturas, rango) {
  const ahora = new Date(DEMO_AHORA)
  const desde = new Date(ahora.getTime() - diasPorRango(rango) * 24 * 60 * 60 * 1000)
  const filtradas = lecturas.filter(l => l.fecha >= desde)

  if (rango === "30d" || rango === "3m") {
    const porDia = new Map()
    filtradas.forEach(l => {
      const clave = l.fecha.toISOString().slice(0, 10)
      const item = porDia.get(clave) ?? { energia_kwh: 0, ocupadas: 0, total: 0, fecha: l.fecha }
      item.energia_kwh += l.kwh
      item.ocupadas += l.ocupado ? 1 : 0
      item.total += 1
      porDia.set(clave, item)
    })
    return [...porDia.values()].map(item => ({
      label: item.fecha.toLocaleDateString("es-PA", { day: "2-digit", month: "2-digit" }),
      energia_kwh: Number(item.energia_kwh.toFixed(1)),
      ocupacion_banda: item.ocupadas / item.total >= 0.45 ? 1 : 0,
      ocupado: item.ocupadas / item.total >= 0.45,
    }))
  }

  const bloqueHoras = rango === "24h" ? 1 : 6
  const buckets = new Map()
  filtradas.forEach(l => {
    const f = new Date(l.fecha)
    f.setHours(Math.floor(f.getHours() / bloqueHoras) * bloqueHoras, 0, 0, 0)
    const clave = f.toISOString()
    const item = buckets.get(clave) ?? { suma: 0, total: 0, ocupadas: 0, fecha: f }
    item.suma += l.potencia_w
    item.total += 1
    item.ocupadas += l.ocupado ? 1 : 0
    buckets.set(clave, item)
  })
  return [...buckets.values()].map(item => ({
    label: rango === "24h"
      ? `${String(item.fecha.getHours()).padStart(2, "0")}:00`
      : item.fecha.toLocaleDateString("es-PA", { day: "2-digit", month: "2-digit" }),
    potencia_w: Number((item.suma / item.total).toFixed(0)),
    ocupacion_banda: item.ocupadas / item.total >= 0.45 ? 1 : 0,
    ocupado: item.ocupadas / item.total >= 0.45,
  }))
}

function metricas(lecturas, rango) {
  const ahora = new Date(DEMO_AHORA)
  const hoy = inicioDia(ahora)
  const inicioSemana = new Date(hoy)
  inicioSemana.setDate(inicioSemana.getDate() - 7)
  const inicioRango = new Date(ahora.getTime() - diasPorRango(rango) * 24 * 60 * 60 * 1000)
  const hoyLecturas = lecturas.filter(l => l.fecha >= hoy && l.fecha <= ahora)
  const periodo = lecturas.filter(l => l.fecha >= inicioRango && l.fecha <= ahora)
  const semana = lecturas.filter(l => l.fecha >= inicioSemana && l.fecha < hoy)
  const hoyKwh = hoyLecturas.reduce((s, l) => s + l.kwh, 0)
  const periodoKwh = periodo.reduce((s, l) => s + l.kwh, 0)
  const semanaKwh = semana.reduce((s, l) => s + l.kwh, 0) / 7
  const vacioHoy = hoyLecturas.filter(l => !l.ocupado && l.ac_on).reduce((s, l) => s + l.kwh, 0)
  const acVacioHoras = hoyLecturas.filter(l => !l.ocupado && l.ac_on).length
  const pico = periodo.reduce((maximo, lectura) => lectura.potencia_w > (maximo?.potencia_w ?? -1) ? lectura : maximo, null)
  return {
    today_energy_kwh: Number(hoyKwh.toFixed(1)),
    today_vs_week_avg_pct: Number((((hoyKwh - semanaKwh) / semanaKwh) * 100).toFixed(1)),
    week_avg_kwh: Number(semanaKwh.toFixed(1)),
    comparison_delta_kwh: Number((hoyKwh - semanaKwh).toFixed(2)),
    comparison_days: 7,
    comparison_available: true,
    period_energy_kwh: Number(periodoKwh.toFixed(1)),
    period_cost_usd: Number((periodoKwh * TARIFA).toFixed(2)),
    today_cost_usd: Number((hoyKwh * TARIFA).toFixed(2)),
    ac_hours_today: hoyLecturas.filter(l => l.ac_on).length,
    ac_empty_hours_today: acVacioHoras,
    ac_outside_schedule_hours_today: 0,
    empty_energy_kwh: Number(vacioHoy.toFixed(1)),
    empty_energy_scope: "hoy",
    empty_energy_pct: hoyKwh > 0 ? Number((vacioHoy / hoyKwh * 100).toFixed(1)) : null,
    empty_cost_usd: Number((vacioHoy * TARIFA).toFixed(2)),
    peak_power_w: pico?.potencia_w ?? null,
    peak_power_at: pico?.fecha?.toISOString() ?? null,
    estimated_savings_usd: null,
    estimated_savings_available: false,
    estimated_savings_reason: "Demo sin baseline validado",
  }
}

function utilVsVacio(lecturas) {
  const hoy = inicioDia(DEMO_AHORA)
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoy)
    dia.setDate(dia.getDate() - (6 - i))
    const fin = new Date(dia)
    fin.setDate(fin.getDate() + 1)
    const items = lecturas.filter(l => l.fecha >= dia && l.fecha < fin)
    return {
      label: dia.toLocaleDateString("es-PA", { day: "2-digit", month: "2-digit" }),
      util_kwh: Number(items.filter(l => l.ocupado).reduce((s, l) => s + l.kwh, 0).toFixed(1)),
      vacio_kwh: Number(items.filter(l => !l.ocupado).reduce((s, l) => s + l.kwh, 0).toFixed(1)),
    }
  })
}

function heatmap(lecturas) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const hours = Array.from({ length: 17 }, (_, i) => i + 6)
  const points = []
  let max = 0
  days.forEach((day, dayIndex) => {
    hours.forEach(hour => {
      const items = lecturas.filter(l => ((l.fecha.getDay() + 6) % 7) === dayIndex && l.fecha.getHours() === hour)
      const kwh = items.length ? items.reduce((s, l) => s + l.kwh, 0) / items.length : 0
      max = Math.max(max, kwh)
      points.push({ day, day_index: dayIndex, hour, label: `${hour}:00`, kwh: Number(kwh.toFixed(2)) })
    })
  })
  return { days, hours, points, max_kwh: max, insufficient_data: false, empty_message: "Acumulando datos históricos" }
}

export function construirDashboardDemo(rango = "24h") {
  const lecturas = generarLecturas()
  const modo = rango === "30d" || rango === "3m" ? "energy" : "power"
  return {
    range: rango,
    range_label: rango,
    generated_at: DEMO_AHORA.toISOString(),
    timezone: "America/Panama",
    tariff_usd_per_kwh: TARIFA,
    baseline: {
      kwh_per_day: BASELINE_KWH_DIA,
      period_kwh: BASELINE_KWH_DIA,
      chart_value: modo === "power" ? 1500 : BASELINE_KWH_DIA,
      chart_unit: modo === "power" ? "W" : "kWh/día",
      configured_in: "demoData.js",
    },
    chart: {
      mode: modo,
      unit: modo === "power" ? "W" : "kWh/día",
      value_key: modo === "power" ? "potencia_w" : "energia_kwh",
      points: puntosPrincipales(lecturas, rango),
      insufficient_data: false,
      empty_message: "Datos insuficientes",
    },
    metrics: metricas(lecturas, rango),
    phase2: {
      useful_vs_empty: utilVsVacio(lecturas),
      useful_vs_empty_insufficient_data: false,
      heatmap: heatmap(lecturas),
    },
    source: "demo",
  }
}
