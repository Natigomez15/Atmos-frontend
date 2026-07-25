import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../context/AuthContext"
import {
  MdRefresh, MdDoneAll, MdNotificationsNone, MdCheckCircle,
  MdRouter, MdBolt, MdThermostat, MdAutoGraph,
} from "react-icons/md"
import PageWrapper     from "../components/layout/PageWrapper"
import PageHeader      from "../components/common/PageHeader"
import AlertCard       from "../components/common/AlertCard"
import AlertStatsBar   from "../components/common/AlertStatsBar"
import AccionProtegida  from "../components/common/AccionProtegida"
import {
  obtenerAlertas, obtenerResumenAlertas, resolverAlerta, ejecutarChecks,
} from "../api/alerts"
import cliente from "../api/client"

const estiloSelect =
  "border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

function minutosDesde(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}


const ACCIONES_ML = {
  apagar: "Apagar el Aire 1",
  encender_22: "Encender / regular a 22 °C",
  encender_23: "Regular a 23 °C",
  ahorro_24: "Modo ahorro a 24 °C",
  enfriar_fuerte: "Enfriamiento fuerte a 22 °C",
}

function textoAccionML(accion) {
  return ACCIONES_ML[String(accion ?? "").trim().toLowerCase()] ?? accion ?? "Acción no disponible"
}

function formatoNumero(valor, decimales = 1) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero.toFixed(decimales) : "—"
}

