import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  MdThermostat,
  MdWaterDrop,
  MdBolt,
  MdPerson,
  MdPersonOff,
} from "react-icons/md"

import PageWrapper       from "../components/layout/PageWrapper"
import LiveMetric        from "../components/common/LiveMetric"
import TempHumidityChart from "../components/charts/TempHumidityChart"
import PowerChart        from "../components/charts/PowerChart"

import {
  obtenerSalones,
  obtenerUltimaLectura,
  obtenerLecturasHistoricas,
  obtenerComandosPendientes,
  obtenerDiagnosticoLecturas,
  obtenerAiresDeSalon,
} from "../api/monitoring"
import { useRoomWebSocket } from "../hooks/useRoomWebSocket"

// ── Utilidades ─────────────────────────────────────────────────────────────

function formatearHora(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function minutosAtras(iso) {
  if (!iso) return "—"
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutos < 1)  return "ahora"
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)} h`
}

function deduplicar(lecturas) {
  const vistas = new Set()
  return lecturas.filter(l => {
    if (vistas.has(l.recorded_at)) return false
    vistas.add(l.recorded_at)
    return true
  })
}

function construirDatosGrafico(lecturas) {
  return deduplicar(lecturas)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
    .map(l => ({
      tiempo:      formatearHora(l.recorded_at),
      temperatura: l.temperature,
      humedad:     l.humidity,
      potencia_w:  l.power_w,
    }))
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [parametrosBusqueda, setParametrosBusqueda] = useSearchParams()
  const navegar = useNavigate()

  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState(
    parametrosBusqueda.get("room_id") ?? null
  )
  const [lecturasEnVivo, setLecturasEnVivo] = useState([])
  const [horasHistorico,  setHorasHistorico]  = useState(6)
  const [aireSeleccionado, setAireSeleccionado] = useState(null)

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: salones } = useQuery({
    queryKey: ["rooms"],
    queryFn:  obtenerSalones,
  })

  const { data: comandosPendientes } = useQuery({
    queryKey:        ["pending-commands", idSalonSeleccionado],
    queryFn:         () => obtenerComandosPendientes(idSalonSeleccionado),
    enabled:         !!idSalonSeleccionado,
    refetchInterval: 15000,
  })

  // ── WebSocket ──────────────────────────────────────────────────────────

  const {
    ultimaLectura: nuevaLecturaWs,
    estaConectado,
    reconectando,
  } = useRoomWebSocket(idSalonSeleccionado)

  useEffect(() => {
    if (!nuevaLecturaWs) return
    const { type, ...lectura } = nuevaLecturaWs
    setLecturasEnVivo(prev => [...prev.slice(-49), lectura])
  }, [nuevaLecturaWs])

  useEffect(() => {
    setLecturasEnVivo([])
    setAireSeleccionado(null)
  }, [idSalonSeleccionado])

  useEffect(() => {
    if (!idSalonSeleccionado && salones?.length) {
      const primerIdSalon = String(salones[0].id)
      setIdSalonSeleccionado(primerIdSalon)
      setParametrosBusqueda({ room_id: primerIdSalon })
    }
  }, [salones, idSalonSeleccionado, setParametrosBusqueda])

  // ── Datos derivados ────────────────────────────────────────────────────

  const salonSeleccionado = salones?.find(s => String(s.id) === idSalonSeleccionado)

  const aireActivo = aireSeleccionado ?? salonSeleccionado?.aires?.[0] ?? null

  const { data: airesDisponibles } = useQuery({
    queryKey: ["aires", idSalonSeleccionado],
    queryFn:  () => obtenerAiresDeSalon(salonSeleccionado),
    enabled:  !!salonSeleccionado,
  })

  const { data: lecturaMasReciente } = useQuery({
    queryKey:        ["latest-reading", idSalonSeleccionado, aireActivo],
    queryFn:         () => obtenerUltimaLectura(salonSeleccionado, aireActivo),
    enabled:         !!salonSeleccionado,
    refetchInterval: 10000,
  })

  const { data: diagnosticoLecturas } = useQuery({
    queryKey:        ["reading-diagnostics", idSalonSeleccionado, aireActivo],
    queryFn:         () => obtenerDiagnosticoLecturas(salonSeleccionado, aireActivo),
    enabled:         !!salonSeleccionado,
    refetchInterval: 10000,
  })

  const { data: historico, isLoading: cargandoHistorico } = useQuery({
    queryKey:        ["historical", idSalonSeleccionado, horasHistorico, aireActivo],
    queryFn:         () => obtenerLecturasHistoricas(salonSeleccionado, horasHistorico, aireActivo),
    enabled:         !!salonSeleccionado,
    refetchInterval: 300000,
  })

  const lecturaActual = useMemo(() => {
    if (!nuevaLecturaWs) return lecturaMasReciente
    const { type, ...datos } = nuevaLecturaWs
    return datos
  }, [nuevaLecturaWs, lecturaMasReciente])

  const datosGrafico = useMemo(() => {
    const todasLasLecturas = [...(historico ?? []), ...lecturasEnVivo]
    return construirDatosGrafico(todasLasLecturas)
  }, [historico, lecturasEnVivo])

  const valoresPotencia  = datosGrafico.map(d => d.potencia_w).filter(Boolean)
  const promedioPotencia = valoresPotencia.length
    ? (valoresPotencia.reduce((a, b) => a + b, 0) / valoresPotencia.length).toFixed(0)
    : "—"
  const picoPotencia = valoresPotencia.length
    ? Math.max(...valoresPotencia).toFixed(0)
    : "—"

  const ultimasLecturas = useMemo(() => {
    const combinadas = deduplicar([...(historico ?? []), ...lecturasEnVivo])
    return combinadas
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
      .slice(0, 10)
  }, [historico, lecturasEnVivo])

  // ── Handlers ───────────────────────────────────────────────────────────

  function cambiarSalon(e) {
    const nuevoId = e.target.value
    setIdSalonSeleccionado(nuevoId)
    setParametrosBusqueda({ room_id: nuevoId })
  }

  // ── Render ─────────────────────────────────────────────────────────────

  // Evitar "Laboratorio Laboratorio" — usar nombre directo sin prefijo
  const nombreSala = salonSeleccionado?.name ?? salonSeleccionado?.nombre ?? "Laboratorio"

  const badgeConexion = estaConectado
    ? { color: "text-success", dot: "bg-success animate-pulse", txt: "Tiempo real" }
    : reconectando
      ? { color: "text-warning", dot: "bg-warning animate-pulse", txt: "Reconectando…" }
      : { color: "text-muted",   dot: "bg-gray-400",              txt: "Sin conexión" }

  return (
    <PageWrapper>

      {/* ── 1. Header ────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-dark truncate">
              {nombreSala}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {/* Estado conexión — punto + texto, sin cápsula */}
              <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs ${badgeConexion.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeConexion.dot}`} />
                {badgeConexion.txt}
              </span>
              {/* Info del salón */}
              {salonSeleccionado && (
                <span className="hidden sm:inline text-xs text-muted">
                  {salonSeleccionado.area_m2}m²
                  {" · "}{salonSeleccionado.capacity} personas
                  {salonSeleccionado.ac_brand && ` · ${salonSeleccionado.ac_brand}`}
                </span>
              )}
            </div>
          </div>

          {/* Selectores */}
          <div className="flex flex-col gap-2 sm:min-w-[200px]">
            {/* Selector de sala — solo si hay más de una */}
            {salones?.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted shrink-0">Ver sala:</span>
                <select
                  value={idSalonSeleccionado ?? ""}
                  onChange={cambiarSalon}
                  className="h-10 flex-1 border border-gray-200 rounded-xl px-3 bg-white text-dark text-sm
                             focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                >
                  {salones.map(salon => (
                    <option key={salon.id} value={salon.id}>{salon.name ?? salon.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de aire */}
            {airesDisponibles?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted shrink-0">Ver aire:</span>
                <select
                  value={aireActivo ?? ""}
                  onChange={e => setAireSeleccionado(e.target.value)}
                  className="h-10 flex-1 border border-gray-200 rounded-xl px-3 bg-white text-dark text-sm
                             focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                >
                  {airesDisponibles.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Banner diagnóstico ─────────────────────────────────────────── */}
      {diagnosticoLecturas?.diagnostico?.posible_fallo_sensor && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-sm font-semibold text-dark">
            Advertencia: lecturas inválidas recientes del ESP32 o sensor.
          </p>
          <p className="text-xs text-muted mt-1">
            Usando última lectura válida disponible.
            {" "}Inválidas: {diagnosticoLecturas.diagnostico.lecturas_invalidas}
            /{diagnosticoLecturas.diagnostico.lecturas_revisadas}
            {" "}({diagnosticoLecturas.diagnostico.porcentaje_invalidas}%).
          </p>
        </div>
      )}

      {/* ── 3. Métricas en vivo ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <LiveMetric
          etiqueta="Temperatura"
          valor={lecturaActual?.temperature ?? null}
          unidad="°C"
          icono={<MdThermostat size={18} />}
          color={lecturaActual?.temperature > 26 ? "warning" : "secondary"}
          tamano="md"
        />
        <LiveMetric
          etiqueta="Salida aire"
          valor={lecturaActual?.outlet_temperature ?? null}
          unidad="°C"
          icono={<MdThermostat size={18} />}
          color="primary"
          tamano="md"
        />
        <LiveMetric
          etiqueta="Humedad"
          valor={lecturaActual?.humidity ?? null}
          unidad="%"
          icono={<MdWaterDrop size={18} />}
          color="primary"
          tamano="md"
        />

        {/* Presencia — alineada con LiveMetric */}
        <div className={`card border-l-4 p-2 lg:p-4 ${lecturaActual?.presence ? "border-l-secondary" : "border-l-gray-200"}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            {lecturaActual?.presence
              ? <MdPerson size={16} className="text-secondary" />
              : <MdPersonOff size={16} className="text-muted" />
            }
            <p className="text-[10px] lg:text-xs text-muted uppercase tracking-wide truncate">Presencia</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm lg:text-xl font-bold leading-tight ${lecturaActual?.presence ? "text-secondary" : "text-muted"}`}>
              {lecturaActual?.presence ? "Sí" : "No"}
            </span>
            {lecturaActual?.presence && (
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            )}
          </div>
        </div>

        <LiveMetric
          etiqueta="Potencia"
          valor={lecturaActual?.power_w ?? null}
          unidad="W"
          icono={<MdBolt size={18} />}
          color="secondary"
          tamano="md"
        />
      </div>

      {/* ── 4. Gráficos + columna derecha ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">

        {/* Columna izquierda — gráficos */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="font-semibold text-dark text-sm">
                Temperatura y Humedad — últimas {horasHistorico}h
              </p>
              <div className="flex gap-1">
                {[6, 12, 24].map(h => (
                  <button
                    key={h}
                    onClick={() => setHorasHistorico(h)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      horasHistorico === h
                        ? "bg-secondary/10 text-secondary"
                        : "text-muted hover:bg-gray-50"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <TempHumidityChart datos={datosGrafico} cargando={cargandoHistorico} />
          </div>

          <div className="card">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <p className="font-semibold text-dark text-sm">
                Consumo eléctrico — últimas {horasHistorico}h
              </p>
              <p className="text-xs text-muted">
                Promedio: {promedioPotencia} W · Pico: {picoPotencia} W
              </p>
            </div>
            <PowerChart datos={datosGrafico} cargando={cargandoHistorico} />
          </div>
        </div>

        {/* Columna derecha — AC + comandos */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Estado AC */}
          <div className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-semibold text-dark text-sm">Estado AC</p>
                <p className="text-xs text-muted mt-0.5">Solo lectura.</p>
              </div>
              <button
                onClick={() => navegar("/commands")}
                className="btn-secondary text-xs shrink-0"
              >
                Comandos
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-muted uppercase tracking-wide">Encendido</p>
                <p className="text-lg font-semibold text-dark mt-1">
                  {lecturaActual?.ac_is_on ? "Sí" : "No"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-muted uppercase tracking-wide">Setpoint</p>
                <p className="text-lg font-semibold text-dark mt-1">
                  {lecturaActual?.setpoint_c != null ? `${lecturaActual.setpoint_c}°C` : "—"}
                </p>
              </div>
            </div>

            {lecturaActual?.ac_error && (
              <div className="mt-3 rounded-xl bg-warning/10 border border-warning/20 p-3">
                <p className="text-xs font-semibold text-warning">Atención</p>
                <p className="text-xs text-muted mt-0.5">{lecturaActual.ac_error}</p>
              </div>
            )}
          </div>

          {/* Comandos pendientes */}
          <div className="card">
            <p className="font-semibold text-dark text-sm mb-3">Comandos pendientes</p>
            {!comandosPendientes?.length ? (
              <p className="text-xs text-muted">Sin comandos pendientes</p>
            ) : (
              <div className="flex flex-col gap-2">
                {comandosPendientes.map((cmd, i) => (
                  <div
                    key={cmd.id ?? i}
                    className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-dark capitalize">
                        {cmd.command_type}
                        {cmd.setpoint != null && ` → ${cmd.setpoint}°C`}
                      </p>
                      <p className="text-xs text-muted">{minutosAtras(cmd.commanded_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Últimas lecturas ───────────────────────────────────────────── */}
      <div className="card">
        <p className="font-semibold text-dark text-sm mb-4">Últimas lecturas</p>

        {/* Vista móvil — cards por lectura */}
        <div className="flex flex-col gap-2 sm:hidden">
          {ultimasLecturas.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">Sin lecturas disponibles</p>
          ) : ultimasLecturas.map((l, i) => (
            <div key={l.recorded_at ?? i} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-dark">{formatearHora(l.recorded_at)}</span>
                <div className="flex gap-1.5">
                  {l.presence
                    ? <span className="badge-success">Presencia</span>
                    : null
                  }
                  {l.ac_is_on
                    ? <span className="badge-success">AC ON</span>
                    : <span className="badge-muted">AC OFF</span>
                  }
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted">Temp</p>
                  <p className="font-medium text-dark">{l.temperature?.toFixed(1) ?? "—"}°C</p>
                </div>
                <div>
                  <p className="text-muted">Salida aire</p>
                  <p className="font-medium text-dark">{l.outlet_temperature?.toFixed(1) ?? "—"}°C</p>
                </div>
                <div>
                  <p className="text-muted">Humedad</p>
                  <p className="font-medium text-dark">{l.humidity?.toFixed(0) ?? "—"}%</p>
                </div>
                <div>
                  <p className="text-muted">Potencia</p>
                  <p className="font-medium text-dark">{l.power_w?.toFixed(0) ?? "—"} W</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vista desktop — tabla */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  { label: "Hora",      cls: "" },
                  { label: "Temp",      cls: "" },
                  { label: "Salida",    cls: "hidden lg:table-cell" },
                  { label: "Humedad",   cls: "hidden lg:table-cell" },
                  { label: "Presencia", cls: "" },
                  { label: "AC",        cls: "" },
                  { label: "Potencia",  cls: "" },
                  { label: "Energía",   cls: "hidden md:table-cell" },
                ].map(col => (
                  <th key={col.label} className={`text-left pb-2 pr-4 text-muted font-medium uppercase tracking-wide ${col.cls}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimasLecturas.map((l, i) => (
                <tr key={l.recorded_at ?? i} className={`border-b border-gray-50 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                  <td className="py-2 pr-4 text-muted">{formatearHora(l.recorded_at)}</td>
                  <td className="py-2 pr-4 font-medium text-dark">{l.temperature?.toFixed(1) ?? "—"} °C</td>
                  <td className="py-2 pr-4 font-medium text-dark hidden lg:table-cell">{l.outlet_temperature?.toFixed(1) ?? "—"} °C</td>
                  <td className="py-2 pr-4 font-medium text-dark hidden lg:table-cell">{l.humidity?.toFixed(0) ?? "—"} %</td>
                  <td className="py-2 pr-4">
                    {l.presence ? <span className="badge-success">Sí</span> : <span className="badge-muted">No</span>}
                  </td>
                  <td className="py-2 pr-4">
                    {l.ac_is_on ? <span className="badge-success">ON</span> : <span className="badge-muted">OFF</span>}
                  </td>
                  <td className="py-2 pr-4 font-medium text-dark">{l.power_w?.toFixed(0) ?? "—"} W</td>
                  <td className="py-2 font-medium text-dark hidden md:table-cell">{l.energy_wh?.toFixed(2) ?? "—"} Wh</td>
                </tr>
              ))}
              {!ultimasLecturas.length && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted">Sin lecturas disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </PageWrapper>
  )
}
