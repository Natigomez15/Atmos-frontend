import {
  MdAutoGraph,
  MdCheckCircle,
  MdChevronRight,
  MdError,
  MdInfo,
  MdRule,
  MdSchedule,
  MdTipsAndUpdates,
  MdWarning,
} from "react-icons/md"

const ESTADOS_EJECUCION = {
  confirmada: {
    etiqueta: "Confirmada",
    detalle: "La ejecución fue confirmada.",
    iconoClase: "bg-success/10 text-success",
    textoClase: "text-success",
    Icono: MdCheckCircle,
  },
  enviada_sin_confirmacion: {
    etiqueta: "Sin confirmar",
    detalle: "La señal fue enviada, pero no se confirmó el funcionamiento físico del aire.",
    iconoClase: "bg-warning/10 text-warning",
    textoClase: "text-warning",
    Icono: MdWarning,
  },
  senal_enviada: {
    etiqueta: "Sin confirmar",
    detalle: "La señal fue enviada, pero no se confirmó el funcionamiento físico del aire.",
    iconoClase: "bg-warning/10 text-warning",
    textoClase: "text-warning",
    Icono: MdWarning,
  },
  pendiente: {
    etiqueta: "Pendiente",
    detalle: "La ejecución todavía está pendiente.",
    iconoClase: "bg-blue-50 text-primary",
    textoClase: "text-primary",
    Icono: MdSchedule,
  },
  fallida: {
    etiqueta: "Error de comunicación",
    detalle: "No se pudo completar la comunicación con el dispositivo.",
    iconoClase: "bg-danger/10 text-danger",
    textoClase: "text-danger",
    Icono: MdError,
  },
  inconsistente: {
    etiqueta: "Inconsistente",
    detalle: "Los datos de la ejecución no coinciden entre sí.",
    iconoClase: "bg-danger/10 text-danger",
    textoClase: "text-danger",
    Icono: MdWarning,
  },
  sin_registro: {
    etiqueta: "Sin registro",
    detalle: "Todavía no existe información de ejecución.",
    iconoClase: "bg-gray-200 text-muted",
    textoClase: "text-muted",
    Icono: MdInfo,
  },
}

const ESTADO_NO_REQUERIDO = {
  etiqueta: "No requerida",
  detalle: "No se solicitó ningún cambio.",
  iconoClase: "bg-gray-100 text-muted",
  textoClase: "text-dark",
  Icono: MdCheckCircle,
}

function obtenerEstadoEjecucion(estado) {
  return ESTADOS_EJECUCION[estado] ?? ESTADOS_EJECUCION.sin_registro
}

function porcentajeConfianza(valor) {
  const numero = Number(valor)
  if (valor == null || !Number.isFinite(numero)) return null
  return Math.max(0, Math.min(100, Math.round(numero <= 1 ? numero * 100 : numero)))
}

function BloqueFlujo({ titulo, valor, Icono, iconoClase, valorClase = "text-dark", descripcionAccesible }) {
  return (
    <div className="relative z-10 flex min-w-0 items-center gap-2.5 py-1.5 xl:px-1">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconoClase}`}>
        <Icono size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight text-muted">{titulo}</p>
        <p className={`mt-0.5 text-base font-semibold leading-snug break-words ${valorClase}`} title={descripcionAccesible}>
          {valor}
        </p>
        {descripcionAccesible && <span className="sr-only">{descripcionAccesible}</span>}
      </div>
    </div>
  )
}

function Separador() {
  return (
    <div className="hidden items-center justify-center text-gray-300 xl:flex" aria-hidden="true">
      <MdChevronRight size={20} />
    </div>
  )
}

export default function DecisionFlow({ prediccion, confianza, modificada, recomendacion, accionSolicitada, ejecucion }) {
  const porcentaje = porcentajeConfianza(confianza)
  const recomendacionNormalizada = String(recomendacion ?? "").trim().toLowerCase()
  const accionNormalizada = String(accionSolicitada ?? "").trim().toLowerCase()
  const estadoNormalizado = String(ejecucion?.estado ?? "sin_registro").trim().toLowerCase()
  const mantenerSinOrden = recomendacionNormalizada === "mantener" &&
    ["sin_registro", "no_op", "no_requerida"].includes(estadoNormalizado) &&
    ["", "mantener", "no_op", "no disponible"].includes(accionNormalizada)
  const estadoEjecucion = mantenerSinOrden
    ? ESTADO_NO_REQUERIDO
    : obtenerEstadoEjecucion(estadoNormalizado)
  const IconoEjecucion = estadoEjecucion.Icono
  const valorModelo = porcentaje == null
    ? `${prediccion} · Confianza no disponible`
    : `${prediccion} · ${porcentaje} %`

  return (
    <section aria-label="Resumen del flujo de decisión">
      <div className="relative grid min-w-0 grid-cols-1 gap-x-3 gap-y-1 border-y border-gray-100 py-1.5 md:grid-cols-2 md:gap-y-1 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center">
        <div className="absolute bottom-7 left-8 top-7 w-px bg-gray-200 md:hidden" aria-hidden="true" />
        <BloqueFlujo
          titulo="Modelo"
          valor={valorModelo}
          Icono={MdAutoGraph}
          iconoClase="bg-violet-100 text-violet-700"
          descripcionAccesible="Confianza de la predicción original"
        />
        <Separador />
        <BloqueFlujo
          titulo="Reglas ATMOS"
          valor={modificada ? "Decisión ajustada" : "Sin cambios"}
          Icono={MdRule}
          iconoClase={modificada ? "bg-warning/10 text-warning" : "bg-gray-200 text-muted"}
          descripcionAccesible={modificada ? "Se aplicaron las reglas del sistema." : "No fue necesario ajustar la predicción."}
        />
        <Separador />
        <BloqueFlujo
          titulo="Decisión final"
          valor={recomendacion}
          Icono={MdTipsAndUpdates}
          iconoClase="bg-secondary/10 text-secondary"
          valorClase="text-secondary"
        />
        <Separador />
        <BloqueFlujo
          titulo="Ejecución"
          valor={estadoEjecucion.etiqueta}
          Icono={IconoEjecucion}
          iconoClase={estadoEjecucion.iconoClase}
          valorClase={estadoEjecucion.textoClase}
          descripcionAccesible={ejecucion?.mensaje || estadoEjecucion.detalle}
        />
      </div>
    </section>
  )
}
