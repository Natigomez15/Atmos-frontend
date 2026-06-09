import cliente from "./client"

export const obtenerResumenTablero = () =>
  cliente.get("/reports/summary/pavilion?period_days=1").then(res => res.data)

function parametrosRegistro(salon) {
  return {
    pabellon: salon?.pabellon ?? salon?.pavilion ?? salon?.edificio,
    aire: salon?.nombre ?? salon?.name,
  }
}

function mapearRegistro(registro, salon) {
  return {
    ...registro,
    room_id: salon.id,
    room_name: salon.name ?? salon.nombre,
    temperature: registro.temperatura_ambiente ?? null,
    humidity: registro.humedad ?? null,
    presence: registro.estado_ocupacion ?? false,
    ac_is_on: registro.aire_encendido_atmos ?? false,
    power_w: registro.potencia_w ?? null,
    energy_kwh: registro.energia_kwh ?? null,
    recorded_at: registro.fecha_sync ?? null,
  }
}

export const obtenerUltimasLecturasSalones = async () => {
  const salones = await cliente.get("/rooms").then(res => res.data)
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
