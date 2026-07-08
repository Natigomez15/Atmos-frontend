import cliente from "./client"
import { filtrarSalonesAtmos } from "./salonesAtmos"

export const obtenerNodos          = ()           => cliente.get("/nodes").then(r => r.data)
export const obtenerNodo           = (id)         => cliente.get(`/nodes/${id}`).then(r => r.data)
export const registrarNodo         = (carga)      => cliente.post("/nodes", carga).then(r => r.data)
export const actualizarNodo        = (id, carga)  => cliente.put(`/nodes/${id}`, carga).then(r => r.data)
export const eliminarNodo          = (id)         => cliente.delete(`/nodes/${id}`).then(r => r.data)
export const activarNodo           = (id)         => cliente.post(`/nodes/${id}/activate`).then(r => r.data)
export const desactivarNodo        = (id)         => cliente.post(`/nodes/${id}/deactivate`).then(r => r.data)
export const obtenerSalonesNodos   = ()           => cliente.get("/rooms").then(r => filtrarSalonesAtmos(r.data))
