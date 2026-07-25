import { useEffect, useMemo, useRef, useState } from "react"
import {
  MdClose,
  MdSend,
  MdRemove,
  MdMic,
  MdStop,
} from "react-icons/md"

import useAtmosVoice from "../../hooks/useAtmosVoice"
import AtmosIAIcon from "./AtmosIAIcon"

const API_BASE =
  import.meta.env.VITE_ATMOS_IA_API_URL ||
  "http://127.0.0.1:8000"

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

export default function AtmosIABubble() {
  const conversationId = useMemo(
    () => obtenerConversationId(),
    []
  )

  const [abierto, setAbierto] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const [entrada, setEntrada] = useState("")
  const [procesando, setProcesando] = useState(false)
  const [conectado, setConectado] = useState(false)

  const [mensajes, setMensajes] = useState([
    {
      tipo: "atmos",
      texto:
        "Hola. Soy ATMOS IA. ¿En qué puedo ayudarte?",
    },
  ])

  const chatRef = useRef(null)

  function agregarMensaje(texto, tipo) {
    setMensajes((actuales) => [
      ...actuales,
      { texto, tipo },
    ])
  }

  async function enviarMensaje(
    textoManual = null,
    origenManual = null
  ) {
    const texto = String(
      textoManual ?? entrada
    ).trim()

    if (!texto || procesando) return

    agregarMensaje(texto, "usuario")
    setEntrada("")
    setProcesando(true)

    try {
      const origen =
        origenManual ||
        (textoManual ? "boton" : "texto")

      const respuesta = await fetch(
        `${API_BASE}/api/asistente`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            mensaje: texto,
            aire_id:
              "robotica_aire_1",
            confirmar_control: false,
            origen,
            conversation_id:
              conversationId,
          }),
        }
      )

      if (!respuesta.ok) {
        throw new Error(
          `Código ${respuesta.status}`
        )
      }

      const datos =
        await respuesta.json()

      agregarMensaje(
        datos.respuesta,
        "atmos"
      )

      if (
        datos.requiere_confirmacion_control ===
        true
      ) {
        agregarMensaje(
          "Esta orden requiere confirmación. Ábrela desde la sección completa de ATMOS IA para ejecutarla con seguridad.",
          "atmos"
        )
      }

      setConectado(true)
      setProcesando(false)

      if (origen === "voz") {
        await hablar(
          datos.respuesta
        )
      }
    } catch (error) {
      console.error(
        "Error ATMOS IA:",
        error
      )

      agregarMensaje(
        "No pude comunicarme con ATMOS IA. Verifica que el backend esté encendido.",
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
    consultarEstado()
  }, [])

  useEffect(() => {
    if (!chatRef.current) return

    chatRef.current.scrollTop =
      chatRef.current.scrollHeight
  }, [
    mensajes,
    procesando,
    transcribiendo,
  ])

  async function consultarEstado() {
    try {
      const respuesta = await fetch(
        `${API_BASE}/api/health`,
        { cache: "no-store" }
      )

      setConectado(respuesta.ok)
    } catch {
      setConectado(false)
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

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => {
          setAbierto(true)
          setMinimizado(false)
        }}
        title="Hablar con ATMOS IA"
        aria-label="Abrir ATMOS IA"
        className="
          fixed right-5 bottom-5 z-[70]
          w-14 h-14 rounded-2xl
          bg-white border border-gray-100
          shadow-[0_12px_35px_rgba(15,23,42,0.18)]
          flex items-center justify-center
          text-secondary
          hover:-translate-y-1
          hover:shadow-[0_16px_40px_rgba(15,23,42,0.22)]
          active:scale-95
          transition-all duration-200
        "
      >
        <AtmosIAIcon size={27} />

        <span
          className={`
            absolute right-1 top-1
            w-3 h-3 rounded-full
            border-2 border-white
            ${conectado ? "bg-success" : "bg-danger"}
          `}
        />
      </button>
    )
  }

  return (
    <section
      className={`
        fixed z-[70]
        right-4 bottom-4
        w-[calc(100vw-32px)]
        sm:w-[360px]
        bg-white
        border border-gray-100
        rounded-2xl
        shadow-[0_20px_60px_rgba(15,23,42,0.20)]
        overflow-hidden
        transition-all duration-200
        ${minimizado ? "h-[64px]" : "h-[520px]"}
      `}
    >
      <header
        className="
          h-16 px-4
          flex items-center gap-3
          border-b border-gray-100 bg-white
        "
      >
        <div
          className="
            relative
            w-10 h-10 rounded-xl
            bg-secondary/10 text-secondary
            flex items-center justify-center
            shrink-0
          "
        >
          <AtmosIAIcon size={22} />

          <span
            className={`
              absolute -right-0.5 -bottom-0.5
              w-3 h-3 rounded-full
              border-2 border-white
              ${conectado ? "bg-success" : "bg-danger"}
            `}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-dark">
            ATMOS IA
          </p>

          <p className="text-[10px] text-muted mt-0.5">
            {conectado
              ? "Conectado · Aire 1"
              : "Sin conexión"}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setMinimizado(
              (valor) => !valor
            )
          }
          className="
            w-8 h-8 rounded-lg
            flex items-center justify-center
            text-muted
            hover:text-dark hover:bg-gray-100
            transition-colors
          "
          title="Minimizar"
        >
          <MdRemove size={19} />
        </button>

        <button
          type="button"
          onClick={() => {
            setAbierto(false)
            setMinimizado(false)
          }}
          className="
            w-8 h-8 rounded-lg
            flex items-center justify-center
            text-muted
            hover:text-danger hover:bg-danger/5
            transition-colors
          "
          title="Cerrar"
        >
          <MdClose size={19} />
        </button>
      </header>

      {!minimizado && (
        <>
          <div
            ref={chatRef}
            className="
              h-[365px]
              overflow-y-auto
              px-4 py-4
              bg-gray-50/70
              space-y-3
            "
          >
            {mensajes.map(
              (mensaje, indice) => {
                const esUsuario =
                  mensaje.tipo ===
                  "usuario"

                return (
                  <div
                    key={indice}
                    className={`
                      flex
                      ${esUsuario
                        ? "justify-end"
                        : "justify-start"}
                    `}
                  >
                    <div
                      className={`
                        max-w-[82%]
                        px-3 py-2.5
                        rounded-2xl
                        text-xs leading-5
                        whitespace-pre-wrap
                        ${
                          esUsuario
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-white text-dark border border-gray-100 rounded-bl-md shadow-sm"
                        }
                      `}
                    >
                      {mensaje.texto}
                    </div>
                  </div>
                )
              }
            )}

            {(procesando || transcribiendo) && (
              <div className="flex justify-start">
                <div
                  className="
                    bg-white border border-gray-100
                    rounded-2xl rounded-bl-md
                    px-3 py-3 shadow-sm
                  "
                >
                  <p className="text-[10px] text-muted">
                    {transcribiendo
                      ? "Transcribiendo..."
                      : "ATMOS está pensando..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={manejarSubmit}
            className="
              h-[91px]
              border-t border-gray-100
              bg-white
              px-3 py-3
            "
          >
            <div
              className="
                flex items-center gap-2
                border border-gray-200
                rounded-xl p-1.5
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
                placeholder={
                  grabando
                    ? "ATMOS está escuchando..."
                    : "Pregúntale a ATMOS..."
                }
                disabled={ocupado || grabando}
                className="
                  min-w-0 flex-1 h-9 px-2
                  bg-transparent outline-none
                  text-xs text-dark
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
                  w-9 h-9 rounded-lg
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
                  ? <MdStop size={18} />
                  : <MdMic size={18} />}
              </button>

              <button
                type="submit"
                disabled={
                  ocupado ||
                  grabando ||
                  !entrada.trim()
                }
                className="
                  w-9 h-9 rounded-lg
                  bg-primary text-white
                  flex items-center justify-center
                  hover:bg-primary/90
                  disabled:opacity-40
                  transition-all
                "
              >
                <MdSend size={17} />
              </button>
            </div>

            <p className="mt-2 px-1 text-[9px] text-muted">
              {grabando
                ? "Escuchando... se detendrá al detectar silencio."
                : hablando
                  ? "ATMOS está respondiendo por voz."
                  : "Texto o voz · Los controles físicos requieren confirmación."}
            </p>
          </form>
        </>
      )}
    </section>
  )
}
