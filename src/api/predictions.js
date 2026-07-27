import cliente from "./client"
import { filtrarSalonesAtmos } from "./salonesAtmos"

export const obtenerSalonesPrediciones = () =>
  cliente.get("/rooms").then(res => filtrarSalonesAtmos(res.data))

export const obtenerUltimaPrediccion = (idSalon) =>
  cliente.get(`/ml/predictions/${idSalon}/latest`).then(res => res.data)

export const obtenerUltimaDecision = ({ pabellon, aire }) =>
  cliente.get("/ml/decisions/latest", {
    params: { pabellon, aire },
  }).then(res => res.data)

export const obtenerPrediccionActualFirebase = ({ pabellon, aire }) =>
  cliente.post("/ml/recommendations/current", null, {
    params: { pabellon, aire },
  }).then(res => res.data)

export const obtenerInfoModelo = () =>
  cliente.get("/ml/modelo/info").then(res => res.data)

export const obtenerCaracteristicasML = (idSalon, diasAtras = 7) =>
  cliente.get(`/ml/features/${idSalon}`, {
    params: { days_back: diasAtras },
  }).then(res => res.data)

export const obtenerPotenciaActivaFirebase = ({ pabellon, aire, dias = 7 }) =>
  cliente.get("/lecturas/registros/potencia-activa", {
    params: { pabellon, aire, dias },
  }).then(res => res.data)
