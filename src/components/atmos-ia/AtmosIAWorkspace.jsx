import { useState } from "react"
import {
  MdCheckCircle,
  MdCircle,
  MdErrorOutline,
  MdExpandMore,
  MdHistory,
  MdMic,
  MdOpenInNew,
  MdRefresh,
  MdSchedule,
  MdSend,
  MdStop,
} from "react-icons/md"

import AtmosIAIcon from "./AtmosIAIcon"

const ACCIONES = {
  encender_22: "Encender · 22 °C",
  encender_23: "Encender · 23 °C",
  ahorro_24: "Modo ahorro · 24 °C",
  posible_ahorro: "Modo ahorro · 24 °C",
  enfriar_fuerte: "Enfriamiento fuerte · 22 °C",
  apagar: "Apagar Aire 1",
  mantener: "Mantener estado actual",
  accion_cancelada: "Orden cancelada",
}

const ORIGENES = {
  voz: "ATMOS IA · Voz",
  texto: "ATMOS IA",
  boton: "ATMOS IA",
  atmos_ia: "ATMOS IA",
  manual: "Control AC",
  control_ac: "Control AC",
  modelo_ml: "Machine Learning",
  modelo_ml_aprobado: "Machine Learning",
  recomendacion_ml: "Machine Learning",
}

const ESTADOS = {
  pendiente: { etiqueta: "Pendiente", tono: "warning", Icono: MdSchedule },
  enviando: { etiqueta: "Enviando", tono: "warning", Icono: MdSchedule },
  recibido_por_esp32: { etiqueta: "Recibido por ESP32", tono: "secondary", Icono: MdSchedule },
  ejecutando: { etiqueta: "Enviando", tono: "secondary", Icono: MdSchedule },
  senal_ir_enviada: { etiqueta: "Enviado", tono: "success", Icono: MdCheckCircle },
  enviada_sin_confirmacion: { etiqueta: "Enviado", tono: "success", Icono: MdCheckCircle },
  senal_enviada: { etiqueta: "Enviado", tono: "success", Icono: MdCheckCircle },
  confirmado: { etiqueta: "Procesado", tono: "success", Icono: MdCheckCircle },
  confirmada: { etiqueta: "Procesado", tono: "success", Icono: MdCheckCircle },
  verificado: { etiqueta: "Verificado", tono: "success", Icono: MdCheckCircle },
  fallido: { etiqueta: "Fallido", tono: "danger", Icono: MdErrorOutline },
  fallida: { etiqueta: "Fallido", tono: "danger", Icono: MdErrorOutline },
  error: { etiqueta: "Fallido", tono: "danger", Icono: MdErrorOutline },
  cancelado: { etiqueta: "Cancelado", tono: "muted", Icono: MdErrorOutline },
  cancelada: { etiqueta: "Cancelado", tono: "muted", Icono: MdErrorOutline },
  rechazado: { etiqueta: "Rechazado", tono: "muted", Icono: MdErrorOutline },
  rechazada: { etiqueta: "Rechazado", tono: "muted", Icono: MdErrorOutline },
  expirado: { etiqueta: "Expirado", tono: "muted", Icono: MdSchedule },
  expirada: { etiqueta: "Expirado", tono: "muted", Icono: MdSchedule },
  obsoleta: { etiqueta: "Expirado", tono: "muted", Icono: MdSchedule },
  prueba_sin_escritura: { etiqueta: "Prueba segura", tono: "muted", Icono: MdSchedule },
  registrado: { etiqueta: "Registrado", tono: "muted", Icono: MdSchedule },
}

const TONOS = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  secondary: "text-secondary",
  muted: "text-muted",
}

function fechaComando(item) {
  return item?.fecha
    ?? item?.ejecutado_en
    ?? item?.enviado_en
    ?? item?.actualizado_en
    ?? item?.created_at
    ?? item?.creada_en
    ?? null
}