function fechaLegible(iso) {
  if (!iso) return "—"
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return "—"

  return fecha.toLocaleString("es-PA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function textoPresencia(valor) {
  if (valor === true || Number(valor) === 1) return "Detectada"
  if (valor === false || Number(valor) === 0) return "No detectada"
  return "—"
}

export default function AlertsPage() {
  const { estaLogueado } = useAuth()
  const [filtroSeveridad, setFiltroSeveridad] = useState("")
  const [filtroTipo,      setFiltroTipo]      = useState("")
  const [filtroResueltas, setFiltroResueltas] = useState(false)
  const [filtroSalon,     setFiltroSalon]     = useState("")
  const [resolviendo,     setResolviendo]     = useState(null)
  const [ejecutandoChecks, setEjecutandoChecks] = useState(false)
  const [procesandoDecisionML, setProcesandoDecisionML] = useState(false)
  const [resultadoDecisionML, setResultadoDecisionML] = useState(null)

  const { data: resumen, refetch: recargarResumen } = useQuery({
    queryKey: ["resumen-alertas"],
    queryFn:  obtenerResumenAlertas,
    refetchInterval: 30000,
  })

  const {
    data: decisionPendienteML,
    isLoading: cargandoDecisionML,
    refetch: recargarDecisionML,
  } = useQuery({
    queryKey: ["decision-ml-pendiente", "robotica", "Aire_1"],
    queryFn: () =>
      cliente
        .get("/ml/decisiones/pendiente", {
          params: { area: "robotica", aire: "Aire_1" },
        })
        .then(r => r.data),
    refetchInterval: 5000,
    retry: 1,
  })

  const { data: alertas = [], isLoading: cargandoAlertas, refetch: recargarAlertas } = useQuery({
    queryKey: ["alertas", filtroSeveridad, filtroTipo, filtroResueltas, filtroSalon],
    queryFn: () => obtenerAlertas({
      severity:    filtroSeveridad || undefined,
      alert_type:  filtroTipo     || undefined,
      is_resolved: filtroResueltas,
      room_id:     filtroSalon    || undefined,
      limit:       100,
    }),
    refetchInterval: 30000,
  })

  const { data: salones = [] } = useQuery({
    queryKey: ["salones"],
    queryFn:  () => cliente.get("/rooms").then(r => r.data),
  })

  const mapaSalones = Object.fromEntries(salones.map(salon => [salon.sala_id, salon.nombre]))

  const decisionML =
    decisionPendienteML?.hay_pendiente === true
      ? decisionPendienteML.decision
      : null

  async function manejarAceptarDecisionML() {
    if (!decisionML?.decision_id || procesandoDecisionML) return

    setProcesandoDecisionML(true)
    setResultadoDecisionML(null)

    try {
      const respuesta = await cliente.post(
        "/ml/decisiones/pendiente/aceptar",
        {
          decision_id: decisionML.decision_id,
          area: decisionML.area ?? "robotica",
          aire: decisionML.aire ?? "Aire_1",
        }
      )

      setResultadoDecisionML({
        tipo: "success",
        mensaje:
          respuesta.data?.mensaje ??
          "Decisión aceptada. ATMOS procesó el comando.",
      })

      await recargarDecisionML()
      recargarAlertas()
      recargarResumen()
    } catch (error) {
      console.error(error)

      const detalle = error?.response?.data?.detail
      const mensaje =
        typeof detalle === "string"
          ? detalle
          : detalle?.mensaje ??
            "No se pudo aceptar la decisión. El comando no fue enviado."

      setResultadoDecisionML({
        tipo: "error",
        mensaje,
      })

      await recargarDecisionML()
    } finally {
      setProcesandoDecisionML(false)
    }
  }

  async function manejarRechazarDecisionML() {
    if (!decisionML?.decision_id || procesandoDecisionML) return

    setProcesandoDecisionML(true)
    setResultadoDecisionML(null)

    try {
      const respuesta = await cliente.post(
        "/ml/decisiones/pendiente/rechazar",
        {
          decision_id: decisionML.decision_id,
          area: decisionML.area ?? "robotica",
          aire: decisionML.aire ?? "Aire_1",
          motivo: "rechazada_desde_pagina_alertas",
        }
      )

      setResultadoDecisionML({
        tipo: "neutral",
        mensaje:
          respuesta.data?.mensaje ??
          "Decisión rechazada. No se envió ningún comando.",
      })

      await recargarDecisionML()
      recargarAlertas()
      recargarResumen()
    } catch (error) {
      console.error(error)

      const detalle = error?.response?.data?.detail
      const mensaje =
        typeof detalle === "string"
          ? detalle
          : detalle?.mensaje ??
            "No se pudo rechazar la decisión."

      setResultadoDecisionML({
        tipo: "error",
        mensaje,
      })

      await recargarDecisionML()
    } finally {
      setProcesandoDecisionML(false)
    }
  }

  async function manejarResolver(idAlerta) {
    setResolviendo(idAlerta)
    try {
      await resolverAlerta(idAlerta)
      recargarAlertas()
      recargarResumen()
    } catch (e) {
      console.error(e)
    } finally {
      setResolviendo(null)
    }
  }

  async function manejarEjecutarChecks() {
    setEjecutandoChecks(true)
    try {
      await ejecutarChecks()
      recargarAlertas()
      recargarResumen()
      recargarDecisionML()
    } catch (e) {
      console.error(e)
    } finally {
      setEjecutandoChecks(false)
    }
  }

  async function manejarResolverTodas() {
    const sinResolver = alertas.filter(a => !a.is_resolved)
    if (!sinResolver.length) return
    const confirmado = window.confirm(
      `¿Marcar todas las alertas activas como resueltas? (${sinResolver.length} alertas)`
    )
    if (!confirmado) return
    for (const alerta of sinResolver) {
      try { await resolverAlerta(alerta.id) } catch { /* continúa con las demás */ }
    }
    recargarAlertas()
    recargarResumen()
  }

  function limpiarFiltros() {
    setFiltroSeveridad("")
    setFiltroTipo("")
    setFiltroResueltas(false)
    setFiltroSalon("")
  }

  const alertasSinResolver = alertas.filter(a => !a.is_resolved)
  const alertasResueltas   = alertas.filter(a => a.is_resolved)
  const hayFiltrosActivos  = filtroSeveridad || filtroTipo || filtroSalon

  const minutosUltimoChequeo = minutosDesde(resumen?.last_check_at)

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">

        <PageHeader
          title="Alertas"
          description={decisionML
            ? `${resumen?.total_unresolved ?? 0} alertas técnicas · 1 decisión ML esperando aprobación`
            : (resumen?.total_unresolved ?? 0) > 0
              ? `${resumen.total_unresolved} alertas activas sin resolver`
              : "Sin alertas activas"
          }
          actions={(
            <div className="flex flex-wrap gap-2">
              <button
                onClick={manejarEjecutarChecks}
                disabled={ejecutandoChecks}
                title="Ejecuta todos los checks manualmente"
                className="btn-secondary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ejecutandoChecks
                  ? <span className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
                  : <MdRefresh size={16} />
                }
                Verificar ahora
              </button>
              {estaLogueado && alertasSinResolver.length > 0 && (
                <AccionProtegida requiereRol="mantenimiento">
                  <button
                    onClick={manejarResolverTodas}
                    className="btn-secondary flex items-center gap-1.5"
                  >
                    <MdDoneAll size={16} /> Marcar todas resueltas
                  </button>
                </AccionProtegida>
              )}
            </div>
          )}
        />

        {/* DECISIÓN ML PENDIENTE — requiere aprobación humana */}
        {decisionML && (
          <div className="rounded-2xl border border-secondary/25 bg-secondary/5 overflow-hidden">
            <div className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                    <MdAutoGraph size={23} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-dark">
                        Decisión del Machine Learning pendiente
                      </p>

                      <span className="px-2.5 py-1 rounded-full bg-warning/10 text-warning text-[10px] font-semibold uppercase tracking-wide">
                        Esperando aprobación
                      </span>
                    </div>

                    <p className="text-xs text-muted mt-1">
                      Aire 1 · Laboratorio de Robótica
                    </p>

                    <p className="text-lg font-semibold text-dark mt-3">
                      {textoAccionML(decisionML.accion)}
                    </p>

                    <p className="text-xs text-muted mt-1 leading-5">
                      El modelo propone esta acción, pero ATMOS no la enviará al aire acondicionado hasta que un usuario autorizado la acepte.
                    </p>
                  </div>
                </div>

                <div className="lg:text-right flex-shrink-0">
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-muted">
                    Confianza del modelo
                  </p>
                  <p className="text-2xl font-semibold text-dark mt-0.5">
                    {decisionML.confianza_ml != null
                      ? `${Math.round(Number(decisionML.confianza_ml) * 100)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-5">
                <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                  <p className="text-[10px] text-muted">Temperatura ambiente</p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {decisionML.lectura_contexto?.temperatura_ambiente != null
                      ? `${formatoNumero(decisionML.lectura_contexto.temperatura_ambiente)} °C`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                  <p className="text-[10px] text-muted">Salida del aire</p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {decisionML.lectura_contexto?.temperatura_salida_aire != null
                      ? `${formatoNumero(decisionML.lectura_contexto.temperatura_salida_aire)} °C`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                  <p className="text-[10px] text-muted">Humedad</p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {decisionML.lectura_contexto?.humedad != null
                      ? `${formatoNumero(decisionML.lectura_contexto.humedad)} %`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-gray-100 px-3 py-3">
                  <p className="text-[10px] text-muted">Presencia</p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {textoPresencia(decisionML.lectura_contexto?.presencia)}
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-gray-100 px-3 py-3 col-span-2 lg:col-span-1">
                  <p className="text-[10px] text-muted">Potencia</p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {decisionML.lectura_contexto?.potencia_w != null
                      ? `${formatoNumero(decisionML.lectura_contexto.potencia_w)} W`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-4 pt-4 border-t border-secondary/15">
                <div className="text-[10px] text-muted leading-5">
                  <p>
                    Detectada: <span className="font-medium text-dark">{fechaLegible(decisionML.creada_en)}</span>
                  </p>
                  <p>
                    Válida hasta: <span className="font-medium text-dark">{fechaLegible(decisionML.expira_en)}</span>
                  </p>
                  {decisionML.estado_electrico_observado && (
                    <p>
                      Estado eléctrico observado:{" "}
                      <span className="font-medium text-dark">
                        {decisionML.estado_electrico_observado}
                      </span>
                    </p>
                  )}
                </div>

                {estaLogueado ? (
                  <AccionProtegida requiereRol="mantenimiento">
                    <div className="flex flex-col sm:flex-row gap-2 sm:min-w-[320px]">
                      <button
                        type="button"
                        onClick={manejarRechazarDecisionML}
                        disabled={procesandoDecisionML}
                        className="btn-secondary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {procesandoDecisionML ? "Procesando..." : "Rechazar"}
                      </button>

                      <button
                        type="button"
                        onClick={manejarAceptarDecisionML}
                        disabled={procesandoDecisionML}
                        className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {procesandoDecisionML
                          ? "Procesando..."
                          : "Aceptar y enviar"}
                      </button>
                    </div>
                  </AccionProtegida>
                ) : (
                  <p className="text-xs text-warning">
                    Inicia sesión con rol mantenimiento o administrador para responder.
                  </p>
                )}
              </div>

              <div className="mt-3 rounded-xl bg-warning/10 px-3.5 py-3 text-xs text-warning leading-5">
                <strong>Importante:</strong> mientras esta decisión está pendiente, ATMOS no publica este comando en Firebase.
              </div>
            </div>
          </div>
        )}

        {cargandoDecisionML && !decisionML && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
            <p className="text-xs text-muted">
              Consultando decisiones pendientes del Machine Learning...
            </p>
          </div>
        )}

        {resultadoDecisionML && (
          <div
            className={`rounded-xl px-4 py-3 border text-sm ${
              resultadoDecisionML.tipo === "success"
                ? "bg-success/5 border-success/20 text-success"
                : resultadoDecisionML.tipo === "error"
                  ? "bg-danger/5 border-danger/20 text-danger"
                  : "bg-gray-50 border-gray-200 text-dark"
            }`}
          >
            {resultadoDecisionML.mensaje}
          </div>
        )}

        {/* ROW 2 — Stats bar */}
        <AlertStatsBar resumen={resumen} />

        {/* Banner de todo en orden */}
        {(resumen?.total_unresolved ?? 1) === 0 && !decisionML && (
          <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-center gap-3">
            <MdCheckCircle size={24} className="text-success flex-shrink-0" />
            <div>
              <p className="text-sm text-success font-medium">
                Todo en orden — No hay alertas activas en este momento
              </p>
              {minutosUltimoChequeo != null && (
                <p className="text-xs text-muted mt-0.5">
                  Último chequeo: hace {minutosUltimoChequeo} {minutosUltimoChequeo === 1 ? "minuto" : "minutos"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ROW 3 — Filtros */}
        <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <select
              value={filtroSalon}
              onChange={e => setFiltroSalon(e.target.value)}
              className={`${estiloSelect} w-full sm:w-auto`}
            >
              <option value="">Todos los salones</option>
              {salones.map(s => (
                <option key={s.sala_id} value={s.sala_id}>{s.nombre}</option>
              ))}
            </select>

            <select
              value={filtroSeveridad}
              onChange={e => setFiltroSeveridad(e.target.value)}
              className={`${estiloSelect} w-full sm:w-auto`}
            >
              <option value="">Toda severidad</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className={`${estiloSelect} w-full sm:w-auto`}
            >
              <option value="">Todos los tipos</option>
              <option value="node_offline">Nodo sin señal</option>
              <option value="aire_sin_datos">Aire sin datos</option>
              <option value="control_ir_inactivo">Señal IR detenida</option>
              <option value="power_anomaly">Consumo anómalo</option>
              <option value="temperature_stuck">Temperatura estancada</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroResueltas(p => !p)}
              className={`text-sm px-4 py-2 rounded-xl transition-colors ${
                filtroResueltas ? "bg-gray-200 text-dark" : "bg-gray-100 text-muted"
              }`}
            >
              Mostrar resueltas
            </button>
            <span className="bg-gray-100 text-muted text-xs px-3 py-1 rounded-full">
              {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}
            </span>
          </div>
        </div>

        {/* ROW 4 — Lista de alertas */}
        {cargandoAlertas
          ? <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card border-l-4 border-l-gray-200 animate-pulse h-28" />
              ))}
            </div>
          : alertas.length === 0
            ? <div className="flex flex-col items-center justify-center py-16 gap-3">
                <MdNotificationsNone size={48} className="text-gray-300" />
                {!filtroResueltas && !hayFiltrosActivos
                  ? <>
                      <p className="font-medium text-dark">No hay alertas activas</p>
                      <p className="text-sm text-muted">El sistema está operando con normalidad</p>
                    </>
                  : <>
                      <p className="font-medium text-dark">No se encontraron alertas con estos filtros</p>
                      <button onClick={limpiarFiltros} className="btn-secondary text-sm mt-1">
                        Limpiar filtros
                      </button>
                    </>
                }
              </div>
            : <div className="flex flex-col gap-6">

                {/* Sin resolver */}
                {alertasSinResolver.length > 0 && (
                  <div>
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">
                      Sin resolver ({alertasSinResolver.length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {alertasSinResolver.map(alerta => (
                        <AlertCard
                          key={alerta.id}
                          alerta={alerta}
                          nombreSalon={mapaSalones[alerta.sala_id] ?? "Salón desconocido"}
                          alResolver={manejarResolver}
                          resolviendo={resolviendo === alerta.id}
                          puedeResolver={estaLogueado}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Resueltas */}
                {filtroResueltas && alertasResueltas.length > 0 && (
                  <div className="opacity-60">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">
                      Resueltas ({alertasResueltas.length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {alertasResueltas.map(alerta => (
                        <AlertCard
                          key={alerta.id}
                          alerta={alerta}
                          nombreSalon={mapaSalones[alerta.sala_id] ?? "Salón desconocido"}
                          alResolver={manejarResolver}
                          resolviendo={resolviendo === alerta.id}
                          puedeResolver={estaLogueado}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
        }

        {/* ROW 5 — Info footer */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-dark mb-2">¿Cómo funciona el sistema de alertas?</p>
            <ul className="flex flex-col gap-1.5">
              {[
                "El sistema verifica automáticamente cada 15 minutos",
                "Las alertas se resuelven solas cuando el problema desaparece",
                "Puedes resolver manualmente si atendiste el problema",
              ].map((texto, i) => (
                <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                  <span className="mt-0.5">•</span> {texto}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-2">Tipos de alerta</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <MdRouter size={16} className="text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-dark">Nodo sin señal</p>
                  <p className="text-xs text-muted">ESP32 sin comunicación por más de 10 minutos</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdBolt size={16} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-dark">Consumo anómalo</p>
                  <p className="text-xs text-muted">Potencia 50% por encima del promedio histórico</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdThermostat size={16} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-dark">Temperatura estancada</p>
                  <p className="text-xs text-muted">AC encendido pero temperatura no baja en 30 min</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdAutoGraph size={16} className="text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-dark">Decisión del Machine Learning</p>
                  <p className="text-xs text-muted">Una acción física propuesta espera aceptación o rechazo antes de llegar a Firebase</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
