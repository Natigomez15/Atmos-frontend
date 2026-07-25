import { useCallback, useEffect, useRef, useState } from "react"

const API_BASE =
  import.meta.env.VITE_ATMOS_IA_API_URL ||
  "http://127.0.0.1:8000"

const DURACION_MAXIMA_GRABACION_MS = 8000
const SILENCIO_PARA_DETENER_MS = 700
const TIEMPO_MINIMO_ANTES_DE_DETENER_MS = 650
const TIEMPO_MAXIMO_SIN_HABLAR_MS = 4500
const CALIBRACION_RUIDO_MS = 280

function obtenerTipoGrabacion() {
  if (!window.MediaRecorder) return ""

  const opciones = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ]

  return opciones.find((tipo) =>
    MediaRecorder.isTypeSupported(tipo)
  ) || ""
}

function obtenerExtension(tipo) {
  const tipoLimpio = String(tipo || "").toLowerCase()

  if (tipoLimpio.includes("ogg")) return "ogg"
  if (tipoLimpio.includes("mp4")) return "mp4"
  if (tipoLimpio.includes("mpeg")) return "mp3"
  if (tipoLimpio.includes("wav")) return "wav"

  return "webm"
}

function calcularRms(datos) {
  let suma = 0

  for (let i = 0; i < datos.length; i += 1) {
    const muestra = (datos[i] - 128) / 128
    suma += muestra * muestra
  }

  return Math.sqrt(suma / datos.length)
}

