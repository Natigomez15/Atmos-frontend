import cliente from "./client"

export const obtenerSalones = () =>
  cliente.get("/rooms").then(res => res.data)

function parametrosRegistro(salon) {
  return {
    pabellon: salon?.pabellon ?? salon?.pavilion ?? salon?.edificio,
    aire: salon?.nombre ?? salon?.name,
  }
}

function datoSensorValido(valor) {
  return valor != null && Number(valor) !== 0 ? valor : null
}

function mapearRegistro(registro) {
  if (!registro) return null
  return {
    ...registro,
    room_id: registro.sala_id,
    temperature: datoSensorValido(registro.temperature ?? registro.temperatura_ambiente),
    humidity: datoSensorValido(registro.humidity ?? registro.humedad),
    presence: registro.presence ?? registro.estado_ocupacion ?? false,
    ac_is_on: registro.ac_is_on ?? registro.aire_encendido_atmos ?? false,
    power_w: registro.power_w ?? registro.potencia_w ?? null,
    energy_kwh: registro.energy_kwh ?? registro.energia_kwh ?? null,
    energy_wh: registro.energy_wh ?? (
      registro.energia_kwh != null ? registro.energia_kwh * 1000 : null
    ),
    recorded_at: registro.recorded_at ?? registro.fecha_sync ?? null,
  }
}

export const obtenerUltimaLectura = (salon) =>
  cliente.get("/lecturas/registros/reciente", {
    params: parametrosRegistro(salon),
  }).then(res => mapearRegistro(res.data))

export const obtenerLecturasHistoricas = (salon, horas = 6) =>
  cliente.get("/lecturas/registros", {
    params: {
      ...parametrosRegistro(salon),
      limite: 500,
    }
  }).then(res => {
    const desde = Date.now() - horas * 60 * 60 * 1000
    return res.data
      .map(mapearRegistro)
      .filter(registro => !registro.recorded_at || new Date(registro.recorded_at).getTime() >= desde)
  })

export const enviarComandoAC = (carga) =>
  cliente.post("/ac-commands", carga).then(res => res.data)

export const obtenerComandosPendientes = (idSalon) =>
  cliente.get("/ac-commands", {
    params: { room_id: idSalon, only_pending: true, limit: 10 }
  }).then(res => res.data)
