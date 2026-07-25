import cliente from "./client"
import { airePrincipalSalon, esAireIgnorado, filtrarSalonesAtmos, limpiarAiresSalon } from "./salonesAtmos"

const UMBRAL_APAGADO_AC_W = Number(import.meta.env.VITE_AC_POWER_OFF_THRESHOLD_W ?? 700)
const UMBRAL_ENCENDIDO_AC_W = Number(import.meta.env.VITE_AC_POWER_ON_THRESHOLD_W ?? 700)

export const obtenerSalones = () =>
  cliente.get("/rooms").then(res => filtrarSalonesAtmos(res.data))

export const obtenerAiresDeSalon = (salon) => {
  const airesSalon = limpiarAiresSalon(salon)
  if (airesSalon.length) return Promise.resolve(airesSalon)

  const pabellon = salon?.pabellon ?? salon?.pavilion ?? salon?.edificio
  if (!pabellon) return Promise.resolve([])
  return cliente.get("/lecturas/registros/aires", { params: { pabellon } })
    .then(r => r.data.filter(aire => !esAireIgnorado(aire)))
}

function parametrosRegistro(salon, aireSeleccionado) {
  const pabellon = salon?.pabellon ?? salon?.pavilion ?? salon?.edificio
  const aire = airePrincipalSalon(salon, aireSeleccionado)
  return { pabellon, aire }
}

function datoSensorValido(valor) {
  return valor != null && Number(valor) !== 0 ? valor : null
}

function extraerAccionAtmos(registro) {
  return String(
    registro?.ultima_accion_ejecutada
    ?? registro?.recomendacion_local
    ?? registro?.recomendacion
    ?? registro?.accion_final
    ?? registro?.accion
    ?? ""
  ).trim().toLowerCase()
}

function setpointDesdeAccion(registro) {
  const setpointExplicito = registro?.setpoint_c ?? registro?.setpoint_ac ?? registro?.setpoint
  if (setpointExplicito != null) return setpointExplicito

  const accion = extraerAccionAtmos(registro)
  const setpoints = {
    encender_22: 22,
    ahorro_24: 24,
    posible_ahorro: 24,
    enfriar_fuerte: 20,
  }

  return setpoints[accion] ?? null
}

function estadoAcDesdeLectura(registro, potenciaW) {
  if (potenciaW != null && Number.isFinite(Number(potenciaW))) {
    if (Number(potenciaW) < UMBRAL_APAGADO_AC_W) {
      return { encendido: false, estado: "apagado", fuente: "potencia" }
    }
    if (Number(potenciaW) >= UMBRAL_ENCENDIDO_AC_W) {
      return { encendido: true, estado: "encendido", fuente: "potencia" }
    }
    return {
      encendido: null,
      estado: "no_confirmado",
      fuente: "potencia",
    }
  }

  const accion = extraerAccionAtmos(registro)
  if (accion === "apagar") return { encendido: false, estado: "apagado", fuente: "comando" }
  if (["encender_22", "encender_23", "ahorro_24", "enfriar_fuerte"].includes(accion)) {
    return { encendido: true, estado: "encendido", fuente: "comando" }
  }
  const encendidoSoftware = registro.ac_is_on ?? registro.aire_encendido_atmos ?? false
  return {
    encendido: encendidoSoftware,
    estado: encendidoSoftware ? "encendido" : "apagado",
    fuente: "software",
  }
}

function mapearRegistro(registro) {
  if (!registro) return null
  const potenciaW = registro.power_w
    ?? registro.potencia_activa_w
    ?? registro.potencia_w
    ?? null
  const estadoAc = estadoAcDesdeLectura(registro, potenciaW)
  return {
    ...registro,
    room_id: registro.sala_id,
    temperature: datoSensorValido(registro.temperature ?? registro.temperatura_ambiente),
    outlet_temperature: datoSensorValido(
      registro.outlet_temperature
        ?? registro.temperatura_salida_aire
        ?? registro.temperatura_ac
        ?? registro.temperatura_ds18b20
    ),
    humidity: datoSensorValido(registro.humidity ?? registro.humedad),
    presence: registro.presence ?? registro.estado_ocupacion ?? false,
    ac_is_on: estadoAc.encendido,
    ac_state: estadoAc.estado,
    ac_state_source: estadoAc.fuente,
    ac_power_off_threshold_w: UMBRAL_APAGADO_AC_W,
    ac_power_on_threshold_w: UMBRAL_ENCENDIDO_AC_W,
    power_w: potenciaW,
    energy_kwh: registro.energy_kwh ?? registro.energia_kwh ?? null,
    energy_wh: registro.energy_wh ?? (
      registro.energia_kwh != null ? registro.energia_kwh * 1000 : null
    ),
    setpoint_c: setpointDesdeAccion(registro),
    action: extraerAccionAtmos(registro) || null,
    recorded_at: registro.recorded_at ?? registro.fecha_sync ?? null,
  }
}

export const obtenerUltimaLectura = (salon, aire) =>
  cliente.get("/lecturas/registros/reciente", {
    params: parametrosRegistro(salon, aire),
  }).then(res => mapearRegistro(res.data))

export const obtenerDiagnosticoLecturas = (salon, aire) =>
  cliente.get("/atmos/diagnostico", {
    params: parametrosRegistro(salon, aire),
  }).then(res => res.data)

export const obtenerLecturasHistoricas = (salon, horas = 6, aire) =>
  cliente.get("/lecturas/registros", {
    params: {
      ...parametrosRegistro(salon, aire),
      limite: 100,
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