export default function useAtmosVoice({
  onTextoReconocido,
  onError,
} = {}) {
  const [grabando, setGrabando] = useState(false)
  const [transcribiendo, setTranscribiendo] = useState(false)
  const [hablando, setHablando] = useState(false)

  const mediaRecorderRef = useRef(null)
  const flujoRef = useRef(null)
  const fragmentosRef = useRef([])
  const temporizadorRef = useRef(null)

  const contextoAudioRef = useRef(null)
  const analizadorRef = useRef(null)
  const fuenteAnalisisRef = useRef(null)
  const datosTiempoRef = useRef(null)
  const frameRef = useRef(null)

  const inicioGrabacionRef = useRef(0)
  const ultimoSonidoRef = useRef(0)
  const vozDetectadaRef = useRef(false)
  const calibrandoRef = useRef(false)
  const muestrasRuidoRef = useRef([])
  const umbralSilencioRef = useRef(0.02)

  const audioActualRef = useRef(null)

  const disponible = Boolean(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  )

  const detenerAnalisisSilencio = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    if (fuenteAnalisisRef.current) {
      try {
        fuenteAnalisisRef.current.disconnect()
      } catch {
        // Ya estaba desconectada.
      }
    }

    fuenteAnalisisRef.current = null
    analizadorRef.current = null
    datosTiempoRef.current = null
    muestrasRuidoRef.current = []
    calibrandoRef.current = false
    vozDetectadaRef.current = false
  }, [])

  const cerrarFlujo = useCallback(() => {
    if (flujoRef.current) {
      flujoRef.current
        .getTracks()
        .forEach((pista) => pista.stop())

      flujoRef.current = null
    }
  }, [])

  const desbloquearAudio = useCallback(async () => {
    const ContextoAudio =
      window.AudioContext ||
      window.webkitAudioContext

    if (!ContextoAudio) return null

    if (!contextoAudioRef.current) {
      contextoAudioRef.current =
        new ContextoAudio()
    }

    if (
      contextoAudioRef.current.state ===
      "suspended"
    ) {
      await contextoAudioRef.current.resume()
    }

    return contextoAudioRef.current
  }, [])

  const transcribir = useCallback(async (blob) => {
    const extension = obtenerExtension(blob.type)
    const formData = new FormData()

    formData.append(
      "audio",
      blob,
      `grabacion_atmos.${extension}`
    )

    const respuesta = await fetch(
      `${API_BASE}/api/transcribir`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!respuesta.ok) {
      let detalle = `Código ${respuesta.status}`

      try {
        const datos = await respuesta.json()
        detalle = datos.detail || detalle
      } catch {
        // Conserva el código HTTP.
      }

      throw new Error(detalle)
    }

    const datos = await respuesta.json()

    return String(
      datos.texto || ""
    ).trim()
  }, [])

  const detenerGrabacion = useCallback(() => {
    const recorder = mediaRecorderRef.current

    if (
      !grabando ||
      !recorder ||
      recorder.state === "inactive"
    ) {
      return
    }

    setGrabando(false)
    detenerAnalisisSilencio()
    recorder.stop()
  }, [
    grabando,
    detenerAnalisisSilencio,
  ])

  const iniciarAnalisisSilencio = useCallback(async () => {
    const contexto =
      await desbloquearAudio()

    if (
      !contexto ||
      !flujoRef.current
    ) {
      return
    }

    detenerAnalisisSilencio()

    fuenteAnalisisRef.current =
      contexto.createMediaStreamSource(
        flujoRef.current
      )

    analizadorRef.current =
      contexto.createAnalyser()

    analizadorRef.current.fftSize = 2048
    analizadorRef.current.smoothingTimeConstant = 0.25

    datosTiempoRef.current =
      new Uint8Array(
        analizadorRef.current.fftSize
      )

    fuenteAnalisisRef.current.connect(
      analizadorRef.current
    )

    const inicio = performance.now()

    inicioGrabacionRef.current = inicio
    ultimoSonidoRef.current = inicio
    vozDetectadaRef.current = false
    calibrandoRef.current = true
    muestrasRuidoRef.current = []
    umbralSilencioRef.current = 0.02

    const analizar = () => {
      const recorder =
        mediaRecorderRef.current

      if (
        !recorder ||
        recorder.state !== "recording" ||
        !analizadorRef.current ||
        !datosTiempoRef.current
      ) {
        return
      }

      analizadorRef.current.getByteTimeDomainData(
        datosTiempoRef.current
      )

      const ahora = performance.now()
      const transcurrido =
        ahora - inicioGrabacionRef.current

      const volumen = calcularRms(
        datosTiempoRef.current
      )

      if (
        transcurrido <=
        CALIBRACION_RUIDO_MS
      ) {
        muestrasRuidoRef.current.push(
          volumen
        )
      } else if (
        calibrandoRef.current
      ) {
        const muestras =
          muestrasRuidoRef.current

        const ruidoPromedio =
          muestras.length > 0
            ? muestras.reduce(
                (total, valor) =>
                  total + valor,
                0
              ) / muestras.length
            : 0.008

        umbralSilencioRef.current =
          Math.min(
            0.08,
            Math.max(
              0.018,
              ruidoPromedio * 2.6
            )
          )

        calibrandoRef.current = false
      }

      if (
        !calibrandoRef.current &&
        volumen >
          umbralSilencioRef.current
      ) {
        vozDetectadaRef.current = true
        ultimoSonidoRef.current = ahora
      }

      const puedeDetener =
        transcurrido >=
        TIEMPO_MINIMO_ANTES_DE_DETENER_MS

      const silencioSuficiente =
        vozDetectadaRef.current &&
        puedeDetener &&
        ahora -
          ultimoSonidoRef.current >=
          SILENCIO_PARA_DETENER_MS

      const noHablo =
        !vozDetectadaRef.current &&
        transcurrido >=
          TIEMPO_MAXIMO_SIN_HABLAR_MS

      if (
        silencioSuficiente ||
        noHablo
      ) {
        setGrabando(false)
        detenerAnalisisSilencio()
        recorder.stop()
        return
      }

      frameRef.current =
        requestAnimationFrame(
          analizar
        )
    }

    frameRef.current =
      requestAnimationFrame(
        analizar
      )
  }, [
    desbloquearAudio,
    detenerAnalisisSilencio,
  ])

  const iniciarGrabacion = useCallback(async () => {
    if (
      !disponible ||
      grabando ||
      transcribiendo ||
      hablando
    ) {
      return
    }

    try {
      await desbloquearAudio()

      flujoRef.current =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

      const tipo = obtenerTipoGrabacion()

      const recorder =
        new MediaRecorder(
          flujoRef.current,
          tipo
            ? { mimeType: tipo }
            : undefined
        )

      mediaRecorderRef.current = recorder
      fragmentosRef.current = []

      recorder.addEventListener(
        "dataavailable",
        (evento) => {
          if (
            evento.data &&
            evento.data.size > 0
          ) {
            fragmentosRef.current.push(
              evento.data
            )
          }
        }
      )

      recorder.addEventListener(
        "stop",
        async () => {
          clearTimeout(
            temporizadorRef.current
          )

          temporizadorRef.current = null

          detenerAnalisisSilencio()
          cerrarFlujo()

          const tipoFinal =
            recorder.mimeType ||
            tipo ||
            "audio/webm"

          const blob =
            new Blob(
              fragmentosRef.current,
              { type: tipoFinal }
            )

          fragmentosRef.current = []

          if (blob.size === 0) {
            onError?.(
              "No se recibió audio."
            )
            return
          }

          setTranscribiendo(true)

          try {
            const texto =
              await transcribir(blob)

            if (!texto) {
              throw new Error(
                "No se detectó una frase clara."
              )
            }

            await onTextoReconocido?.(
              texto
            )
          } catch (error) {
            onError?.(
              error.message ||
                "No pude transcribir la grabación."
            )
          } finally {
            setTranscribiendo(false)
          }
        }
      )

      recorder.addEventListener(
        "error",
        () => {
          setGrabando(false)
          detenerAnalisisSilencio()
          cerrarFlujo()
          onError?.(
            "No pude utilizar el micrófono."
          )
        }
      )

      recorder.start(250)
      setGrabando(true)

      await iniciarAnalisisSilencio()

      temporizadorRef.current =
        setTimeout(() => {
          const actual =
            mediaRecorderRef.current

          if (
            actual &&
            actual.state === "recording"
          ) {
            setGrabando(false)
            detenerAnalisisSilencio()
            actual.stop()
          }
        }, DURACION_MAXIMA_GRABACION_MS)
    } catch (error) {
      cerrarFlujo()

      if (
        error.name ===
          "NotAllowedError" ||
        error.name ===
          "PermissionDeniedError"
      ) {
        onError?.(
          "Necesito permiso para usar el micrófono."
        )
      } else {
        onError?.(
          "No pude iniciar el micrófono."
        )
      }
    }
  }, [
    disponible,
    grabando,
    transcribiendo,
    hablando,
    desbloquearAudio,
    detenerAnalisisSilencio,
    cerrarFlujo,
    transcribir,
    onTextoReconocido,
    onError,
    iniciarAnalisisSilencio,
  ])

  const hablar = useCallback(async (texto) => {
    const limpio =
      String(texto || "").trim()

    if (!limpio) return

    try {
      const respuesta = await fetch(
        `${API_BASE}/api/voz`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            texto: limpio,
          }),
        }
      )

      if (!respuesta.ok) {
        throw new Error(
          `Código ${respuesta.status}`
        )
      }

      const blob =
        await respuesta.blob()

      const url =
        URL.createObjectURL(blob)

      if (audioActualRef.current) {
        try {
          audioActualRef.current.pause()
        } catch {
          // No requiere acción.
        }
      }

      const audio = new Audio(url)

      audioActualRef.current = audio
      setHablando(true)

      await audio.play()

      await new Promise(
        (resolve) => {
          audio.onended = resolve
          audio.onerror = resolve
        }
      )

      URL.revokeObjectURL(url)
    } catch (error) {
      console.warn(
        "No se pudo reproducir la voz:",
        error
      )
    } finally {
      setHablando(false)
      audioActualRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(
        temporizadorRef.current
      )

      detenerAnalisisSilencio()
      cerrarFlujo()

      if (audioActualRef.current) {
        try {
          audioActualRef.current.pause()
        } catch {
          // No requiere acción.
        }
      }
    }
  }, [
    detenerAnalisisSilencio,
    cerrarFlujo,
  ])

  return {
    disponible,
    grabando,
    transcribiendo,
    hablando,
    iniciarGrabacion,
    detenerGrabacion,
    hablar,
  }
}
