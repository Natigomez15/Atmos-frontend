import { useState, useEffect, useCallback } from "react"
import {
  actualizarHorarioNotificaciones,
  cancelarNotificaciones,
  enviarNotificacionPrueba,
  obtenerClavePublica,
  suscribirseANotificaciones,
} from "../api/notificaciones"

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

export function useNotificacionesPush() {
  const compatible = (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  )
  const [permiso,  setPermiso]  = useState(
    compatible ? Notification.permission : "unsupported"
  )
  const [suscrito, setSuscrito] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState(null)

  const verificarSuscripcion = useCallback(async () => {
    if (!compatible) return
    const registro = await navigator.serviceWorker.getRegistration()
    if (!registro) return
    const suscripcion = await registro.pushManager.getSubscription()
    setSuscrito(!!suscripcion)
  }, [compatible])

  useEffect(() => {
    verificarSuscripcion()
  }, [verificarSuscripcion])

  const suscribirse = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      if (!compatible) {
        setError("Este navegador no soporta notificaciones push.")
        return false
      }

      const permisoConcedido = await Notification.requestPermission()
      setPermiso(permisoConcedido)
      if (permisoConcedido !== 'granted') {
        setError("El navegador bloqueó las notificaciones.")
        return false
      }

      const registro = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const clavePublica = await obtenerClavePublica()
      const suscripcionExistente = await registro.pushManager.getSubscription()
      const suscripcion  = suscripcionExistente ?? await registro.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64AUint8Array(clavePublica),
      })

      const datosSuscripcion = suscripcion.toJSON()
      await suscribirseANotificaciones({
        endpoint: datosSuscripcion.endpoint,
        p256dh: datosSuscripcion.keys.p256dh,
        auth: datosSuscripcion.keys.auth,
        permiso: permisoConcedido,
        user_agent: navigator.userAgent,
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
      await cancelarNotificaciones()
      setSuscrito(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }, [])

  const enviarPrueba = useCallback(async () => {
    await enviarNotificacionPrueba()
  }, [])

  const actualizarHorario = useCallback(async (cambios) => {
    await actualizarHorarioNotificaciones(cambios)
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
    compatible,
  }
}
