import { API_BASE_URL } from "../constants/config"
import { supabase } from "../lib/supabase"

async function obtenerTokenSesion() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function peticionAutenticada(metodo, ruta, cuerpo = null) {
  const token = await obtenerTokenSesion()
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  const opciones = { method: metodo, headers }
  if (cuerpo) opciones.body = JSON.stringify(cuerpo)

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, opciones)
  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "")
    throw new Error(`Error ${respuesta.status}: ${detalle}`)
  }
  return respuesta.json()
}

export async function obtenerClavePublica() {
  const respuesta = await fetch(`${API_BASE_URL}/notificaciones/clave-publica`)
  if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`)
  const datos = await respuesta.json()
  return datos.clave_publica
}

export function suscribirseANotificaciones(subscription) {
  return peticionAutenticada("POST", "/notificaciones/suscribir", subscription)
}

export function cancelarNotificaciones() {
  return peticionAutenticada("DELETE", "/notificaciones/cancelar")
}

export function actualizarHorarioNotificaciones(cambios) {
  return peticionAutenticada("PATCH", "/notificaciones/horario", cambios)
}

export function enviarNotificacionPrueba() {
  return peticionAutenticada("POST", "/notificaciones/prueba")
}
