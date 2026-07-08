import cliente from "./client"
import { filtrarSalonesAtmos } from "./salonesAtmos"

export const obtenerComandos = (parametros) =>
  cliente.get("/ac-commands", { params: parametros }).then(res => res.data)

export const enviarComando = (carga) =>
  cliente.post("/ac-commands", carga).then(res => res.data)

export const enviarComandoDesdePredicion = (idPrediccion) =>
  cliente.post(`/ac-commands/from-prediction/${idPrediccion}`).then(res => res.data)

export const obtenerSalonesComandos = () =>
  cliente.get("/rooms").then(res => filtrarSalonesAtmos(res.data))
