import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../context/AuthContext"
import {
  MdRefresh, MdDoneAll, MdNotificationsNone, MdCheckCircle,
  MdRouter, MdBolt, MdThermostat,
} from "react-icons/md"
import PageWrapper              from "../components/layout/PageWrapper"
import TarjetaAlerta            from "../components/common/TarjetaAlerta"
import BarraEstadisticasAlertas from "../components/common/BarraEstadisticasAlertas"
import Migas                    from "../components/common/Migas"
import DialogoConfirmacion      from "../components/common/DialogoConfirmacion"
import { usarToast }            from "../components/common/SistemaToast"
import {
  obtenerAlertas, obtenerResumenAlertas,
  resolverAlerta, ejecutarVerificacion,
} from "../api/alertas"
import clienteAPI from "../api/cliente"

const estiloSelect =
  "border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

export default function AlertasPage() {
  const { estaLogueado, esAdmin, esMantenimiento } = useAuth()
  const { mostrarToast } = usarToast()

  const [filtroSeveridad,  setFiltroSeveridad]  = useState("")
  const [filtroTipo,       setFiltroTipo]       = useState("")
  const [filtroResuelta,   setFiltroResuelta]   = useState(false)
  const [filtroSalaId,     setFiltroSalaId]     = useState("")
  const [resolviendoId,    setResolviendoId]    = useState(null)
  const [ejecutandoChecks, setEjecutandoChecks] = useState(false)

  // Estado del diálogo de confirmación para "resolver todas"
  const [dialogoResolverTodas, setDialogoResolverTodas] = useState(false)

  const puedeResolver = estaLogueado

  // ── Datos: resumen ─────────────────────────────────────────────────────────
  const { data: resumen, refetch: recargarResumen } = useQuery({
    queryKey: ["resumen-alertas"],
    queryFn:  obtenerResumenAlertas,
    refetchInterval: 30000,
  })

  // ── Datos: alertas filtradas ───────────────────────────────────────────────
  const { data: alertas = [], isLoading: cargando, refetch: recargarAlertas } = useQuery({
    queryKey: ["alertas", filtroSeveridad, filtroTipo, filtroResuelta, filtroSalaId],
    queryFn: () => obtenerAlertas({
      severidad:    filtroSeveridad || undefined,
      tipo_alerta:  filtroTipo      || undefined,
      esta_resuelta: filtroResuelta,
      sala_id:      filtroSalaId    || undefined,
      limite:       100,
    }),
    refetchInterval: 30000,
  })

  // ── Datos: salas para el filtro ────────────────────────────────────────────
  const { data: salas = [] } = useQuery({
    queryKey: ["salas"],
    queryFn:  () => clienteAPI.get("/salas").then(r => r.data),
  })

  // Mapa id → nombre para mostrar en las tarjetas
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

  async function manejarVerificacion() {
    setEjecutandoChecks(true)
    try {
      await ejecutarVerificacion()
      recargarAlertas()
      recargarResumen()
      mostrarToast("Verificación completada", "info")
    } catch (e) {
      console.error(e)
      mostrarToast("Error al ejecutar verificación", "error")
    } finally {
      setEjecutandoChecks(false)
    }
  }

  async function confirmarResolverTodas() {
    setDialogoResolverTodas(false)
    const sinResolver = alertas.filter(a => !a.esta_resuelta)
    for (const alerta of sinResolver) {
      try { await resolverAlerta(alerta.id) } catch { /* continúa con las demás */ }
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
  const alertasResueltas   = alertas.filter(a => a.esta_resuelta)
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

      <div className="flex flex-col gap-6">
        <Migas migas={[{ label: "Inicio", ruta: "/" }, { label: "Alertas", ruta: null }]} />

        {/* FILA 1 — Encabezado ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark">Alertas</h1>
            {totalSinResolver > 0
              ? <p className="text-sm text-danger font-medium mt-0.5">
                  {totalSinResolver} {totalSinResolver === 1 ? "alerta" : "alertas"} sin resolver
                </p>
              : <p className="text-sm text-success mt-0.5">Sin alertas activas</p>
            }
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {(esAdmin || esMantenimiento) && (
              <button
                onClick={manejarVerificacion}
                disabled={ejecutandoChecks}
                className="btn-secondary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ejecutandoChecks
                  ? <span className="w-4 h-4 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
                  : <MdRefresh size={16} />
                }
                Verificar ahora
              </button>
            )}

            {puedeResolver && alertasSinResolver.length > 0 && (
              <button
                onClick={() => setDialogoResolverTodas(true)}
                className="btn-secondary flex items-center gap-1.5"
              >
                <MdDoneAll size={16} /> Resolver todas
              </button>
            )}
          </div>
        </div>

        {/* FILA 2 — Barra de estadísticas ─────────────────────────────────── */}
        <BarraEstadisticasAlertas resumen={resumen} />

        {/* Banner éxito */}
        {totalSinResolver === 0 && resumen && (
          <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-center gap-3">
            <MdCheckCircle size={24} className="text-success flex-shrink-0" />
            <p className="text-sm text-success font-medium">
              Todo en orden — Sin alertas activas
            </p>
          </div>
        )}

        {/* FILA 3 — Filtros ────────────────────────────────────────────────── */}
        <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">

            <select
              value={filtroSalaId}
              onChange={e => setFiltroSalaId(e.target.value)}
              className={`${estiloSelect} w-full sm:w-auto`}
            >
              <option value="">Todos los salones</option>
              {salas.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
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
              <option value="power_anomaly">Consumo anómalo</option>
              <option value="temperature_stuck">Temperatura estancada</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroResuelta(p => !p)}
              className={`text-sm px-4 py-2 rounded-xl transition-colors ${
                filtroResuelta ? "bg-gray-200 text-dark" : "bg-gray-100 text-muted"
              }`}
            >
              Mostrar resueltas
            </button>
            <span className="bg-gray-100 text-muted text-xs px-3 py-2 rounded-xl">
              {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}
            </span>
          </div>
        </div>

        {/* FILA 4 — Lista de alertas ───────────────────────────────────────── */}
        {cargando
          ? <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card border-l-4 border-l-gray-200 animate-pulse h-28" />
              ))}
            </div>

          : alertas.length === 0
            ? <div className="flex flex-col items-center justify-center py-16 gap-3">
                <MdNotificationsNone size={48} className="text-gray-300" />
                {!filtroResuelta && !hayFiltrosActivos
                  ? <>
                      <p className="font-medium text-dark">No hay alertas activas</p>
                      <p className="text-sm text-muted">El sistema opera con normalidad</p>
                    </>
                  : <>
                      <p className="font-medium text-dark">No se encontraron alertas</p>
                      <button onClick={limpiarFiltros} className="btn-secondary mt-1">
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

                {/* Resueltas */}
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

        {/* FILA 5 — Footer informativo ─────────────────────────────────────── */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-dark mb-2">
              ¿Cómo funciona el sistema de alertas?
            </p>
            <ul className="flex flex-col gap-1.5">
              {[
                "Verificación automática cada 15 minutos",
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
                  <p className="text-xs text-muted">Potencia 50% sobre el promedio histórico</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdThermostat size={16} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-dark">Temperatura estancada</p>
                  <p className="text-xs text-muted">AC encendido pero temperatura no baja en 30 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
