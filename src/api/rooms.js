import cliente from "./client"
import { airePrincipalSalon, esAireIgnorado, filtrarSalonesAtmos, prepararSalonAtmos } from "./salonesAtmos"

function mapearSalon(salon) {
  return prepararSalonAtmos(salon)
}

function datoSensorValido(valor) {
  return valor != null && Number(valor) !== 0 ? valor : null
}

function mapearLectura(registro) {
  if (!registro) return null
  return {
    ...registro,
    temperatura:   datoSensorValido(registro.temperatura ?? registro.temperatura_ambiente),
    humedad:       datoSensorValido(registro.humedad),
    presencia:     registro.presencia ?? registro.estado_ocupacion ?? false,
    ac_encendido:  registro.ac_encendido ?? registro.aire_encendido_atmos ?? false,
    potencia_w:    registro.potencia_w ?? null,
    energia_kwh:   registro.energia_kwh ?? null,
    registrado_en: registro.registrado_en ?? registro.fecha_sync ?? null,
  }
}

export const obtenerSalones = () =>
  cliente.get("/salas").then(res => filtrarSalonesAtmos(res.data))

export const crearSalon = (carga) =>
  cliente.post("/salas", carga).then(res => mapearSalon(res.data))

export const actualizarSalon = (idSalon, carga) =>
  cliente.patch(`/salas/${idSalon}`, carga).then(res => mapearSalon(res.data))

export const eliminarSalon = (idSalon) =>
  cliente.delete(`/salas/${idSalon}`).then(res => mapearSalon(res.data))

export const obtenerUltimaLecturaDetalladaSalon = (salon) => {
  const aire = airePrincipalSalon(salon)
  if (!aire || esAireIgnorado(aire)) return Promise.resolve(null)

  return cliente.get("/lecturas/registros/reciente", {
    params: {
      pabellon: salon.pabellon ?? salon.pavilion,
      aire,
    },
  })
    .then(res => mapearLectura(res.data))
    .catch(() => null)
}
