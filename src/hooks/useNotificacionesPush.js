import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { API_BASE_URL } from "../constants/config"

// Convierte la clave pública VAPID de base64url a Uint8Array
// (requerido por pushManager.subscribe)
function urlBase64AUint8Array(base64String) {
  const relleno = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + relleno)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const datos  = window.atob(base64)
  const salida = new Uint8Array(datos.length)
  for (let i = 0; i < datos.length; i++) {
    salida[i] = datos.charCodeAt(i)
  }
  return salida
}

async function obtenerTokenSesion() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function peticionAutenticada(metodo, ruta, cuerpo = null) {
  const token = await obtenerTokenSesion()
  const opciones = {
    method:  metodo,
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
  }
  if (cuerpo) opciones.body = JSON.stringify(cuerpo)
  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, opciones)
  if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`)
  return respuesta.json()
}

async function obtenerClavePublicaVapid() {
  const respuesta = await fetch(`${API_BASE_URL}/notificaciones/clave-publica`)
  const datos = await respuesta.json()
  return datos.clave_publica
}

export function useNotificacionesPush() {
  const [permiso,  setPermiso]  = useState(Notification.permission)
  const [suscrito, setSuscrito] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState(null)

  const verificarSuscripcion = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return
    const registro = await navigator.serviceWorker.getRegistration()
    if (!registro) return
    const suscripcion = await registro.pushManager.getSubscription()
    setSuscrito(!!suscripcion)
  }, [])

  useEffect(() => {
    verificarSuscripcion()
  }, [verificarSuscripcion])

  const suscribirse = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const permisoConcedido = await Notification.requestPermission()
      setPermiso(permisoConcedido)
      if (permisoConcedido !== 'granted') {
        setError("Permiso de notificaciones denegado")
        return false
      }

      const registro = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const clavePublica = await obtenerClavePublicaVapid()
      const suscripcion  = await registro.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64AUint8Array(clavePublica),
      })

      const datosSuscripcion = suscripcion.toJSON()
      await peticionAutenticada('POST', '/notificaciones/suscribir', {
        endpoint:     datosSuscripcion.endpoint,
        clave_p256dh: datosSuscripcion.keys.p256dh,
        clave_auth:   datosSuscripcion.keys.auth,
      })

      setSuscrito(true)
      return true
    } catch (err) {
      setError("Error al activar notificaciones")
      console.error(err)
      return false
    } finally {
      setCargando(false)
    }
  }, [])

  const cancelarSuscripcion = useCallback(async () => {
    setCargando(true)
    try {
      const registro = await navigator.serviceWorker.getRegistration()
      if (registro) {
        const suscripcion = await registro.pushManager.getSubscription()
        if (suscripcion) await suscripcion.unsubscribe()
      }
      await peticionAutenticada('DELETE', '/notificaciones/cancelar')
      setSuscrito(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [])

  const enviarPrueba = useCallback(async () => {
    await peticionAutenticada('POST', '/notificaciones/prueba')
  }, [])

  const actualizarHorario = useCallback(async (cambios) => {
    await peticionAutenticada('PATCH', '/notificaciones/horario', cambios)
  }, [])

  return {
    permiso,
    suscrito,
    cargando,
    error,
    suscribirse,
    cancelarSuscripcion,
    enviarPrueba,
    actualizarHorario,
    compatible: 'serviceWorker' in navigator && 'PushManager' in window,
  }
}
