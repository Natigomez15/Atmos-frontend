import { useEffect, useRef, useState, useCallback } from "react"
import { WS_BASE_URL } from "../constants/config"
import { supabase } from "../lib/supabase"

const RETRASOS_RECONEXION = [3000, 5000, 10000, 20000, 30000]

export function useRoomWebSocket(idSalon) {
  const refWs              = useRef(null)
  const timeoutReconexion  = useRef(null)
  const intentoReconexion  = useRef(0)

  const [ultimaLectura, setUltimaLectura]   = useState(null)
  const [estaConectado, setEstaConectado]   = useState(false)
  const [reconectando,  setReconectando]    = useState(false)

  useEffect(() => {
    let activo = true
    intentoReconexion.current = 0

    async function conectar() {
      if (!activo || !idSalon) return
      if (
        refWs.current?.readyState === WebSocket.OPEN ||
        refWs.current?.readyState === WebSocket.CONNECTING
      ) return

      clearTimeout(timeoutReconexion.current)
      const { data: { session } } = await supabase.auth.getSession()
      if (!activo) return
      if (!session?.access_token) {
        setReconectando(false)
        console.error("[WS ROOMS] sesión ausente; conexión en tiempo real omitida")
        return
      }
      const parametros = new URLSearchParams({ access_token: session.access_token })
      const url = `${WS_BASE_URL}/ws/rooms/${encodeURIComponent(idSalon)}?${parametros}`
      const ws = new WebSocket(url)
      refWs.current = ws

      ws.onopen = () => {
        if (!activo || refWs.current !== ws) {
          ws.close()
          return
        }
        intentoReconexion.current = 0
        setEstaConectado(true)
        setReconectando(false)
      }

      ws.onmessage = (evento) => {
        if (!activo || refWs.current !== ws) return
        const datos = JSON.parse(evento.data)
        const tipo = datos.type ?? datos.tipo
        if (!["new_reading", "nueva_lectura"].includes(tipo)) return
        setUltimaLectura({
          ...datos,
          type: "new_reading",
          recorded_at: datos.recorded_at ?? datos.registrado_en ?? datos.fecha_sync,
          temperature: datos.temperature ?? datos.temperatura ?? datos.temperatura_ambiente,
          outlet_temperature: datos.outlet_temperature
            ?? datos.temperatura_salida_aire
            ?? datos.temperatura_ac,
          humidity: datos.humidity ?? datos.humedad,
          presence: datos.presence ?? datos.presencia ?? datos.estado_ocupacion,
          power_w: datos.power_w ?? datos.potencia_w ?? datos.potencia_activa_w,
          ac_is_on: datos.ac_is_on ?? datos.ac_encendido ?? datos.aire_encendido_atmos,
          setpoint_c: datos.setpoint_c ?? datos.setpoint_ac,
        })
      }

      ws.onclose = (evento) => {
        if (refWs.current === ws) refWs.current = null
        if (!activo) return
        setEstaConectado(false)
        if (evento.code === 1008) {
          setReconectando(false)
          console.error("[WS ROOMS] sesión rechazada; no se reintentará hasta renovar la autenticación")
          return
        }
        const indice = Math.min(intentoReconexion.current, RETRASOS_RECONEXION.length - 1)
        const retraso = RETRASOS_RECONEXION[indice]
        intentoReconexion.current += 1
        setReconectando(true)
        timeoutReconexion.current = setTimeout(conectar, retraso)
      }

      ws.onerror = () => {
        if (ws.readyState < WebSocket.CLOSING) ws.close()
      }
    }

    conectar()

    return () => {
      activo = false
      clearTimeout(timeoutReconexion.current)
      const ws = refWs.current
      refWs.current = null
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        ws.close()
      }
    }
  }, [idSalon])

  const enviarMensaje = useCallback((mensaje) => {
    if (refWs.current?.readyState === WebSocket.OPEN) {
      refWs.current.send(JSON.stringify(mensaje))
    }
  }, [])

  return { ultimaLectura, estaConectado, reconectando, enviarMensaje }
}
