import { API_BASE_URL } from "../constants/config"
import { supabase } from "../lib/supabase"

async function obtenerTokenSesion() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function fetchNotificaciones(etiqueta, ruta, opciones = {}) {
  const url = `${API_BASE_URL}${ruta}`
  console.log(`[PWA API] ${etiqueta}:`, url)

  try {
    const respuesta = await fetch(url, opciones)
    const texto = await respuesta.text()

    console.log(`[PWA API] ${etiqueta} status:`, respuesta.status)
    console.log(`[PWA API] ${etiqueta} response body:`, texto)

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status} en ${etiqueta}: ${texto}`)
    }

    if (!texto) return null

    try {
      return JSON.parse(texto)
    } catch (errorJson) {
      throw new Error(`Respuesta no JSON en ${etiqueta}: ${texto}`)
    }
  } catch (error) {
    console.error(`[PWA API] fetch failed en ${etiqueta}:`, error)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Fallo de red/CORS/backend inaccesible en ${etiqueta}. URL: ${url}`
      )
    }
    throw error
  }
}

async function peticionAutenticada(etiqueta, metodo, ruta, cuerpo = null) {
  const token = await obtenerTokenSesion()
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  const opciones = { method: metodo, headers }
  if (cuerpo) {
    if (ruta.includes("/notificaciones/suscribir")) {
      console.log("[PWA API] POST suscribir payload:", {
        endpoint: cuerpo.endpoint ? `${cuerpo.endpoint.slice(0, 45)}...` : null,
        tiene_p256dh: Boolean(cuerpo.p256dh || cuerpo.keys?.p256dh),
        tiene_auth: Boolean(cuerpo.auth || cuerpo.keys?.auth),
        permiso: cuerpo.permiso,
        user_agent: cuerpo.user_agent,
      })
    }
    opciones.body = JSON.stringify(cuerpo)
  }

  return fetchNotificaciones(etiqueta, ruta, opciones)
}

export async function obtenerClavePublica() {
  const datos = await fetchNotificaciones(
    "GET clave-publica",
    "/notificaciones/clave-publica"
  )
  return datos.clave_publica
}

export function suscribirseANotificaciones(subscription) {
  return peticionAutenticada("POST suscribir", "POST", "/notificaciones/suscribir", subscription)
}

export function cancelarNotificaciones() {
  return peticionAutenticada("DELETE cancelar", "DELETE", "/notificaciones/cancelar")
}

export function actualizarHorarioNotificaciones(cambios) {
  return peticionAutenticada("PATCH horario", "PATCH", "/notificaciones/horario", cambios)
}

export function enviarNotificacionPrueba() {
  return peticionAutenticada("POST prueba", "POST", "/notificaciones/prueba")
}
