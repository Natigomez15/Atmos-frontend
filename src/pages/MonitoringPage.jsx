import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  MdThermostat,
  MdWaterDrop,
  MdBolt,
  MdPerson,
  MdPersonOff,
  MdAir,
  MdPower,
  MdDeviceThermostat,
  MdWarning,
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
    hour: "2-digit", minute: "2-digit", hour12: false,
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

function construirDatosPotenciaPorDia(lecturas) {
  const porDia = {}
  deduplicar(lecturas).forEach(l => {
    if (!l.recorded_at || l.power_w == null) return
    const dia = new Date(l.recorded_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
    if (!porDia[dia]) porDia[dia] = { suma: 0, count: 0 }
    porDia[dia].suma  += l.power_w
    porDia[dia].count += 1
  })
  return Object.entries(porDia).map(([dia, { suma }]) => ({
    tiempo: dia, potencia_w: Math.round(suma),
  }))
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function BadgeConexion({ estaConectado, reconectando }) {
  if (estaConectado) return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      Tiempo real
    </span>
  )
  if (reconectando) return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-warning bg-warning/10 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
      Reconectando…
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted bg-gray-100 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Sin conexión
    </span>
  )
}

function EstadoAC({ lecturaActual, onComandos }) {
  const encendido = lecturaActual?.ac_is_on
  const setpoint  = lecturaActual?.setpoint_c

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-dark">Estado AC</p>
          <p className="text-xs text-muted mt-0.5">Solo lectura</p>
        </div>
        <button onClick={onComandos} className="btn-secondary text-xs shrink-0">
          Comandos →
        </button>
      </div>

      {/* Estado principal */}
      <div className={`rounded-xl p-4 flex items-center gap-3 border transition-colors ${
        encendido
          ? "bg-secondary/5 border-secondary/20"
          : "bg-gray-50 border-gray-100"
      }`}>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          encendido ? "bg-secondary/15" : "bg-gray-100"
        }`}>
          <MdAir size={20} className={encendido ? "text-secondary" : "text-muted"} />
        </span>
        <div className="flex-1">
          <p className={`text-lg font-bold leading-tight ${encendido ? "text-secondary" : "text-muted"}`}>
            {encendido ? "Encendido" : "Apagado"}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {encendido ? "Aire acondicionado activo" : "Aire acondicionado inactivo"}
          </p>
        </div>
        {encendido && (
          <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
        )}
      </div>

      {/* Setpoint */}
      <div className="flex items-center gap-3 px-1">
        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <MdDeviceThermostat size={16} className="text-primary" />
        </span>
        <div>
          <p className="text-[11px] text-muted uppercase tracking-wide font-medium">Temperatura objetivo</p>
          <p className="text-base font-bold text-dark tabular-nums">
            {setpoint != null ? `${setpoint} °C` : "—"}
          </p>
        </div>
      </div>

      {/* Error AC */}
      {lecturaActual?.ac_error && (
        <div className="flex items-start gap-2 rounded-xl bg-warning/8 border border-warning/20 p-3">
          <MdWarning size={15} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-warning">Atención</p>
            <p className="text-xs text-muted mt-0.5">{lecturaActual.ac_error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

export default function MonitoringPage() {
  const [parametrosBusqueda, setParametrosBusqueda] = useSearchParams()
  const navegar = useNavigate()

  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState(
    parametrosBusqueda.get("room_id") ?? null
  )
  const [lecturasEnVivo, setLecturasEnVivo] = useState([])
  const [horasHistorico, setHorasHistorico] = useState(6)
  const [aireSeleccionado, setAireSeleccionado] = useState(null)

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

  const { ultimaLectura: nuevaLecturaWs, estaConectado, reconectando } = useRoomWebSocket(idSalonSeleccionado)

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
    return construirDatosGrafico([...(historico ?? []), ...lecturasEnVivo])
  }, [historico, lecturasEnVivo])

  const datosPotenciaDia = useMemo(() => {
    return construirDatosPotenciaPorDia([...(historico ?? []), ...lecturasEnVivo])
  }, [historico, lecturasEnVivo])

  const valoresPotenciaDia = datosPotenciaDia.map(d => d.potencia_w).filter(Boolean)
  const promedioPotencia   = valoresPotenciaDia.length
    ? (valoresPotenciaDia.reduce((a, b) => a + b, 0) / valoresPotenciaDia.length).toFixed(0)
    : "—"
  const picoPotencia = valoresPotenciaDia.length
    ? Math.max(...valoresPotenciaDia).toFixed(0)
    : "—"

  const ultimasLecturas = useMemo(() => {
    return deduplicar([...(historico ?? []), ...lecturasEnVivo])
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
      .slice(0, 10)
  }, [historico, lecturasEnVivo])

  function cambiarSalon(e) {
    const nuevoId = e.target.value
    setIdSalonSeleccionado(nuevoId)
    setParametrosBusqueda({ room_id: nuevoId })
  }

  const nombreSala = salonSeleccionado?.name ?? salonSeleccionado?.nombre ?? "Laboratorio"

  return (
    <PageWrapper>

      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div className="mb-5 pb-4 border-b border-gray-100">

        {/* Mobile: columna — Desktop: fila */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

          {/* Bloque de información */}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
              Monitoreo en tiempo real
            </p>
            <h1 className="text-2xl font-bold text-dark tracking-tight leading-none mb-2">
              {nombreSala}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <BadgeConexion estaConectado={estaConectado} reconectando={reconectando} />
              {lecturaActual?.recorded_at && (
                <span className="text-xs text-muted">
                  · {formatearHora(lecturaActual.recorded_at)}
                </span>
              )}
            </div>
          </div>

          {/* Selectores */}
          {(salones?.length > 1 || airesDisponibles?.length > 1) && (
            <div className="flex gap-2 sm:shrink-0">
              {salones?.length > 1 && (
                <div className="flex-1 sm:flex-initial">
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">
                    Sala
                  </label>
                  <select
                    value={idSalonSeleccionado ?? ""}
                    onChange={cambiarSalon}
                    className="w-full sm:w-auto min-h-[40px] text-sm font-medium text-dark bg-gray-50
                               border border-gray-200 rounded-xl px-3 outline-none
                               focus:ring-2 focus:ring-secondary/30 focus:border-secondary
                               transition-colors cursor-pointer"
                  >
                    {salones.map(salon => (
                      <option key={salon.id} value={salon.id}>{salon.name ?? salon.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              {airesDisponibles?.length > 1 && (
                <div className="flex-1 sm:flex-initial">
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">
                    Aire
                  </label>
                  <select
                    value={aireActivo ?? ""}
                    onChange={e => setAireSeleccionado(e.target.value)}
                    className="w-full sm:w-auto min-h-[40px] text-sm font-medium text-dark bg-gray-50
                               border border-gray-200 rounded-xl px-3 outline-none
                               focus:ring-2 focus:ring-secondary/30 focus:border-secondary
                               transition-colors cursor-pointer"
                  >
                    {airesDisponibles.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Banner diagnóstico ──────────────────────────────────────────── */}
      {diagnosticoLecturas?.diagnostico?.posible_fallo_sensor && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/8 px-4 py-3">
          <MdWarning size={16} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-dark">Lecturas inválidas detectadas</p>
            <p className="text-xs text-muted mt-0.5">
              Usando última lectura válida disponible. Inválidas:{" "}
              {diagnosticoLecturas.diagnostico.lecturas_invalidas}/
              {diagnosticoLecturas.diagnostico.lecturas_revisadas}{" "}
              ({diagnosticoLecturas.diagnostico.porcentaje_invalidas}%)
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Métricas en vivo ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <LiveMetric
          etiqueta="Temperatura"
          valor={lecturaActual?.temperature ?? null}
          unidad="°C"
          icono={<MdThermostat size={16} />}
          color={lecturaActual?.temperature > 26 ? "warning" : "secondary"}
          tamano="md"
        />
        <LiveMetric
          etiqueta="Salida aire"
          valor={lecturaActual?.outlet_temperature ?? null}
          unidad="°C"
          icono={<MdThermostat size={16} />}
          color="primary"
          tamano="md"
        />
        <LiveMetric
          etiqueta="Humedad"
          valor={lecturaActual?.humidity ?? null}
          unidad="%"
          icono={<MdWaterDrop size={16} />}
          color="primary"
          tamano="md"
        />
        <LiveMetric
          etiqueta="Potencia"
          valor={lecturaActual?.power_w ?? null}
          unidad="W"
          icono={<MdBolt size={16} />}
          color="secondary"
          tamano="md"
        />

        {/* Presencia — mismo estilo que LiveMetric */}
        <div className="card flex flex-col gap-2.5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              lecturaActual?.presence ? "bg-success/10" : "bg-gray-100"
            }`}>
              {lecturaActual?.presence
                ? <MdPerson size={16} className="text-success" />
                : <MdPersonOff size={16} className="text-muted" />
              }
            </span>
            <p className="text-xs text-muted font-medium">Presencia</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold leading-none ${
              lecturaActual?.presence ? "text-success" : "text-gray-300"
            }`}>
              {lecturaActual?.presence ? "Sí" : "No"}
            </span>
            {lecturaActual?.presence && (
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Gráficos + columna derecha ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">

        {/* Gráficos */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="font-semibold text-dark">Temperatura y Humedad</p>
                <p className="text-xs text-muted mt-0.5">Últimas {horasHistorico} horas</p>
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {[6, 12, 24].map(h => (
                  <button
                    key={h}
                    onClick={() => setHorasHistorico(h)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                      horasHistorico === h
                        ? "bg-white text-secondary shadow-sm"
                        : "text-muted hover:text-dark"
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
              <div>
                <p className="font-semibold text-dark">Consumo eléctrico</p>
                <p className="text-xs text-muted mt-0.5">Por día</p>
              </div>
              <div className="flex gap-3 text-xs text-muted">
                <span>Promedio: <strong className="text-dark">{promedioPotencia} W</strong></span>
                <span>Pico: <strong className="text-dark">{picoPotencia} W</strong></span>
              </div>
            </div>
            <PowerChart datos={datosPotenciaDia} cargando={cargandoHistorico} />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">

          <EstadoAC lecturaActual={lecturaActual} onComandos={() => navegar("/commands")} />

          {/* Comandos pendientes */}
          <div className="card flex-1 flex flex-col max-h-[360px] min-h-0">
            <p className="font-semibold text-dark mb-3">Comandos pendientes</p>
            {!comandosPendientes?.length ? (
              <div className="flex items-center gap-2 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                <p className="text-xs text-muted">Sin comandos pendientes</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto pr-1 min-h-0">
                {comandosPendientes.map((cmd, i) => (
                  <div
                    key={cmd.id ?? i}
                    className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-warning shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-dark capitalize">
                        {cmd.command_type}
                        {cmd.setpoint != null && <span className="text-secondary"> → {cmd.setpoint}°C</span>}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">{minutosAtras(cmd.commanded_at)}</p>
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
        <p className="font-semibold text-dark mb-4">Últimas lecturas</p>

        {ultimasLecturas.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">Sin lecturas disponibles</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {ultimasLecturas.map((l, i) => (
              <div key={l.recorded_at ?? i} className="py-3 first:pt-0 last:pb-0">
                {/* Hora + badges */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-dark tabular-nums">{formatearHora(l.recorded_at)}</span>
                  <div className="flex gap-1.5">
                    {l.presence && <span className="badge-success">Presencia</span>}
                    <span className={l.ac_is_on ? "badge-success" : "badge-muted"}>
                      AC {l.ac_is_on ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
                {/* Métricas en fila */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { label: "Temp",        valor: l.temperature?.toFixed(1),       unidad: "°C" },
                    { label: "Salida aire", valor: l.outlet_temperature?.toFixed(1), unidad: "°C" },
                    { label: "Humedad",     valor: l.humidity?.toFixed(0),           unidad: "%" },
                    { label: "Potencia",    valor: l.power_w?.toFixed(0),            unidad: "W" },
                  ].map(({ label, valor, unidad }) => (
                    <div key={label} className="bg-gray-50 rounded-lg px-2.5 py-2">
                      <p className="text-[10px] text-muted mb-0.5">{label}</p>
                      <p className="font-semibold text-dark tabular-nums">
                        {valor ?? "—"}{valor ? <span className="font-normal text-muted"> {unidad}</span> : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </PageWrapper>
  )
}
