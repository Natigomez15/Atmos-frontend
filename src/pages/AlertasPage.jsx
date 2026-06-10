import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../context/AuthContext"
import {
  MdDoneAll, MdNotificationsNone,
  MdRouter, MdBolt, MdThermostat,
} from "react-icons/md"
import PageWrapper         from "../components/layout/PageWrapper"
import TarjetaAlerta       from "../components/common/TarjetaAlerta"
import DialogoConfirmacion from "../components/common/DialogoConfirmacion"
import { usarToast }       from "../components/common/SistemaToast"
import {
  obtenerAlertas, obtenerResumenAlertas,
  resolverAlerta,
} from "../api/alertas"
import clienteAPI from "../api/cliente"

const SELECT_CLS =
  "h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white w-full " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

export default function AlertasPage() {
  const { estaLogueado } = useAuth()
  const { mostrarToast }  = usarToast()

  const [filtroSeveridad,      setFiltroSeveridad]      = useState("")
  const [filtroTipo,           setFiltroTipo]           = useState("")
  const [filtroResuelta,       setFiltroResuelta]       = useState(false)
  const [filtroSalaId,         setFiltroSalaId]         = useState("")
  const [resolviendoId,        setResolviendoId]        = useState(null)
  const [dialogoResolverTodas, setDialogoResolverTodas] = useState(false)

  const puedeResolver = estaLogueado

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: resumen, refetch: recargarResumen } = useQuery({
    queryKey:        ["resumen-alertas"],
    queryFn:         obtenerResumenAlertas,
    refetchInterval: 30000,
  })

  const { data: alertas = [], isLoading: cargando, refetch: recargarAlertas } = useQuery({
    queryKey: ["alertas", filtroSeveridad, filtroTipo, filtroResuelta, filtroSalaId],
    queryFn:  () => obtenerAlertas({
      severidad:     filtroSeveridad || undefined,
      tipo_alerta:   filtroTipo      || undefined,
      esta_resuelta: filtroResuelta,
      sala_id:       filtroSalaId    || undefined,
      limite:        100,
    }),
    refetchInterval: 30000,
  })

  const { data: salas = [] } = useQuery({
    queryKey: ["salas"],
    queryFn:  () => clienteAPI.get("/salas").then(r => r.data),
  })

  const mapaSalas = Object.fromEntries(salas.map(s => [s.id, s.nombre]))

  // ── Acciones ───────────────────────────────────────────────────────────────
  async function manejarResolver(alertaId) {
    setResolviendoId(alertaId)
    try {
      await resolverAlerta(alertaId)
      recargarAlertas()
      recargarResumen()
      mostrarToast("Alerta resuelta correctamente")
    } catch (e) {
      console.error(e)
      mostrarToast("Error al resolver la alerta", "error")
    } finally {
      setResolviendoId(null)
    }
  }

  async function confirmarResolverTodas() {
    setDialogoResolverTodas(false)
    const sinResolver = alertas.filter(a => !a.esta_resuelta)
    for (const alerta of sinResolver) {
      try { await resolverAlerta(alerta.id) } catch { /* continúa */ }
    }
    recargarAlertas()
    recargarResumen()
    mostrarToast(`${sinResolver.length} alertas resueltas`)
  }

  function limpiarFiltros() {
    setFiltroSeveridad("")
    setFiltroTipo("")
    setFiltroResuelta(false)
    setFiltroSalaId("")
  }

  // ── Derivados ──────────────────────────────────────────────────────────────
  const alertasSinResolver = alertas.filter(a => !a.esta_resuelta)
  const alertasResueltas   = alertas.filter(a =>  a.esta_resuelta)
  const hayFiltrosActivos  = filtroSeveridad || filtroTipo || filtroSalaId
  const totalSinResolver   = resumen?.total_sin_resolver ?? 0

  return (
    <PageWrapper>
      <DialogoConfirmacion
        abierto={dialogoResolverTodas}
        titulo="Resolver todas las alertas"
        mensaje="¿Marcar todas las alertas activas como resueltas? Esta acción no se puede deshacer."
        etiquetaConfirmar="Resolver todas"
        peligroso={true}
        alConfirmar={confirmarResolverTodas}
        alCancelar={() => setDialogoResolverTodas(false)}
      />

      <div className="flex flex-col gap-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary font-semibold">
              Monitoreo
            </p>
            <h1 className="text-xl lg:text-2xl font-bold text-dark mt-0.5">
              Centro de alertas
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {totalSinResolver > 0
                ? <span className="text-danger font-medium">
                    {totalSinResolver} {totalSinResolver === 1 ? "alerta activa" : "alertas activas"}
                  </span>
                : "Supervisa eventos críticos y condiciones fuera de rango."
              }
            </p>
          </div>

          {puedeResolver && alertasSinResolver.length > 0 && (
            <button
              onClick={() => setDialogoResolverTodas(true)}
              className="btn-secondary flex items-center gap-1.5 self-start"
            >
              <MdDoneAll size={16} /> Resolver todas
            </button>
          )}
        </div>

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <select
              value={filtroSalaId}
              onChange={e => setFiltroSalaId(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Todos los salones</option>
              {salas.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>

            <select
              value={filtroSeveridad}
              onChange={e => setFiltroSeveridad(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Toda severidad</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>

            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Todos los tipos</option>
              <option value="node_offline">Nodo sin señal</option>
              <option value="power_anomaly">Consumo anómalo</option>
              <option value="temperature_stuck">Temperatura estancada</option>
              <option value="sensor_datos_invalidos">Sensor con datos inválidos</option>
              <option value="temperatura_alta">Temperatura alta</option>
              <option value="temperatura_fuera_rango">Temperatura fuera de rango</option>
              <option value="humedad_alta">Humedad alta</option>
              <option value="humedad_invalida">Humedad inválida</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setFiltroResuelta(p => !p)}
                className={`h-10 flex-1 text-sm rounded-xl transition-colors ${
                  filtroResuelta ? "bg-gray-200 text-dark" : "bg-gray-100 text-muted"
                }`}
              >
                Resueltas
              </button>
              <span className="h-10 flex items-center bg-gray-100 text-muted text-xs px-3 rounded-xl whitespace-nowrap">
                {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Lista ───────────────────────────────────────────────────────── */}
        {cargando
          ? <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card border-l-4 border-l-gray-200 animate-pulse h-24" />
              ))}
            </div>

          : alertas.length === 0
            ? <div className="card flex flex-col items-center justify-center py-10 lg:py-14 text-center">
                <MdNotificationsNone size={40} className="text-gray-300 mb-3" />
                {!filtroResuelta && !hayFiltrosActivos
                  ? <>
                      <p className="font-semibold text-dark">Sin alertas activas</p>
                      <p className="text-sm text-muted mt-1">El sistema opera con normalidad.</p>
                    </>
                  : <>
                      <p className="font-semibold text-dark">No se encontraron alertas</p>
                      <button onClick={limpiarFiltros} className="btn-secondary mt-3">
                        Limpiar filtros
                      </button>
                    </>
                }
              </div>

            : <div className="flex flex-col gap-5">
                {alertasSinResolver.length > 0 && (
                  <div>
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">
                      Sin resolver ({alertasSinResolver.length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {alertasSinResolver.map(alerta => (
                        <TarjetaAlerta
                          key={alerta.id}
                          alerta={alerta}
                          nombreSala={mapaSalas[alerta.sala_id] ?? "Sala desconocida"}
                          alResolver={manejarResolver}
                          resolviendo={resolviendoId === alerta.id}
                          puedeResolver={puedeResolver}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filtroResuelta && alertasResueltas.length > 0 && (
                  <div className="opacity-60">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">
                      Resueltas ({alertasResueltas.length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {alertasResueltas.map(alerta => (
                        <TarjetaAlerta
                          key={alerta.id}
                          alerta={alerta}
                          nombreSala={mapaSalas[alerta.sala_id] ?? "Sala desconocida"}
                          alResolver={manejarResolver}
                          resolviendo={resolviendoId === alerta.id}
                          puedeResolver={puedeResolver}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
        }

        {/* ── Footer informativo ──────────────────────────────────────────── */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted font-semibold uppercase tracking-wide select-none list-none flex items-center gap-1.5">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Información del sistema de alertas
          </summary>

          <div className="mt-3 bg-primary/5 border border-primary/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-sm font-semibold text-dark mb-2">¿Cómo funciona?</p>
              <ul className="flex flex-col gap-1.5">
                {[
                  "Verificación automática cada 15 minutos",
                  "Las alertas se resuelven solas cuando el problema desaparece",
                  "Puedes resolver manualmente si atendiste el problema",
                ].map((texto, i) => (
                  <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span> {texto}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-dark mb-2">Tipos de alerta</p>
              <div className="flex flex-col gap-2">
                {[
                  { icon: <MdRouter size={15} className="text-danger" />,    titulo: "Nodo sin señal",          desc: "ESP32 sin comunicación por más de 10 minutos" },
                  { icon: <MdBolt size={15} className="text-warning" />,     titulo: "Consumo anómalo",         desc: "Potencia 50% sobre el promedio histórico" },
                  { icon: <MdThermostat size={15} className="text-warning" />,titulo: "Temperatura estancada",  desc: "AC encendido pero temperatura no baja en 30 min" },
                  { icon: <MdThermostat size={15} className="text-danger" />, titulo: "Datos inválidos",        desc: "Lecturas recientes inválidas desde ESP32 o sensor" },
                ].map(({ icon, titulo, desc }) => (
                  <div key={titulo} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="text-xs font-medium text-dark">{titulo}</p>
                      <p className="text-xs text-muted">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

      </div>
    </PageWrapper>
  )
}
