import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  MdSend,
  MdCircle,
  MdRefresh,
  MdMic,
  MdStop,
  MdMemory,
  MdSecurity,
  MdHistory,
  MdBolt,
  MdThermostat,
  MdSensors,
  MdPowerSettingsNew,
  MdEco,
  MdQueryStats,
  MdCheckCircle,
  MdWarning,
  MdSchedule,
} from "react-icons/md"

import PageWrapper from "../components/layout/PageWrapper"
import PageHeader from "../components/common/PageHeader"
import useAtmosVoice from "../hooks/useAtmosVoice"
import AtmosIAIcon from "../components/atmos-ia/AtmosIAIcon"


const API_BASE =
  import.meta.env.VITE_ATMOS_IA_API_URL ||
  "http://127.0.0.1:8000"

const INTERVALO_PANEL_MS = 15000


const MAPA_ACCIONES = {
  encender_22: "Encender en 22 °C",
  ahorro_24: "Modo ahorro a 24 °C",
  apagar: "Apagar aire",
}

const MAPA_ESTADOS_COMANDO = {
  pendiente: "Pendiente",
  recibido_por_esp32: "Recibido por ESP32",
  ejecutando: "Ejecutando",
  senal_ir_enviada: "Señal IR enviada",
  verificado: "Verificado",
  expirado: "Expirado",
  accion_no_reconocida: "Acción no reconocida",
  error: "Error",
  desconocido: "Desconocido",
  prueba_sin_escritura: "Prueba · sin escritura",
  cancelado: "Cancelado",
}

const MAPA_ORIGENES = {
  modelo_ml: "Modelo ML",
  atmos_ia: "ATMOS IA",
  texto: "Texto",
  voz: "Voz",
  boton: "Botón",
}

const MAPA_VERIFICACION = {
  esperando_senal_ir: "Esperando señal IR",
  verificando: "Verificando respuesta",
  evidencia_compatible: "Evidencia compatible",
  inconcluso: "Resultado inconcluso",
  respuesta_no_observada: "Respuesta no observada",
  sin_datos_suficientes: "Datos insuficientes",
}

const MAPA_NIVEL_EVIDENCIA = {
  fuerte: "Fuerte",
  moderada: "Moderada",
  debil: "Débil",
  insuficiente: "Insuficiente",
}


function obtenerConversationId() {
  const clave = "atmos_conversation_id"
  let valor = sessionStorage.getItem(clave)

  if (!valor) {
    valor =
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `atmos-${Date.now()}-${Math.random().toString(16).slice(2)}`

    sessionStorage.setItem(clave, valor)
  }

  return valor
}


function numero(valor, decimales = 1) {
  const n = Number(valor)

  if (!Number.isFinite(n)) {
    return "—"
  }

  return n.toFixed(decimales)
}


