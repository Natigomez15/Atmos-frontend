import clienteAPI from "./cliente"

export const obtenerConfiguracionSistema = () =>
  clienteAPI.get("/ajustes/sistema").then(respuesta => respuesta.data)

export const actualizarConfiguracionSistema = (datos) =>
  clienteAPI.patch("/ajustes/sistema", datos).then(respuesta => respuesta.data)

export const obtenerPerfil = () =>
  clienteAPI.get("/ajustes/perfil").then(respuesta => respuesta.data)

export const actualizarPerfil = (datos) =>
  clienteAPI.patch("/ajustes/perfil", datos).then(respuesta => respuesta.data)

export const obtenerUsuarios = () =>
  clienteAPI.get("/ajustes/usuarios").then(respuesta => respuesta.data)

export const actualizarUsuario = (usuarioId, cambios) =>
  clienteAPI
    .patch(`/ajustes/usuarios/${usuarioId}`, cambios)
    .then(respuesta => respuesta.data)