function fechaCorta(valor) {
  if (!valor) return "—"
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return "—"
  return fecha.toLocaleTimeString("es-PA", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function fechaCompleta(valor) {
  if (!valor) return "—"
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return "—"
  return fecha.toLocaleString("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function accionComando(item) {
  const accion = item?.accion
    ?? item?.accion_solicitada
    ?? item?.ultima_accion
    ?? item?.ejecucion?.ultima_accion
  if (item?.descripcion_accion) return item.descripcion_accion
  return ACCIONES[accion] ?? String(accion || "Última orden ATMOS").replaceAll("_", " ")
}

function estadoComando(item, verificacion = null, ahora = 0) {
  const evidenciaCompatible =
    verificacion?.estado_verificacion === "evidencia_compatible"
    && (!verificacion?.command_id || !item?.command_id || verificacion.command_id === item.command_id)
  if (evidenciaCompatible) return "verificado"

  const crudo = String(
    item?.estado_normalizado
      ?? item?.estado
      ?? item?.ejecucion?.estado
      ?? item?.resultado
      ?? "registrado"
  ).trim().toLowerCase()

  const expira = item?.expires_at ?? item?.expira_en
  if (crudo === "pendiente" && expira) {
    const limite = new Date(expira).getTime()
    if (Number.isFinite(limite) && ahora >= limite) return "expirado"
  }
  return crudo
}

function origenComando(item) {
  const origen = String(item?.origen ?? item?.source ?? "").trim().toLowerCase()
  return ORIGENES[origen] ?? (origen ? origen.replaceAll("_", " ") : null)
}

function Estado({ estado }) {
  const config = ESTADOS[estado] ?? {
    etiqueta: estado || "Sin estado",
    tono: "muted",
    Icono: MdSchedule,
  }
  const { Icono } = config
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${TONOS[config.tono]}`}>
      <Icono size={16} aria-hidden="true" />
      {config.etiqueta}
    </span>
  )
}

function Encabezado({ conectado, cargando, alActualizar }) {
  return (
    <header className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="page-title">ATMOS IA</h1>
        <p className="mt-1 text-sm text-muted">Aire 1 · Laboratorio de Robótica</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${
          conectado ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        }`}>
          <MdCircle size={7} aria-hidden="true" />
          {conectado ? "Conectado" : "Desconectado"}
        </span>
        <button
          type="button"
          onClick={alActualizar}
          disabled={cargando}
          aria-label="Actualizar datos"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-gray-100 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 disabled:opacity-50"
        >
          <MdRefresh size={19} className={cargando ? "animate-spin" : ""} />
        </button>
      </div>
    </header>
  )
}

function Chat({
  mensajes,
  entrada,
  alCambiarEntrada,
  alEnviar,
  chatRef,
  procesando,
  transcribiendo,
  hablando,
  grabando,
  vozDisponible,
  alIniciarVoz,
  alDetenerVoz,
  ordenPendiente,
  alConfirmar,
  alCancelar,
}) {
  const ocupado = procesando || transcribiendo || hablando
  return (
    <section className="flex h-[clamp(430px,62vh,620px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white" aria-labelledby="chat-atmos">
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <AtmosIAIcon size={22} />
        </span>
        <div>
          <h2 id="chat-atmos" className="text-sm font-semibold text-dark">Chat ATMOS</h2>
          <p className="text-xs text-muted">Asistente del Aire 1</p>
        </div>
      </div>

      <div ref={chatRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50/60 px-3 py-4 sm:px-5">
        {mensajes.map((mensaje, indice) => {
          const usuario = mensaje.tipo === "usuario"
          return (
            <div key={`${mensaje.tipo}-${indice}`} className={`flex ${usuario ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[76%] ${
                usuario
                  ? "rounded-br-md bg-primary text-white"
                  : "rounded-bl-md border border-gray-100 bg-white text-dark"
              }`}>
                {mensaje.texto}
              </p>
            </div>
          )
        })}
        {(procesando || transcribiendo) && (
          <p className="w-fit rounded-xl bg-white px-3 py-2 text-xs text-muted">
            {transcribiendo ? "Transcribiendo tu voz…" : "ATMOS está analizando…"}
          </p>
        )}
      </div>

      {ordenPendiente && (
        <div className="border-t border-warning/20 bg-warning/5 px-4 py-3">
          <p className="text-xs font-semibold text-warning">Confirmación requerida</p>
          <p className="mt-1 text-sm text-dark">{ordenPendiente.datos.descripcion_accion || "Orden de control"}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={alCancelar} className="btn-secondary min-h-11">Cancelar</button>
            <button type="button" onClick={alConfirmar} className="btn-primary min-h-11">Confirmar</button>
          </div>
        </div>
      )}

      <form
        onSubmit={evento => {
          evento.preventDefault()
          alEnviar()
        }}
        className="border-t border-gray-100 p-3 sm:p-4"
      >
        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-1.5 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10">
          <label htmlFor="atmos-chat-input" className="sr-only">Pregúntale algo a ATMOS</label>
          <input
            id="atmos-chat-input"
            value={entrada}
            onChange={evento => alCambiarEntrada(evento.target.value)}
            disabled={ocupado || grabando}
            placeholder={grabando ? "ATMOS está escuchando…" : "Pregúntale algo a ATMOS…"}
            className="h-12 min-w-0 flex-1 bg-transparent px-2 text-sm text-dark outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={grabando ? alDetenerVoz : alIniciarVoz}
            disabled={ocupado || !vozDisponible}
            aria-label={grabando ? "Detener grabación" : "Hablar con ATMOS"}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-xl ${
              grabando ? "bg-danger text-white" : "text-secondary hover:bg-secondary/10"
            } disabled:opacity-40`}
          >
            {grabando ? <MdStop size={20} /> : <MdMic size={20} />}
          </button>
          <button
            type="submit"
            disabled={ocupado || grabando || !entrada.trim()}
            aria-label="Enviar mensaje"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40"
          >
            <MdSend size={18} />
          </button>
        </div>
      </form>
    </section>
  )
}

function UltimaAccion({ comando, historial, verificacion, ahora }) {
  const ultima = comando?.accion || comando?.estado_normalizado || comando?.ejecucion
    ? comando
    : historial[0]

  if (!ultima) {
    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5" aria-labelledby="ultima-accion">
        <p className="text-xs font-semibold text-muted">ÚLTIMA ACCIÓN</p>
        <h2 id="ultima-accion" className="mt-4 text-lg font-semibold text-dark">Sin acciones registradas</h2>
        <p className="mt-2 text-sm text-muted">Cuando ATMOS procese una orden, su estado aparecerá aquí.</p>
      </section>
    )
  }

  const estado = estadoComando(ultima, verificacion, ahora)
  const origen = origenComando(ultima)
  const transmisionIR =
    ultima?.confirmacion_ir_raw
    ?? ultima?.confirmacion_ir
    ?? ultima?.ejecucion?.confirmacion_ir_raw
  const verificacionTexto = verificacion?.estado_verificacion === "evidencia_compatible"
    ? "Compatible"
    : verificacion?.estado_verificacion
      ? "Sin evidencia concluyente"
      : "No disponible"

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5" aria-labelledby="ultima-accion">
      <p className="text-xs font-semibold text-muted">ÚLTIMA ACCIÓN</p>
      <div className="mt-4"><Estado estado={estado} /></div>
      <h2 id="ultima-accion" className="mt-3 text-xl font-semibold text-dark">
        {accionComando(ultima)}
      </h2>
      {origen && <p className="mt-1 text-xs text-muted">Origen: {origen}</p>}

      <div className="mt-5 space-y-2 text-sm">
        <p className="text-dark">
          {transmisionIR
            ? "El ESP32 reportó transmisión IR"
            : estado === "pendiente"
              ? "Esperando procesamiento del ESP32"
              : estado === "expirado"
                ? "La orden venció sin confirmación"
                : "Sin confirmación explícita de transmisión IR"}
        </p>
        <p className="text-xs text-muted">{fechaCompleta(fechaComando(ultima))}</p>
        <p className="text-xs text-muted">
          Verificación física: <span className="font-medium text-dark">{verificacionTexto}</span>
        </p>
      </div>

      <details className="group mt-4 border-t border-gray-100 pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30">
          Ver detalles
          <MdExpandMore size={19} className="transition-transform group-open:rotate-180" />
        </summary>
        <dl className="grid gap-3 rounded-xl bg-gray-50 p-3 text-xs sm:grid-cols-2">
          <div><dt className="text-muted">Command ID</dt><dd className="mt-1 break-all font-medium text-dark">{ultima.command_id ?? ultima.comando_id ?? "—"}</dd></div>
          <div><dt className="text-muted">Estado de origen</dt><dd className="mt-1 font-medium text-dark">{ultima.estado_normalizado ?? ultima.estado ?? ultima.ejecucion?.estado ?? "—"}</dd></div>
          <div><dt className="text-muted">Creado</dt><dd className="mt-1 font-medium text-dark">{fechaCompleta(ultima.created_at ?? ultima.creada_en)}</dd></div>
          <div><dt className="text-muted">Expira</dt><dd className="mt-1 font-medium text-dark">{fechaCompleta(ultima.expires_at ?? ultima.expira_en)}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted">Confirmación IR</dt><dd className="mt-1 break-words font-medium text-dark">{transmisionIR ?? "No reportada"}</dd></div>
        </dl>
      </details>
    </section>
  )
}

function Actividad({ historial, ahora }) {
  const visibles = historial.slice(0, 4)
  return (
    <section className="border-t border-gray-100 py-5" aria-labelledby="actividad-reciente">
      <div className="flex items-center justify-between gap-3">
        <h2 id="actividad-reciente" className="section-title">Actividad reciente</h2>
        <a href="/commands" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-secondary">
          Ver historial <MdOpenInNew size={14} />
        </a>
      </div>

      <div className="mt-1 max-h-[220px] overflow-y-auto">
        {!visibles.length && (
          <p className="flex items-center gap-2 py-4 text-sm text-muted">
            <MdHistory size={17} /> Todavía no hay órdenes registradas.
          </p>
        )}
        <div className="divide-y divide-gray-100">
          {visibles.map((item, indice) => {
            const estado = estadoComando(item, null, ahora)
            return (
              <div
                key={item.evento_id || item.command_id || item.comando_id || indice}
                className={`grid grid-cols-[54px_minmax(0,1fr)] gap-x-2 gap-y-1 py-2.5 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center ${
                  indice === 3 ? "max-sm:hidden" : ""
                }`}
              >
                <time className="text-xs tabular-nums text-muted">{fechaCorta(fechaComando(item))}</time>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-dark">{accionComando(item)}</p>
                  {origenComando(item) && <p className="truncate text-[11px] text-muted">{origenComando(item)}</p>}
                </div>
                <span className="col-start-2 sm:col-start-auto"><Estado estado={estado} /></span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function AtmosIAWorkspace({
  conectado,
  cargandoPaneles,
  alActualizar,
  mensajes,
  entrada,
  alCambiarEntrada,
  alEnviar,
  chatRef,
  procesando,
  transcribiendo,
  hablando,
  grabando,
  vozDisponible,
  alIniciarVoz,
  alDetenerVoz,
  ordenPendiente,
  alConfirmar,
  alCancelar,
  historial,
  verificacion,
  comando,
}) {
  const [ahora] = useState(() => Date.now())
  return (
    <div className="mx-auto w-full max-w-[1440px] overflow-x-clip">
      <Encabezado conectado={conectado} cargando={cargandoPaneles} alActualizar={alActualizar} />

      <div className="grid items-start gap-4 py-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.85fr)]">
        <Chat
          mensajes={mensajes}
          entrada={entrada}
          alCambiarEntrada={alCambiarEntrada}
          alEnviar={alEnviar}
          chatRef={chatRef}
          procesando={procesando}
          transcribiendo={transcribiendo}
          hablando={hablando}
          grabando={grabando}
          vozDisponible={vozDisponible}
          alIniciarVoz={alIniciarVoz}
          alDetenerVoz={alDetenerVoz}
          ordenPendiente={ordenPendiente}
          alConfirmar={alConfirmar}
          alCancelar={alCancelar}
        />
        <UltimaAccion comando={comando} historial={historial} verificacion={verificacion} ahora={ahora} />
      </div>

      <Actividad historial={historial} ahora={ahora} />
    </div>
  )
}
