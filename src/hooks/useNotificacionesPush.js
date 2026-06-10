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

  function mensajeUsuarioDesdeError(err) {
    const mensaje = err?.message ?? String(err)

    if (mensaje.includes("GET clave-publica")) {
      return "No se pudo obtener la clave publica VAPID desde el backend."
    }
    if (mensaje.includes("POST suscribir")) {
      return "No se pudo guardar la suscripcion push en el servidor."
    }
    if (mensaje.includes("POST prueba")) {
      return "No se pudo enviar la notificacion de prueba."
    }
    if (mensaje.includes("Fallo de red/CORS/backend inaccesible")) {
      return mensaje
    }
    if (mensaje.includes("401") || mensaje.includes("403")) {
      return "Error de autenticacion. Inicia sesion nuevamente."
    }
    if (mensaje.includes("404") && mensaje.includes("No hay suscrip")) {
      return "No hay suscripciones activas para enviar prueba."
    }
    return mensaje
  }

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

      console.log("[PWA] Paso 1: Solicitar permiso de notificaciones...")
      const permisoConcedido = await Notification.requestPermission()
      setPermiso(permisoConcedido)
      if (permisoConcedido !== 'granted') {
        setError("El navegador bloqueó las notificaciones.")
        console.log("[PWA] Permiso denegado por usuario")
        return false
      }

      console.log("[PWA] Paso 2: Registrar service worker...")
      const registro = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      console.log("[PWA] Service worker registrado exitosamente")

      console.log("[PWA] Paso 3: Obtener clave pública VAPID...")
      const clavePublica = await obtenerClavePublica()
      console.log("[PWA] Clave pública obtenida (primeros 20 caracteres):", clavePublica.substring(0, 20) + "...")

      console.log("[PWA] Paso 4: Crear suscripción push...")
      const suscripcionExistente = await registro.pushManager.getSubscription()
      const suscripcion  = suscripcionExistente ?? await registro.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64AUint8Array(clavePublica),
      })
      console.log("[PWA] Suscripción push creada, endpoint:", suscripcion.endpoint.substring(0, 50) + "...")

      console.log("[PWA] Paso 5: Guardar suscripción en servidor...")
      const datosSuscripcion = suscripcion.toJSON()
      await suscribirseANotificaciones({
        endpoint: datosSuscripcion.endpoint,
        p256dh: datosSuscripcion.keys.p256dh,
        auth: datosSuscripcion.keys.auth,
        permiso: permisoConcedido,
        user_agent: navigator.userAgent,
      })
      console.log("[PWA] Suscripción guardada exitosamente en el servidor")

      setSuscrito(true)
      return true
    } catch (err) {
      console.error("[PWA] Error:", err.message, err)
      setError(mensajeUsuarioDesdeError(err))
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
    setError(null)
    try {
      return await enviarNotificacionPrueba()
    } catch (err) {
      console.error("[PWA] Error prueba:", err.message, err)
      setError(mensajeUsuarioDesdeError(err))
      throw err
    }
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
