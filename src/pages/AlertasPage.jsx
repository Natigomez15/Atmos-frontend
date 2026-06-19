import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../context/AuthContext"
import {
  MdDoneAll, MdNotificationsNone,
  MdRouter, MdBolt, MdThermostat,
  MdFilterList, MdClose,
} from "react-icons/md"
import PageWrapper         from "../components/layout/PageWrapper"
import PageHeader          from "../components/common/PageHeader"
import TarjetaAlerta       from "../components/common/TarjetaAlerta"
import DialogoConfirmacion from "../components/common/DialogoConfirmacion"
import { usarToast }       from "../components/common/SistemaToast"
import {
  obtenerAlertas, obtenerResumenAlertas,
  resolverAlerta,
} from "../api/alertas"
import clienteAPI from "../api/cliente"

export default function AlertasPage() {
  const { estaLogueado } = useAuth()
  const { mostrarToast }  = usarToast()

  const [filtroTipo,           setFiltroTipo]           = useState("")
  const [filtroResuelta,       setFiltroResuelta]       = useState(false)
  const [filtroSalaId,         setFiltroSalaId]         = useState("")
  const [resolviendoId,        setResolviendoId]        = useState(null)
  const [dialogoResolverTodas, setDialogoResolverTodas] = useState(false)
  const [filtrosAbiertos,      setFiltrosAbiertos]      = useState(false)

  const puedeResolver = estaLogueado

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: resumen, refetch: recargarResumen } = useQuery({
    queryKey:        ["resumen-alertas"],
    queryFn:         obtenerResumenAlertas,
    refetchInterval: 30000,
  })

  const { data: alertas = [], isLoading: cargando, refetch: recargarAlertas } = useQuery({
    queryKey: ["alertas", filtroTipo, filtroResuelta, filtroSalaId],
    queryFn:  () => obtenerAlertas({
      tipo_alerta:   filtroTipo   || undefined,
      esta_resuelta: filtroResuelta,
      sala_id:       filtroSalaId || undefined,
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
    setFiltroTipo("")
    setFiltroResuelta(false)
    setFiltroSalaId("")
  }

  // ── Derivados ──────────────────────────────────────────────────────────────
  const alertasSinResolver = alertas.filter(a => !a.esta_resuelta)
  const alertasResueltas   = alertas.filter(a =>  a.esta_resuelta)
  const hayFiltrosActivos  = filtroTipo || filtroSalaId || filtroResuelta
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

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <PageHeader
          eyebrow="Supervisión del sistema"
          title="Centro de alertas"
          description={
            totalSinResolver > 0
              ? <span className="text-danger font-semibold">
                  {totalSinResolver} {totalSinResolver === 1 ? "alerta activa" : "alertas activas"}
                </span>
              : "Supervisa eventos críticos y condiciones fuera de rango."
          }
          actions={
            puedeResolver && alertasSinResolver.length > 0
              ? <button
                  onClick={() => setDialogoResolverTodas(true)}
                  className="btn-secondary flex items-center gap-1.5"
                >
                  <MdDoneAll size={16} /> Resolver todas
                </button>
              : null
          }
        />

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="card p-4">

          {/* Mobile: fila compacta con botón acordeón */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setFiltrosAbiertos(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                hayFiltrosActivos || filtrosAbiertos
                  ? "bg-secondary/10 border-secondary/30 text-secondary"
                  : "bg-white border-gray-200 text-muted"
              }`}
            >
              <MdFilterList size={15} />
              Filtros
              {hayFiltrosActivos && (
                <span className="w-1.5 h-1.5 rounded-full bg-secondary ml-0.5" />
              )}
            </button>

            <p className="text-xs text-muted ml-auto">
              {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}
            </p>

            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 text-xs text-secondary font-medium"
              >
                <MdClose size={13} /> Limpiar
              </button>
            )}
          </div>

          {/* Mobile: panel expandible */}
          {filtrosAbiertos && (
            <div className="flex flex-col gap-2 mt-3 sm:hidden">
              <select
                value={filtroSalaId}
                onChange={e => setFiltroSalaId(e.target.value)}
                className="input-base w-full"
              >
                <option value="">Todas las salas</option>
                {salas.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>

              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="input-base w-full"
              >
                <option value="">Todos los tipos</option>
                <option value="node_offline">Nodo sin señal</option>
                <option value="aire_sin_datos">Aire sin datos</option>
                <option value="control_ir_inactivo">Señal IR detenida</option>
                <option value="power_anomaly">Consumo anómalo</option>
                <option value="temperature_stuck">Temp. estancada</option>
                <option value="sensor_datos_invalidos">Datos inválidos</option>
                <option value="temperatura_alta">Temp. alta</option>
                <option value="temperatura_fuera_rango">Temp. fuera de rango</option>
                <option value="humedad_alta">Humedad alta</option>
                <option value="humedad_invalida">Humedad inválida</option>
              </select>

              <button
                onClick={() => setFiltroResuelta(p => !p)}
                className={`w-full h-[42px] px-4 text-sm rounded-xl border font-medium transition-all duration-150 ${
                  filtroResuelta
                    ? "bg-secondary/10 border-secondary/30 text-secondary"
                    : "bg-white border-gray-200 text-muted"
                }`}
              >
                {filtroResuelta ? "Ocultando resueltas" : "Mostrar resueltas"}
              </button>
            </div>
          )}

          {/* Desktop: barra horizontal completa */}
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 mb-3">
              <MdFilterList size={15} className="text-muted" />
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Filtros</p>
              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  className="ml-auto flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 font-medium transition-colors"
                >
                  <MdClose size={13} /> Limpiar
                </button>
              )}
            </div>

            <div className="flex flex-row gap-2">
              <select
                value={filtroSalaId}
                onChange={e => setFiltroSalaId(e.target.value)}
                className="input-base flex-1"
              >
                <option value="">Todas las salas</option>
                {salas.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>

              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="input-base flex-1"
              >
                <option value="">Todos los tipos</option>
                <option value="node_offline">Nodo sin señal</option>
                <option value="aire_sin_datos">Aire sin datos</option>
                <option value="control_ir_inactivo">Señal IR detenida</option>
                <option value="power_anomaly">Consumo anómalo</option>
                <option value="temperature_stuck">Temp. estancada</option>
                <option value="sensor_datos_invalidos">Datos inválidos</option>
                <option value="temperatura_alta">Temp. alta</option>
                <option value="temperatura_fuera_rango">Temp. fuera de rango</option>
                <option value="humedad_alta">Humedad alta</option>
                <option value="humedad_invalida">Humedad inválida</option>
              </select>

              <button
                onClick={() => setFiltroResuelta(p => !p)}
                className={`shrink-0 h-[42px] px-4 text-sm rounded-xl border font-medium transition-all duration-150 whitespace-nowrap ${
                  filtroResuelta
                    ? "bg-secondary/10 border-secondary/30 text-secondary"
                    : "bg-white border-gray-200 text-muted hover:border-gray-300 hover:text-dark"
                }`}
              >
                Mostrar resueltas
              </button>
            </div>

            <p className="text-xs text-muted mt-3">
              {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"} encontradas
            </p>
          </div>

        </div>

        {/* ── Lista ───────────────────────────────────────────────────────── */}
        {cargando ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card border-l-4 border-l-gray-200 animate-pulse h-24" />
            ))}
          </div>

        ) : alertas.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MdNotificationsNone size={28} className="text-gray-300" />
            </div>
            {!filtroResuelta && !hayFiltrosActivos ? (
              <>
                <p className="font-semibold text-dark">Sin alertas activas</p>
                <p className="text-sm text-muted mt-1">El sistema opera con normalidad.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-dark">No se encontraron alertas</p>
                <p className="text-sm text-muted mt-1">Prueba ajustando los filtros.</p>
                <button onClick={limpiarFiltros} className="btn-secondary mt-4">
                  Limpiar filtros
                </button>
              </>
            )}
          </div>

        ) : (
          <div className="flex flex-col gap-6">
            {alertasSinResolver.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  <p className="text-xs font-bold text-dark uppercase tracking-wider">
                    Sin resolver
                  </p>
                  <span className="badge-danger ml-1">{alertasSinResolver.length}</span>
                </div>
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
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <p className="text-xs font-bold text-dark uppercase tracking-wider">
                    Resueltas
                  </p>
                  <span className="badge-success ml-1">{alertasResueltas.length}</span>
                </div>
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
        )}

        {/* ── Footer informativo ──────────────────────────────────────────── */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted font-semibold uppercase tracking-wider select-none list-none flex items-center gap-1.5">
            <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
            Información del sistema de alertas
          </summary>

          <div className="mt-4 bg-primary/5 border border-primary/10 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-dark mb-3">¿Cómo funciona?</p>
              <ul className="flex flex-col gap-2">
                {[
                  "Verificación automática cada 15 minutos",
                  "Las alertas se resuelven solas cuando el problema desaparece",
                  "Puedes resolver manualmente si atendiste el problema",
                ].map((texto, i) => (
                  <li key={i} className="text-xs text-muted flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted mt-1.5 shrink-0" />
                    {texto}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-dark mb-3">Tipos de alerta</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <MdRouter size={14} className="text-danger" />,     titulo: "Nodo sin señal",      desc: "ESP32 sin comunicación por más de 10 minutos" },
                  { icon: <MdBolt size={14} className="text-warning" />,      titulo: "Consumo anómalo",     desc: "Potencia 50% sobre el promedio histórico" },
                  { icon: <MdThermostat size={14} className="text-warning" />,titulo: "Temp. estancada",     desc: "AC encendido pero temperatura no baja en 30 min" },
                  { icon: <MdThermostat size={14} className="text-danger" />, titulo: "Datos inválidos",     desc: "Lecturas recientes inválidas desde ESP32 o sensor" },
                ].map(({ icon, titulo, desc }) => (
                  <div key={titulo} className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 border border-gray-100 mt-0.5">
                      {icon}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-dark">{titulo}</p>
                      <p className="text-xs text-muted mt-0.5">{desc}</p>
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