function fechaLocal(valor) {
  if (!valor) {
    return "—"
  }

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return "—"
  }

  return fecha.toLocaleString("es-PA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}


function tiempoDesde(segundos) {
  const s = Number(segundos)

  if (!Number.isFinite(s) || s < 0) {
    return "—"
  }

  if (s < 60) {
    return `hace ${Math.max(1, Math.round(s))}s`
  }

  if (s < 3600) {
    return `hace ${Math.round(s / 60)}m`
  }

  if (s < 86400) {
    return `hace ${Math.round(s / 3600)}h`
  }

  return `hace ${Math.round(s / 86400)}d`
}


function temperaturaAccion(accion) {
  if (accion === "encender_22") return 22
  if (accion === "ahorro_24") return 24
  return null
}


function claseEstadoVerificacion(estado) {
  if (estado === "evidencia_compatible") {
    return "bg-success/10 text-success border-success/20"
  }

  if (
    estado === "verificando" ||
    estado === "esperando_senal_ir"
  ) {
    return "bg-warning/10 text-warning border-warning/20"
  }

  if (estado === "respuesta_no_observada") {
    return "bg-danger/10 text-danger border-danger/20"
  }

  return "bg-gray-100 text-muted border-gray-200"
}


function Mensaje({ tipo, texto }) {
  const esUsuario = tipo === "usuario"

  return (
    <div className={`flex ${esUsuario ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[86%] sm:max-w-[76%]
          px-4 py-3 rounded-2xl
          text-sm leading-6 whitespace-pre-wrap
          ${
            esUsuario
              ? "bg-primary text-white rounded-br-md"
              : "bg-white border border-gray-100 text-dark rounded-bl-md shadow-sm"
          }
        `}
      >
        {texto}
      </div>
    </div>
  )
}


function FilaDato({ etiqueta, valor, valorClase = "text-dark" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
      <span className="text-xs text-muted">
        {etiqueta}
      </span>

      <strong className={`text-xs text-right ${valorClase}`}>
        {valor ?? "—"}
      </strong>
    </div>
  )
}


function Tarjeta({ eyebrow, titulo, descripcion, icono, children, className = "" }) {
  return (
    <section
      className={`
        rounded-2xl border border-gray-100 bg-white
        p-5 shadow-sm
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted">
              {eyebrow}
            </p>
          )}

          <h3 className="mt-1 text-lg font-semibold text-dark">
            {titulo}
          </h3>

          {descripcion && (
            <p className="mt-1 text-sm leading-5 text-muted">
              {descripcion}
            </p>
          )}
        </div>

        {icono && (
          <span className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            {icono}
          </span>
        )}
      </div>

      <div className="mt-4">
        {children}
      </div>
    </section>
  )
}


function IndicadorEstado({ conectado }) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        rounded-full text-xs font-semibold
        ${
          conectado
            ? "bg-success/10 text-success"
            : "bg-danger/10 text-danger"
        }
      `}
    >
      <MdCircle size={8} />

      {conectado
        ? "ATMOS IA conectado"
        : "ATMOS IA desconectado"}
    </div>
  )
}


export default function AtmosIAPage() {
  const conversationId = useMemo(
    () => obtenerConversationId(),
    []
  )

  const [mensajes, setMensajes] = useState([
    {
      tipo: "atmos",
      texto:
        "Hola. Soy ATMOS IA. Puedo consultar los datos reales del Aire 1, analizar consumo, presencia, estado del equipo y ayudarte con la gestión inteligente del laboratorio.",
    },
  ])

  const [entrada, setEntrada] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [ordenPendiente, setOrdenPendiente] = useState(null)

  const [health, setHealth] = useState(null)
  const [aire, setAire] = useState(null)
  const [esp32, setEsp32] = useState(null)
  const [comando, setComando] = useState(null)
  const [verificacion, setVerificacion] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargandoPaneles, setCargandoPaneles] = useState(false)

  const [consumoHistorico, setConsumoHistorico] = useState(null)
  const [periodoConsumo, setPeriodoConsumo] = useState(null)
  const [cargandoConsumo, setCargandoConsumo] = useState(false)

  const chatRef = useRef(null)


  const agregarMensaje = useCallback((texto, tipo = "atmos") => {
    setMensajes((actuales) => [
      ...actuales,
      { tipo, texto },
    ])
  }, [])


  async function fetchJson(ruta, opciones = {}) {
    const respuesta = await fetch(
      `${API_BASE}${ruta}`,
      {
        cache: "no-store",
        ...opciones,
      }
    )

    if (!respuesta.ok) {
      let detalle = `Código ${respuesta.status}`

      try {
        const error = await respuesta.json()
        detalle = error.detail || detalle
      } catch {
        // Conserva el código HTTP.
      }

      throw new Error(detalle)
    }

    return respuesta.json()
  }


  const refrescarPaneles = useCallback(async () => {
    setCargandoPaneles(true)

    const resultados = await Promise.allSettled([
      fetchJson("/api/health"),
      fetchJson("/api/firebase/aire-1"),
      fetchJson("/api/dispositivos/aire-1/estado"),
      fetchJson("/api/comandos/aire-1/estado"),
      fetchJson("/api/comandos/aire-1/verificacion"),
      fetchJson("/api/comandos/aire-1/historial?limite=6"),
    ])

    const [
      healthResult,
      aireResult,
      esp32Result,
      comandoResult,
      verificacionResult,
      historialResult,
    ] = resultados

    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value)
      setConectado(true)
    } else {
      setConectado(false)
    }

    if (aireResult.status === "fulfilled") {
      setAire(aireResult.value)
    }

    if (esp32Result.status === "fulfilled") {
      setEsp32(esp32Result.value)
    }

    if (comandoResult.status === "fulfilled") {
      setComando(comandoResult.value)
    }

    if (verificacionResult.status === "fulfilled") {
      setVerificacion(verificacionResult.value)
    }

    if (historialResult.status === "fulfilled") {
      setHistorial(
        Array.isArray(historialResult.value?.historial)
          ? historialResult.value.historial
          : []
      )
    }

    setCargandoPaneles(false)
  }, [])


  async function consultarAtmos(
    mensaje,
    confirmarControl = false,
    origen = "texto"
  ) {
    return fetchJson(
      "/api/asistente",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje,
          aire_id: "robotica_aire_1",
          confirmar_control: confirmarControl,
          origen,
          conversation_id: conversationId,
        }),
      }
    )
  }


  async function enviarMensaje(
    textoManual = null,
    origenManual = null
  ) {
    const texto = String(
      textoManual ?? entrada
    ).trim()

    if (!texto || procesando) {
      return
    }

    agregarMensaje(texto, "usuario")
    setEntrada("")
    setProcesando(true)

    try {
      const origen =
        origenManual ||
        (textoManual ? "boton" : "texto")

      const datos =
        await consultarAtmos(
          texto,
          false,
          origen
        )

      agregarMensaje(
        datos.respuesta,
        "atmos"
      )

      if (
        datos.requiere_confirmacion_control ===
        true
      ) {
        setOrdenPendiente({
          mensaje: texto,
          datos,
          origen,
        })
      }

      setProcesando(false)

      await refrescarPaneles()

      if (origen === "voz") {
        await hablar(
          datos.respuesta
        )
      }
    } catch (error) {
      console.error(error)

      agregarMensaje(
        "No pude comunicarme con el backend de ATMOS IA. Verifica que el servidor esté encendido.",
        "atmos"
      )

      setConectado(false)
      setProcesando(false)
    }
  }


  const {
    disponible: vozDisponible,
    grabando,
    transcribiendo,
    hablando,
    iniciarGrabacion,
    detenerGrabacion,
    hablar,
  } = useAtmosVoice({
    onTextoReconocido: async (texto) => {
      await enviarMensaje(
        texto,
        "voz"
      )
    },

    onError: (mensaje) => {
      agregarMensaje(
        mensaje,
        "atmos"
      )
    },
  })


  useEffect(() => {
    refrescarPaneles()

    const intervalo = window.setInterval(
      refrescarPaneles,
      INTERVALO_PANEL_MS
    )

    return () => {
      window.clearInterval(intervalo)
    }
  }, [refrescarPaneles])


  useEffect(() => {
    if (!chatRef.current) {
      return
    }

    chatRef.current.scrollTop =
      chatRef.current.scrollHeight
  }, [
    mensajes,
    procesando,
    transcribiendo,
  ])


  async function confirmarOrden() {
    if (
      !ordenPendiente ||
      procesando
    ) {
      return
    }

    const pendiente =
      ordenPendiente

    setOrdenPendiente(null)
    setProcesando(true)

    try {
      const datos =
        await consultarAtmos(
          pendiente.mensaje,
          true,
          pendiente.origen || "texto"
        )

      agregarMensaje(
        datos.respuesta,
        "atmos"
      )

      setProcesando(false)

      await refrescarPaneles()

      if (
        pendiente.origen === "voz"
      ) {
        await hablar(
          datos.respuesta
        )
      }
    } catch (error) {
      console.error(error)

      agregarMensaje(
        "No pude confirmar la orden. No se enviará ningún comando.",
        "atmos"
      )

      setProcesando(false)
    }
  }


  async function cancelarOrden() {
    const pendiente =
      ordenPendiente

    setOrdenPendiente(null)

    if (pendiente) {
      try {
        await fetchJson(
          "/api/comandos/aire-1/historial/cancelar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              frase_usuario:
                pendiente.mensaje,
              accion:
                pendiente.datos.accion_propuesta ||
                "accion_cancelada",
              descripcion_accion:
                pendiente.datos.descripcion_accion ||
                "Orden cancelada",
              origen:
                pendiente.origen ||
                "texto",
              confianza_ia:
                pendiente.datos.confianza_ia ??
                null,
              temperatura:
                temperaturaAccion(
                  pendiente.datos.accion_propuesta
                ),
            }),
          }
        )
      } catch (error) {
        console.warn(
          "No se pudo registrar la cancelación:",
          error
        )
      }
    }

    agregarMensaje(
      "Orden cancelada. No se envió ningún comando al aire acondicionado.",
      "atmos"
    )

    await refrescarPaneles()
  }


  async function consultarConsumo(periodo) {
    setPeriodoConsumo(periodo)
    setCargandoConsumo(true)

    try {
      const datos =
        await fetchJson(
          `/api/historico/consumo?periodo=${periodo}`
        )

      setConsumoHistorico(datos)
    } catch (error) {
      console.error(error)

      setConsumoHistorico({
        error: true,
        etiqueta: "Consulta histórica",
        mensaje:
          "No se pudo consultar el consumo histórico.",
      })
    } finally {
      setCargandoConsumo(false)
    }
  }


  function manejarSubmit(evento) {
    evento.preventDefault()
    enviarMensaje()
  }


  const ocupado =
    procesando ||
    transcribiendo ||
    hablando

  const controlReal =
    Boolean(
      health?.control_real_activo
    )

  const esp32Conectado =
    Boolean(
      esp32?.esp32_conectado
    )

  const ultimaFechaComando =
    comando?.actualizado_en ||
    comando?.created_at

  const antes =
    verificacion?.antes || {}

  const despues =
    verificacion?.despues || {}

  const cambios =
    verificacion?.cambios || {}


  return (
    <PageWrapper>

      {/* ===================================================
          CABECERA
      =================================================== */}

      <div className="mb-5">
        <PageHeader
          eyebrow="Asistente inteligente"
          title="ATMOS IA"
          description="Asistente conversacional, monitoreo real, análisis energético y control seguro del Aire 1."
          actions={
            <div className="flex items-center gap-2">
              <IndicadorEstado
                conectado={conectado}
              />

              <button
                type="button"
                onClick={refrescarPaneles}
                disabled={cargandoPaneles}
                className="btn-secondary"
                title="Actualizar datos"
              >
                <MdRefresh
                  size={17}
                  className={
                    cargandoPaneles
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>
          }
        />
      </div>


      {/* ===================================================
          CHAT + ESTADO PRINCIPAL
      =================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.55fr)_360px] gap-4 mb-4">

        {/* CHAT */}

        <section
          className="
            bg-white border border-gray-100 rounded-2xl
            shadow-sm overflow-hidden flex flex-col min-h-[610px]
          "
        >
          <div
            className="
              px-5 py-4 border-b border-gray-100
              flex items-center gap-3
            "
          >
            <div
              className="
                w-11 h-11 rounded-xl
                bg-secondary/10 text-secondary
                flex items-center justify-center
              "
            >
              <AtmosIAIcon size={24} />
            </div>

            <div>
              <p className="font-semibold text-dark">
                ATMOS IA
              </p>

              <p className="text-xs text-muted mt-0.5">
                Aire 1 · Laboratorio de Robótica
              </p>
            </div>
          </div>


          <div
            ref={chatRef}
            className="
              flex-1 overflow-y-auto bg-gray-50/70
              px-4 sm:px-6 py-5 space-y-4
              min-h-[410px] max-h-[500px]
            "
          >
            {mensajes.map(
              (mensaje, indice) => (
                <Mensaje
                  key={indice}
                  tipo={mensaje.tipo}
                  texto={mensaje.texto}
                />
              )
            )}

            {(procesando || transcribiendo) && (
              <div className="flex justify-start">
                <div
                  className="
                    bg-white border border-gray-100
                    rounded-2xl rounded-bl-md
                    px-4 py-3 shadow-sm
                  "
                >
                  <p className="text-xs text-muted">
                    {transcribiendo
                      ? "Transcribiendo tu voz..."
                      : "ATMOS está procesando la consulta..."}
                  </p>
                </div>
              </div>
            )}
          </div>


          {ordenPendiente && (
            <div
              className="
                mx-4 sm:mx-6 mt-4 rounded-xl
                border border-warning/30
                bg-warning/5 px-4 py-3
              "
            >
              <p className="text-xs font-semibold text-warning">
                Confirmación requerida
              </p>

              <p className="text-sm text-dark mt-1">
                {ordenPendiente
                  .datos
                  .descripcion_accion ||
                  "Orden de control"}
              </p>

              <p className="mt-1 text-xs text-muted">
                ATMOS nunca ejecuta una orden física desde la primera petición.
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={cancelarOrden}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarOrden}
                  className="btn-primary text-xs"
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}


          <form
            onSubmit={manejarSubmit}
            className="border-t border-gray-100 bg-white p-4"
          >
            <div
              className="
                flex items-center gap-2 border border-gray-200
                rounded-xl px-2 bg-white
                focus-within:border-secondary
                focus-within:ring-2
                focus-within:ring-secondary/10
                transition-all
              "
            >
              <input
                type="text"
                value={entrada}
                onChange={(evento) =>
                  setEntrada(
                    evento.target.value
                  )
                }
                disabled={ocupado || grabando}
                placeholder={
                  grabando
                    ? "ATMOS está escuchando..."
                    : transcribiendo
                      ? "Transcribiendo..."
                      : "Pregúntale algo a ATMOS..."
                }
                className="
                  flex-1 h-12 px-2 outline-none
                  bg-transparent text-sm text-dark
                  placeholder:text-muted
                "
              />

              <button
                type="button"
                onClick={
                  grabando
                    ? detenerGrabacion
                    : iniciarGrabacion
                }
                disabled={
                  ocupado ||
                  !vozDisponible
                }
                title={
                  grabando
                    ? "Detener grabación"
                    : "Hablar con ATMOS"
                }
                className={`
                  w-10 h-10 rounded-xl
                  flex items-center justify-center
                  transition-all
                  ${
                    grabando
                      ? "bg-danger text-white animate-pulse"
                      : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                  }
                  disabled:opacity-40
                `}
              >
                {grabando
                  ? <MdStop size={20} />
                  : <MdMic size={20} />}
              </button>

              <button
                type="submit"
                disabled={
                  ocupado ||
                  grabando ||
                  !entrada.trim()
                }
                className="
                  w-10 h-10 rounded-xl
                  bg-primary text-white
                  flex items-center justify-center
                  hover:bg-primary/90
                  disabled:opacity-40
                  transition-all
                "
              >
                <MdSend size={18} />
              </button>
            </div>

            <p className="mt-2 text-[10px] text-muted px-1">
              {grabando
                ? "Habla con normalidad; ATMOS se detendrá al detectar silencio."
                : hablando
                  ? "ATMOS está respondiendo por voz."
                  : "Puedes escribir o usar el micrófono."}
            </p>
          </form>
        </section>


        {/* PANEL SUPERIOR DERECHO */}

        <div className="flex flex-col gap-4">

          <Tarjeta
            eyebrow="Estado de control"
            titulo={
              controlReal
                ? "Control real activo"
                : "Modo seguro"
            }
            descripcion={
              controlReal
                ? "Las órdenes confirmadas pueden escribirse en Firebase."
                : "ATMOS interpreta y prepara las órdenes, pero no modifica Firebase."
            }
            icono={<MdSecurity size={20} />}
          >
            <div
              className={`
                inline-flex px-3 py-1.5 rounded-full
                text-[10px] font-bold uppercase tracking-wide
                ${
                  controlReal
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }
              `}
            >
              {controlReal
                ? "Escritura habilitada"
                : "Sin escritura"}
            </div>
          </Tarjeta>


          <Tarjeta
            eyebrow="Dispositivo físico"
            titulo="ESP32 · Aire 1"
            descripcion={
              esp32Conectado
                ? "El dispositivo está enviando lecturas recientes a Firebase y puede recibir nuevas órdenes."
                : "No se detecta comunicación reciente del ESP32."
            }
            icono={<MdMemory size={20} />}
          >
            <div
              className={`
                inline-flex items-center gap-2
                text-xs font-semibold
                ${
                  esp32Conectado
                    ? "text-success"
                    : "text-danger"
                }
              `}
            >
              <span
                className={`
                  w-2.5 h-2.5 rounded-full
                  ${
                    esp32Conectado
                      ? "bg-success"
                      : "bg-danger"
                  }
                `}
              />

              {esp32Conectado
                ? "ESP32 conectado"
                : "ESP32 desconectado"}
            </div>

            <div className="grid gap-2 mt-4">
              <FilaDato
                etiqueta="Última comunicación"
                valor={
                  tiempoDesde(
                    esp32?.segundos_desde_ultima_comunicacion
                  )
                }
              />

              <FilaDato
                etiqueta="Estado"
                valor={
                  esp32?.estado_esp32 === "conectado"
                    ? "Conectado"
                    : esp32?.estado_esp32 || "—"
                }
              />
            </div>
          </Tarjeta>


          <Tarjeta
            eyebrow="Datos reales"
            titulo="Aire 1 · Laboratorio de Robótica"
            icono={<MdSensors size={20} />}
          >
            <div className="grid gap-2">
              <FilaDato
                etiqueta="Estado"
                valor={
                  aire?.estado || "—"
                }
              />

              <FilaDato
                etiqueta="Temperatura ambiente"
                valor={
                  aire?.temperatura_ambiente != null
                    ? `${numero(aire.temperatura_ambiente, 1)} °C`
                    : "—"
                }
              />

              <FilaDato
                etiqueta="Humedad"
                valor={
                  aire?.humedad != null
                    ? `${numero(aire.humedad, 1)} %`
                    : "—"
                }
              />

              <FilaDato
                etiqueta="Presencia"
                valor={
                  aire
                    ? aire.presencia
                      ? "Detectada"
                      : "No detectada"
                    : "—"
                }
              />

              <FilaDato
                etiqueta="Potencia"
                valor={
                  aire?.potencia_w != null
                    ? `${numero(aire.potencia_w, 1)} W`
                    : "—"
                }
              />
            </div>
          </Tarjeta>

        </div>
      </div>


      {/* ===================================================
          ÚLTIMO COMANDO + VERIFICACIÓN
      =================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

        <Tarjeta
          eyebrow="Último comando"
          titulo="Estado del comando"
          icono={<MdSchedule size={20} />}
        >
          {comando?.hay_comando ? (
            <>
              <div className="grid gap-2">
                <FilaDato
                  etiqueta="Acción"
                  valor={
                    MAPA_ACCIONES[
                      comando.accion
                    ] ||
                    comando.accion ||
                    "—"
                  }
                />

                <FilaDato
                  etiqueta="Estado"
                  valor={
                    MAPA_ESTADOS_COMANDO[
                      comando.estado_normalizado
                    ] ||
                    comando.estado_normalizado ||
                    "—"
                  }
                />

                <FilaDato
                  etiqueta="Temperatura"
                  valor={
                    comando.temperatura_ejecutada != null
                      ? `${comando.temperatura_ejecutada} °C`
                      : comando.temperatura_solicitada != null
                        ? `${comando.temperatura_solicitada} °C`
                        : comando.accion === "apagar"
                          ? "0 °C"
                          : "—"
                  }
                />

                <FilaDato
                  etiqueta="Origen"
                  valor={
                    MAPA_ORIGENES[
                      comando.origen
                    ] ||
                    comando.origen ||
                    "—"
                  }
                />

                <FilaDato
                  etiqueta="Actualizado"
                  valor={
                    fechaLocal(
                      ultimaFechaComando
                    )
                  }
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-muted">
                {comando.mensaje_estado || "—"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              No existe un comando registrado.
            </p>
          )}
        </Tarjeta>


        <Tarjeta
          eyebrow="Verificación física"
          titulo="Respuesta del equipo"
          descripcion="ATMOS compara las mediciones reales antes y después del último comando sin modificar Firebase."
          icono={<MdQueryStats size={20} />}
        >
          <div
            className={`
              inline-flex items-center gap-2
              border rounded-full
              px-3 py-1.5
              text-xs font-semibold
              ${claseEstadoVerificacion(
                verificacion?.estado_verificacion
              )}
            `}
          >
            {verificacion?.estado_verificacion === "evidencia_compatible"
              ? <MdCheckCircle size={15} />
              : <MdWarning size={15} />}

            {MAPA_VERIFICACION[
              verificacion?.estado_verificacion
            ] || "Sin verificación"}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            <FilaDato
              etiqueta="Nivel de evidencia"
              valor={
                MAPA_NIVEL_EVIDENCIA[
                  verificacion?.nivel_evidencia
                ] ||
                "—"
              }
            />

            <FilaDato
              etiqueta="Tipo de comando"
              valor={
                verificacion?.comando_reciente
                  ? "Reciente"
                  : "Histórico"
              }
            />
          </div>

          <div className="grid md:grid-cols-3 gap-2 mt-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-muted">
                Potencia
              </p>

              <p className="mt-1 text-xs font-semibold text-dark">
                {antes.potencia_w != null && despues.potencia_w != null
                  ? `${numero(antes.potencia_w, 1)} W → ${numero(despues.potencia_w, 1)} W`
                  : "—"}
              </p>

              {cambios.potencia_w != null && (
                <p className="mt-1 text-[10px] text-muted">
                  Cambio: {numero(cambios.potencia_w, 1)} W
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-muted">
                Corriente
              </p>

              <p className="mt-1 text-xs font-semibold text-dark">
                {antes.corriente_a != null && despues.corriente_a != null
                  ? `${numero(antes.corriente_a, 2)} A → ${numero(despues.corriente_a, 2)} A`
                  : "—"}
              </p>

              {cambios.corriente_a != null && (
                <p className="mt-1 text-[10px] text-muted">
                  Cambio: {numero(cambios.corriente_a, 2)} A
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-muted">
                Diferencia térmica
              </p>

              <p className="mt-1 text-xs font-semibold text-dark">
                {antes.delta_termico_c != null && despues.delta_termico_c != null
                  ? `${numero(antes.delta_termico_c, 2)} °C → ${numero(despues.delta_termico_c, 2)} °C`
                  : "—"}
              </p>

              {cambios.delta_termico_c != null && (
                <p className="mt-1 text-[10px] text-muted">
                  Cambio: {numero(cambios.delta_termico_c, 2)} °C
                </p>
              )}
            </div>
          </div>

          {verificacion?.conclusion && (
            <div className="mt-3 rounded-xl border border-secondary/15 bg-secondary/5 px-3.5 py-3">
              <p className="text-xs leading-5 text-dark">
                {verificacion.conclusion}
              </p>
            </div>
          )}

          {Array.isArray(verificacion?.limitaciones) &&
            verificacion.limitaciones.length > 0 && (
              <div className="mt-2 rounded-xl bg-warning/10 px-3.5 py-3">
                <p className="text-[10px] leading-5 text-warning">
                  <strong>Limitación:</strong>{" "}
                  {verificacion.limitaciones[0]}
                </p>
              </div>
            )}

          {verificacion?.fecha_comando && (
            <p className="mt-3 text-[10px] text-muted">
              {verificacion.comando_reciente
                ? "Comando reciente"
                : "Comando histórico"}{" "}
              · {fechaLocal(verificacion.fecha_comando)}
            </p>
          )}
        </Tarjeta>

      </div>


      {/* ===================================================
          HISTORIAL + CONSUMO HISTÓRICO
      =================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

        <Tarjeta
          eyebrow="Historial de control"
          titulo="Órdenes recientes"
          descripcion="Registro de órdenes confirmadas, pruebas en modo seguro y cancelaciones."
          icono={<MdHistory size={20} />}
        >
          <div className="grid gap-2">
            {historial.length === 0 ? (
              <div className="rounded-xl bg-gray-50 px-4 py-5 text-center text-sm text-muted">
                Todavía no hay órdenes registradas.
              </div>
            ) : (
              historial.map((item, indice) => (
                <div
                  key={
                    item.evento_id ||
                    item.command_id ||
                    indice
                  }
                  className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-dark">
                        {item.descripcion_accion ||
                          MAPA_ACCIONES[item.accion] ||
                          item.accion ||
                          "Orden ATMOS"}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                        <span>
                          {MAPA_ORIGENES[item.origen] ||
                            item.origen ||
                            "ATMOS"}
                        </span>

                        {item.temperatura != null && (
                          <span>
                            {item.temperatura} °C
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-muted whitespace-nowrap">
                      {fechaLocal(item.fecha)}
                    </span>
                  </div>

                  <span
                    className={`
                      mt-2 inline-flex rounded-full px-2.5 py-1
                      text-[9px] font-semibold
                      ${
                        item.estado === "senal_ir_enviada"
                          ? "bg-success/10 text-success"
                          : item.estado === "prueba_sin_escritura"
                            ? "bg-warning/10 text-warning"
                            : item.estado === "cancelado"
                              ? "bg-gray-200 text-muted"
                              : "bg-secondary/10 text-secondary"
                      }
                    `}
                  >
                    {MAPA_ESTADOS_COMANDO[item.estado] ||
                      item.estado ||
                      "Registrado"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Tarjeta>


        <Tarjeta
          eyebrow="Análisis energético"
          titulo="Consumo histórico"
          descripcion="Consulta el consumo estimado a partir de las lecturas reales almacenadas en Firebase."
          icono={<MdBolt size={20} />}
        >
          <div className="grid sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                consultarConsumo("hoy")
              }
              disabled={cargandoConsumo}
              className="
                rounded-xl border border-gray-200
                px-3 py-3 text-xs font-semibold text-dark
                hover:border-secondary/40 hover:bg-secondary/5
                transition-all disabled:opacity-50
              "
            >
              Consumo de hoy
            </button>

            <button
              type="button"
              onClick={() =>
                consultarConsumo("ayer")
              }
              disabled={cargandoConsumo}
              className="
                rounded-xl border border-gray-200
                px-3 py-3 text-xs font-semibold text-dark
                hover:border-secondary/40 hover:bg-secondary/5
                transition-all disabled:opacity-50
              "
            >
              Consumo de ayer
            </button>

            <button
              type="button"
              onClick={() =>
                consultarConsumo("esta_semana")
              }
              disabled={cargandoConsumo}
              className="
                rounded-xl border border-gray-200
                px-3 py-3 text-xs font-semibold text-dark
                hover:border-secondary/40 hover:bg-secondary/5
                transition-all disabled:opacity-50
              "
            >
              Esta semana
            </button>
          </div>

          {cargandoConsumo && (
            <div className="mt-3 rounded-xl bg-gray-50 p-4 text-xs text-muted">
              Calculando consumo histórico...
            </div>
          )}

          {!cargandoConsumo &&
            consumoHistorico &&
            !consumoHistorico.error && (
              <div className="mt-3 rounded-xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">
                      {consumoHistorico.etiqueta ||
                        periodoConsumo}
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-dark">
                      {numero(
                        consumoHistorico.energia_kwh,
                        2
                      )}{" "}
                      <span className="text-sm font-normal text-muted">
                        kWh
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted">
                      Costo estimado
                    </p>

                    <p className="mt-1 text-lg font-semibold text-dark">
                      ${numero(
                        consumoHistorico.costo_usd,
                        2
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-2 mt-3">
                  <FilaDato
                    etiqueta="Cobertura"
                    valor={`${numero(
                      consumoHistorico.cobertura_porcentaje,
                      1
                    )} %`}
                  />

                  <FilaDato
                    etiqueta="Lecturas"
                    valor={
                      consumoHistorico.lecturas_con_potencia ??
                      "—"
                    }
                  />

                  <FilaDato
                    etiqueta="P. máxima"
                    valor={
                      consumoHistorico.potencia_maxima_kw != null
                        ? `${numero(
                            consumoHistorico.potencia_maxima_kw,
                            2
                          )} kW`
                        : "—"
                    }
                  />
                </div>
              </div>
            )}

          {!cargandoConsumo &&
            consumoHistorico?.error && (
              <div className="mt-3 rounded-xl bg-danger/5 p-4 text-xs text-danger">
                {consumoHistorico.mensaje}
              </div>
            )}
        </Tarjeta>

      </div>


      {/* ===================================================
          CONTROL DEL EQUIPO
      =================================================== */}

      <Tarjeta
        eyebrow="Control del equipo"
        titulo="Órdenes disponibles"
        descripcion="ATMOS reconoce las acciones compatibles con el ESP32: encender en 22 °C, modo ahorro en 24 °C y apagar."
        icono={<MdThermostat size={20} />}
      >
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">

          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              enviarMensaje(
                "¿Cuál es el estado actual del Aire 1?",
                "boton"
              )
            }
            className="
              rounded-xl border border-gray-200
              px-4 py-3 text-sm font-semibold text-dark
              flex items-center justify-center gap-2
              hover:border-secondary/40 hover:bg-secondary/5
              transition-all disabled:opacity-50
            "
          >
            <MdQueryStats size={19} />
            Consultar estado
          </button>


          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              enviarMensaje(
                "Enciende el Aire 1 en 22 grados",
                "boton"
              )
            }
            className="
              rounded-xl border border-gray-200
              px-4 py-3 text-sm font-semibold text-dark
              flex items-center justify-center gap-2
              hover:border-secondary/40 hover:bg-secondary/5
              transition-all disabled:opacity-50
            "
          >
            <MdPowerSettingsNew size={19} />
            Encender en 22 °C
          </button>


          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              enviarMensaje(
                "Configura el Aire 1 en modo ahorro a 24 grados",
                "boton"
              )
            }
            className="
              rounded-xl border border-gray-200
              px-4 py-3 text-sm font-semibold text-dark
              flex items-center justify-center gap-2
              hover:border-secondary/40 hover:bg-secondary/5
              transition-all disabled:opacity-50
            "
          >
            <MdEco size={19} />
            Modo ahorro 24 °C
          </button>


          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              enviarMensaje(
                "Apaga el Aire 1",
                "boton"
              )
            }
            className="
              rounded-xl border border-danger/25
              bg-danger/5 px-4 py-3
              text-sm font-semibold text-danger
              flex items-center justify-center gap-2
              hover:bg-danger/10
              transition-all disabled:opacity-50
            "
          >
            <MdPowerSettingsNew size={19} />
            Apagar Aire 1
          </button>

        </div>

        {!controlReal && (
          <div className="mt-3 rounded-xl bg-warning/10 px-4 py-3 text-xs leading-5 text-warning">
            <strong>Modo seguro activo:</strong>{" "}
            puedes probar y confirmar las órdenes, pero ATMOS no escribirá en Firebase mientras
            <code className="mx-1 font-semibold">CONTROL_REAL_ACTIVO=false</code>.
          </div>
        )}
      </Tarjeta>

    </PageWrapper>
  )
}
