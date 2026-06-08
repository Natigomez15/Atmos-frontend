import clienteAPI from "./cliente"

export const obtenerConfiguracionSistema = () =>
  clienteAPI.get("/ajustes/sistema").then(respuesta => respuesta.data)

export const actualizarConfiguracionSistema = (datos) =>
  clienteAPI.patch("/ajustes/sistema", datos).then(respuesta => respuesta.data)

export const obtenerPerfil = () =>
  clienteAPI.get("/ajustes/perfil").then(respuesta => respuesta.data)

export const actualizarPerfil = (datos) =>
  clienteAPI.patch("/ajustes/perfil", datos).then(respuesta => respuesta.data)
