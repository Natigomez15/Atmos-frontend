import { useEffect, useState, useRef, useCallback } from "react"
import { useLocation }          from "react-router-dom"
import { useQueryClient }       from "@tanstack/react-query"
import Sidebar                  from "./Sidebar"
import Topbar                   from "./Topbar"
import AlertToastContainer      from "../common/AlertToast"
import cliente                  from "../../api/client"
import { modoDemoDashboardActivo } from "../../api/dashboard"
import { WS_BASE_URL }          from "../../constants/config"

const WS_URL_ALERTAS = `${WS_BASE_URL}/ws/alerts`
const RETRASOS_RECONEXION_WS = [3000, 5000, 10000, 20000, 30000]

export default function PageWrapper({ children }) {
  const clienteQuery  = useQueryClient()
  const ubicacion     = useLocation()

  const [sidebarAbierto,  setSidebarAbierto]  = useState(false)
  const [cantidadAlertas, setCantidadAlertas] = useState(0)
  const [wsConectado,     setWsConectado]     = useState(false)
  const [toasts,          setToasts]          = useState([])
  const modoDemoDashboard = modoDemoDashboardActivo()

  const refWs             = useRef(null)
  const timeoutReconexion = useRef(null)
  const intentoReconexion = useRef(0)
  const montado           = useRef(true)

  // Cerrar sidebar al navegar (mobile)
  useEffect(() => {
    setSidebarAbierto(false)
  }, [ubicacion.pathname])

  useEffect(() => {
    document.body.style.overflow = sidebarAbierto ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [sidebarAbierto])

  // ── Toast helpers ────────────────────────────────────────────────────────
  const agregarToast = useCallback((datos) => {
    const nuevoToast = { ...datos, id: `${Date.now()}-${Math.random()}` }
    setToasts(prev => [...prev.slice(-4), nuevoToast])
  }, [])

  const cerrarToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Polling HTTP de respaldo (60s) ───────────────────────────────────────
  useEffect(() => {
    if (modoDemoDashboard) return
    async function obtenerResumen() {
      try {
        const resp = await cliente.get("/alerts/summary")
        if (montado.current) setCantidadAlertas(resp.data?.total_unresolved ?? 0)
      } catch { /* mantener conteo anterior */ }
    }
    obtenerResumen()
    const intervalo = setInterval(obtenerResumen, 60000)
    return () => clearInterval(intervalo)
  }, [modoDemoDashboard])

  // ── WebSocket global ─────────────────────────────────────────────────────
  useEffect(() => {
    if (modoDemoDashboard) return
    montado.current = true

    function conectar() {
      if (!montado.current) return
      clearTimeout(timeoutReconexion.current)

      const ws = new WebSocket(WS_URL_ALERTAS)
      refWs.current = ws

      ws.onopen = () => {
        if (!montado.current) return
        intentoReconexion.current = 0
        setWsConectado(true)
        console.log("[WS ALERTS] conexion establecida")
      }

      ws.onmessage = (evento) => {
        if (!montado.current) return
        try {
          const datos = JSON.parse(evento.data)

          if (datos.type === "new_alert" || datos.type === "alert") {
            const alerta = datos.alert ?? datos
            setCantidadAlertas(prev => prev + 1)
            agregarToast({
              severity:   alerta.severity,
              alert_type: alerta.alert_type,
              message:    alerta.message,
              room_name:  alerta.room_name ?? null,
            })
            clienteQuery.invalidateQueries({ queryKey: ["alertas"] })
            clienteQuery.invalidateQueries({ queryKey: ["resumen-alertas"] })
            clienteQuery.invalidateQueries({ queryKey: ["resumen-tablero"] })
            clienteQuery.invalidateQueries({ queryKey: ["alertas-recientes"] })
          }
          if (datos.type === "alert_resolved") {
            setCantidadAlertas(prev => Math.max(0, prev - 1))
            clienteQuery.invalidateQueries({ queryKey: ["alertas"] })
            clienteQuery.invalidateQueries({ queryKey: ["resumen-alertas"] })
          }
          if (datos.type === "summary_update") {
            setCantidadAlertas(datos.total_unresolved ?? 0)
          }
        } catch { /* no JSON */ }
      }

      ws.onerror  = () => {
        if (montado.current) setWsConectado(false)
      }
      ws.onclose  = (evento) => {
        if (!montado.current) return
        setWsConectado(false)
        const indice = Math.min(intentoReconexion.current, RETRASOS_RECONEXION_WS.length - 1)
        const retraso = RETRASOS_RECONEXION_WS[indice]
        intentoReconexion.current += 1
        console.warn(
          `[WS ALERTS] conexion cerrada (${evento.code || "sin codigo"}), reintentando en ${retraso / 1000}s`
        )
        timeoutReconexion.current = setTimeout(conectar, retraso)
      }
    }

    conectar()

    return () => {
      montado.current = false
      clearTimeout(timeoutReconexion.current)
      if (refWs.current) { refWs.current.onclose = null; refWs.current.close() }
    }
  }, [clienteQuery, agregarToast, modoDemoDashboard])

  return (
    <div className="h-screen overflow-hidden flex bg-white">
      <Sidebar
        cantidadAlertas={cantidadAlertas}
        estaAbierto={sidebarAbierto}
        alCerrar={() => setSidebarAbierto(false)}
      />

      {/* Contenido principal — desplazado por el sidebar fijo */}
      <div className="flex-1 flex flex-col md:ml-16 lg:ml-60 transition-all duration-300 min-w-0 min-h-0">
        <Topbar
          cantidadAlertas={cantidadAlertas}
          wsConectado={wsConectado}
          alAbrirMenu={() => setSidebarAbierto(true)}
        />

        {/* mt-14 compensa el topbar fijo de h-14 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 mt-14 min-h-0 bg-white">
          {children}
        </main>
      </div>

      <AlertToastContainer toasts={toasts} alCerrar={cerrarToast} />
    </div>
  )
}
