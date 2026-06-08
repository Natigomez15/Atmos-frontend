import clienteAPI from "./cliente"

export const obtenerAlertas = (parametros) =>
  clienteAPI.get("/alertas", { params: parametros })
    .then(r => r.data)

export const obtenerResumenAlertas = () =>
  clienteAPI.get("/alertas/resumen").then(r => r.data)

export const resolverAlerta = (alertaId) =>
  clienteAPI.patch(`/alertas/${alertaId}/resolver`)
    .then(r => r.data)

export const ejecutarVerificacion = () =>
  clienteAPI.post("/alertas/ejecutar-verificaciones").then(r => r.data)
