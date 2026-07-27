import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import AtmosIAWorkspace from "../components/atmos-ia/AtmosIAWorkspace"
import PageWrapper from "../components/layout/PageWrapper"
import useAtmosVoice from "../hooks/useAtmosVoice"

const API_BASE = import.meta.env.VITE_ATMOS_IA_API_URL || "http://127.0.0.1:8000"
const INTERVALO_PANEL_MS = 15000

function obtenerConversationId() {
  const clave = "atmos_conversation_id"
  let valor = sessionStorage.getItem(clave)
  if (!valor) {
    valor = window.crypto?.randomUUID?.() || `atmos-${Date.now()}-${Math.random().toString(16).slice(2)}`
    sessionStorage.setItem(clave, valor)
  }
  return valor
}

function temperaturaAccion(accion) {
  if (accion === "encender_22") return 22
  if (accion === "ahorro_24") return 24
  return null
}

export default function AtmosIAPage() {
  const conversationId = useMemo(() => obtenerConversationId(), [])
  const [mensajes, setMensajes] = useState([{
    tipo: "atmos",
    texto: "Hola. Soy ATMOS IA. Puedo consultar el estado real del Aire 1, analizar sus condiciones y ayudarte a controlarlo de forma segura.",
  }])
  const [entrada, setEntrada] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [ordenPendiente, setOrdenPendiente] = useState(null)
  const [comando, setComando] = useState(null)
  const [verificacion, setVerificacion] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargandoPaneles, setCargandoPaneles] = useState(false)
  const chatRef = useRef(null)

  const agregarMensaje = useCallback((texto, tipo = "atmos") => {
    setMensajes(actuales => [...actuales, { tipo, texto }])
  }, [])

  const fetchJson = useCallback(async (ruta, opciones = {}) => {
    const respuesta = await fetch(`${API_BASE}${ruta}`, { cache: "no-store", ...opciones })
    if (!respuesta.ok) {
      let detalle = `Código ${respuesta.status}`
      try {
        const error = await respuesta.json()
        detalle = error.detail || detalle
      } catch {
        // Conserva el código HTTP si el cuerpo no es JSON.
      }
      throw new Error(detalle)
    }
    return respuesta.json()
  }, [])

  const refrescarPaneles = useCallback(async () => {
    setCargandoPaneles(true)
    const resultados = await Promise.allSettled([
      fetchJson("/api/health"),
      fetchJson("/api/comandos/aire-1/estado"),
      fetchJson("/api/comandos/aire-1/verificacion"),
      fetchJson("/api/comandos/aire-1/historial?limite=6"),
    ])

    const [salud, estadoComando, verificacionFisica, ordenes] = resultados
    if (salud.status === "fulfilled") {
      setConectado(true)
    } else {
      setConectado(false)
    }
    if (estadoComando.status === "fulfilled") setComando(estadoComando.value)
    if (verificacionFisica.status === "fulfilled") setVerificacion(verificacionFisica.value)
    if (ordenes.status === "fulfilled") {
      setHistorial(Array.isArray(ordenes.value?.historial) ? ordenes.value.historial : [])
    }
    setCargandoPaneles(false)
  }, [fetchJson])

  const consultarAtmos = useCallback((mensaje, confirmarControl = false, origen = "texto") => (
    fetchJson("/api/asistente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensaje,
        aire_id: "robotica_aire_1",
        confirmar_control: confirmarControl,
        origen,
        conversation_id: conversationId,
      }),
    })
  ), [conversationId, fetchJson])

  const {
    disponible: vozDisponible,
    grabando,
    transcribiendo,
    hablando,
    iniciarGrabacion,
    detenerGrabacion,
    hablar,
  } = useAtmosVoice({
    onTextoReconocido: texto => enviarMensaje(texto, "voz"),
    onError: mensaje => agregarMensaje(mensaje),
  })

  async function enviarMensaje(textoManual = null, origenManual = null) {
    const texto = String(textoManual ?? entrada).trim()
    if (!texto || procesando) return
    agregarMensaje(texto, "usuario")
    setEntrada("")
    setProcesando(true)
    try {
      const origen = origenManual || (textoManual ? "boton" : "texto")
      const datos = await consultarAtmos(texto, false, origen)
      agregarMensaje(datos.respuesta)
      if (datos.requiere_confirmacion_control === true) {
        setOrdenPendiente({ mensaje: texto, datos, origen })
      }
      await refrescarPaneles()
      if (origen === "voz") await hablar(datos.respuesta)
    } catch {
      agregarMensaje("No pude comunicarme con el backend de ATMOS IA. Verifica que el servidor esté encendido.")
      setConectado(false)
    } finally {
      setProcesando(false)
    }
  }

  async function confirmarOrden() {
    if (!ordenPendiente || procesando) return
    const pendiente = ordenPendiente
    setOrdenPendiente(null)
    setProcesando(true)
    try {
      const datos = await consultarAtmos(pendiente.mensaje, true, pendiente.origen || "texto")
      agregarMensaje(datos.respuesta)
      await refrescarPaneles()
      if (pendiente.origen === "voz") await hablar(datos.respuesta)
    } catch {
      agregarMensaje("No pude confirmar la orden. No se enviará ningún comando.")
    } finally {
      setProcesando(false)
    }
  }

  async function cancelarOrden() {
    const pendiente = ordenPendiente
    setOrdenPendiente(null)
    if (pendiente) {
      try {
        await fetchJson("/api/comandos/aire-1/historial/cancelar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frase_usuario: pendiente.mensaje,
            accion: pendiente.datos.accion_propuesta || "accion_cancelada",
            descripcion_accion: pendiente.datos.descripcion_accion || "Orden cancelada",
            origen: pendiente.origen || "texto",
            confianza_ia: pendiente.datos.confianza_ia ?? null,
            temperatura: temperaturaAccion(pendiente.datos.accion_propuesta),
          }),
        })
      } catch {
        // La cancelación visual se conserva aunque el historial no esté disponible.
      }
    }
    agregarMensaje("Orden cancelada. No se envió ningún comando al aire acondicionado.")
    await refrescarPaneles()
  }

  useEffect(() => {
    const inicio = window.setTimeout(() => {
      refrescarPaneles()
    }, 0)
    const intervalo = window.setInterval(refrescarPaneles, INTERVALO_PANEL_MS)
    return () => {
      window.clearTimeout(inicio)
      window.clearInterval(intervalo)
    }
  }, [refrescarPaneles])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [mensajes, procesando, transcribiendo])

  return (
    <PageWrapper>
      <AtmosIAWorkspace
        conectado={conectado}
        cargandoPaneles={cargandoPaneles}
        alActualizar={refrescarPaneles}
        mensajes={mensajes}
        entrada={entrada}
        alCambiarEntrada={setEntrada}
        alEnviar={enviarMensaje}
        chatRef={chatRef}
        procesando={procesando}
        transcribiendo={transcribiendo}
        hablando={hablando}
        grabando={grabando}
        vozDisponible={vozDisponible}
        alIniciarVoz={iniciarGrabacion}
        alDetenerVoz={detenerGrabacion}
        ordenPendiente={ordenPendiente}
        alConfirmar={confirmarOrden}
        alCancelar={cancelarOrden}
        historial={historial}
        verificacion={verificacion}
        comando={comando}
      />
    </PageWrapper>
  )
}
