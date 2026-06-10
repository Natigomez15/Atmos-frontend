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
import PageHeader        from "../components/common/PageHeader"
import LiveMetric        from "../components/common/LiveMetric"
import TempHumidityChart from "../components/charts/TempHumidityChart"
import PowerChart        from "../components/charts/PowerChart"
import Migas             from "../components/common/Migas"

import {
  obtenerSalones,
  obtenerUltimaLectura,
  obtenerLecturasHistoricas,
  obtenerComandosPendientes,
  obtenerDiagnosticoLecturas,
} from "../api/monitoring"
import { useRoomWebSocket } from "../hooks/useRoomWebSocket"

// ── Utilidades ──────────────────────────────────────────────────────────────

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
      tiempo:     formatearHora(l.recorded_at),
      temperatura: l.temperature,
      humedad:     l.humidity,
      potencia_w:  l.power_w,
    }))
}

// ── Componente ──────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [parametrosBusqueda, setParametrosBusqueda] = useSearchParams()
  const navegar = useNavigate()

  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState(
    parametrosBusqueda.get("room_id") ?? null
  )
  const [lecturasEnVivo, setLecturasEnVivo] = useState([])
  const [horasHistorico,  setHorasHistorico]  = useState(6)

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

  // Acumular lecturas en vivo (máx 50)
  useEffect(() => {
    if (!nuevaLecturaWs) return
    const { type, ...lectura } = nuevaLecturaWs
    setLecturasEnVivo(prev => [...prev.slice(-49), lectura])
  }, [nuevaLecturaWs])

  // Resetear lecturas en vivo al cambiar de salón
  useEffect(() => {
    setLecturasEnVivo([])
  }, [idSalonSeleccionado])

  // Inicializar con primer salón si no hay room_id en URL
  useEffect(() => {
    if (!idSalonSeleccionado && salones?.length) {
      const primerIdSalon = String(salones[0].id)
      setIdSalonSeleccionado(primerIdSalon)
      setParametrosBusqueda({ room_id: primerIdSalon })
    }
  }, [salones, idSalonSeleccionado, setParametrosBusqueda])

  // ── Datos derivados ────────────────────────────────────────────────────

  const salonSeleccionado = salones?.find(s => String(s.id) === idSalonSeleccionado)

  const { data: lecturaMasReciente, refetch: recargarLectura } = useQuery({
    queryKey:        ["latest-reading", idSalonSeleccionado],
    queryFn:         () => obtenerUltimaLectura(salonSeleccionado),
    enabled:         !!salonSeleccionado,
    refetchInterval: 60000,
  })

  const { data: diagnosticoLecturas } = useQuery({
    queryKey:        ["reading-diagnostics", idSalonSeleccionado],
    queryFn:         () => obtenerDiagnosticoLecturas(salonSeleccionado),
    enabled:         !!salonSeleccionado,
    refetchInterval: 60000,
  })

  const { data: historico, isLoading: cargandoHistorico } = useQuery({
    queryKey:        ["historical", idSalonSeleccionado, horasHistorico],
    queryFn:         () => obtenerLecturasHistoricas(salonSeleccionado, horasHistorico),
    enabled:         !!salonSeleccionado,
    refetchInterval: 300000,
  })

  // Lectura más reciente: WS tiene prioridad sobre la query
  const lecturaActual = useMemo(() => {
    if (!nuevaLecturaWs) return lecturaMasReciente
    const { type, ...datos } = nuevaLecturaWs
    return datos
  }, [nuevaLecturaWs, lecturaMasReciente])

  // Combinar histórico + en vivo para gráficos
  const datosGrafico = useMemo(() => {
    const todasLasLecturas = [...(historico ?? []), ...lecturasEnVivo]
    return construirDatosGrafico(todasLasLecturas)
  }, [historico, lecturasEnVivo])

  // Estadísticas de potencia
  const valoresPotencia = datosGrafico.map(d => d.potencia_w).filter(Boolean)
  const promedioPotencia = valoresPotencia.length
    ? (valoresPotencia.reduce((a, b) => a + b, 0) / valoresPotencia.length).toFixed(0)
    : "—"
  const picoPotencia = valoresPotencia.length
    ? Math.max(...valoresPotencia).toFixed(0)
    : "—"

  // Tabla: últimas 10 lecturas combinadas, más reciente primero
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

  function cambiarHorasHistorico(horas) {
    setHorasHistorico(horas)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const nombreSalaActual = salonSeleccionado?.name ?? salonSeleccionado?.nombre ?? "Laboratorio"

  return (
    <PageWrapper>
      <Migas migas={[
        { label: "Inicio",         ruta: "/" },
        { label: "Vista general",  ruta: "/pabellon" },
        { label: nombreSalaActual, ruta: null },
      ]} />

      <div className="mb-6">
        <PageHeader
          eyebrow="Monitoreo"
          title={`Laboratorio ${nombreSalaActual}`}
          description="Observa lecturas, presencia y estado energético en tiempo real."
          actions={(
            <select
              value={idSalonSeleccionado ?? ""}
              onChange={cambiarSalon}
              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-dark text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              {salones?.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name}</option>
              ))}
            </select>
          )}
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted">
          {salonSeleccionado && (
            <p>
              Área: {salonSeleccionado.area_m2}m²
              {" • "}Capacidad: {salonSeleccionado.capacity} personas
              {salonSeleccionado.ac_brand && (
                <> • AC: {salonSeleccionado.ac_brand} {salonSeleccionado.ac_model}</>
              )}
            </p>
          )}

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                estaConectado
                  ? "bg-success animate-pulse"
                  : reconectando
                    ? "bg-warning animate-pulse"
                    : "bg-danger"
              }`}
            />
            {estaConectado
              ? "Tiempo real activo"
              : reconectando
                ? "Reconectando..."
                : "Sin conexión"
            }
          </div>
        </div>
      </div>

      {/* ── Fila 2: Métricas en vivo ─────────────────────────────────── */}
      {diagnosticoLecturas?.diagnostico?.posible_fallo_sensor && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-sm font-semibold text-dark">
            Advertencia: se detectaron lecturas invalidas recientes del ESP32 o sensor.
          </p>
          <p className="text-xs text-muted mt-1">
            El sistema esta usando la ultima lectura valida disponible.
            {" "}Invalidas: {diagnosticoLecturas.diagnostico.lecturas_invalidas}
            /{diagnosticoLecturas.diagnostico.lecturas_revisadas}
            {" "}({diagnosticoLecturas.diagnostico.porcentaje_invalidas}%).
            {" "}Estado: {diagnosticoLecturas.diagnostico.estado_sensor}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <LiveMetric
          etiqueta="Temperatura"
          valor={lecturaActual?.temperature ?? null}
          unidad="°C"
          icono={<MdThermostat size={18} />}
          color={lecturaActual?.temperature > 26 ? "warning" : "secondary"}
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

        {/* Tarjeta de presencia personalizada */}
        <div className="card border-l-4 border-l-secondary flex flex-col items-center justify-center py-4 gap-2">
          {lecturaActual?.presence ? (
            <>
              <div className="flex items-center gap-1.5">
                <MdPerson size={32} className="text-secondary" />
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
              <p className="font-medium text-dark text-sm">Ocupado</p>
            </>
          ) : (
            <>
              <MdPersonOff size={32} className="text-muted" />
              <p className="font-medium text-muted text-sm">Vacío</p>
            </>
          )}
          <p className="text-xs text-muted uppercase tracking-wide">Presencia</p>
        </div>

        <LiveMetric
          etiqueta="Potencia estimada"
          valor={lecturaActual?.power_w ?? null}
          unidad="W"
          icono={<MdBolt size={18} />}
          color="secondary"
          tamano="md"
        />
      </div>

      {/* ── Fila 3: Gráficos + Control AC ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Columna izquierda — 65% */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Gráfico temperatura y humedad */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="font-semibold text-dark text-sm">
                  Temperatura y Humedad — últimas {horasHistorico}h
                </p>
              </div>
              <div className="flex gap-1">
                {[6, 12, 24].map(horas => (
                  <button
                    key={horas}
                    onClick={() => cambiarHorasHistorico(horas)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      horasHistorico === horas
                        ? "bg-secondary/10 text-secondary"
                        : "text-muted hover:bg-gray-50"
                    }`}
                  >
                    {horas}h
                  </button>
                ))}
              </div>
            </div>
            <TempHumidityChart datos={datosGrafico} cargando={cargandoHistorico} />
          </div>

          {/* Gráfico potencia */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <p className="font-semibold text-dark text-sm">
                Consumo eléctrico — últimas {horasHistorico}h
              </p>
              <p className="text-xs text-muted">
                Promedio: {promedioPotencia} W &bull; Pico: {picoPotencia} W
              </p>
            </div>
            <PowerChart datos={datosGrafico} cargando={cargandoHistorico} />
          </div>
        </div>

        {/* Columna derecha — 35% */}
        <div className="lg:col-span-2 flex flex-col gap-4">

            <div className="card">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div>
                <p className="font-semibold text-dark text-sm">Estado AC</p>
                <p className="text-xs text-muted mt-0.5">Solo lectura. Usa la página de comandos para cambiar el setpoint.</p>
              </div>
              <button
                onClick={() => navegar("/commands")}
                className="btn-secondary text-sm"
              >
                Ir a Comandos
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-muted uppercase tracking-wide">Encendido</p>
                <p className="text-lg font-semibold text-dark mt-1">
                  {lecturaActual?.ac_is_on ? "Sí" : "No"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-muted uppercase tracking-wide">Setpoint</p>
                <p className="text-lg font-semibold text-dark mt-1">
                  {lecturaActual?.setpoint_c != null ? `${lecturaActual.setpoint_c} °C` : "—"}
                </p>
              </div>
              {lecturaActual?.ac_error && (
                <div className="rounded-2xl bg-warning/10 border border-warning/20 p-4">
                  <p className="text-xs font-semibold text-warning">Atención</p>
                  <p className="text-xs text-muted mt-1">{lecturaActual.ac_error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <p className="font-semibold text-dark text-sm mb-3">Comandos pendientes</p>
            {!comandosPendientes?.length ? (
              <p className="text-xs text-muted">Sin comandos pendientes</p>
            ) : (
              <div className="flex flex-col gap-2">
                {comandosPendientes.map((comando, i) => (
                  <div
                    key={comando.id ?? i}
                    className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-dark capitalize">
                        {comando.command_type}
                        {comando.setpoint != null && ` → ${comando.setpoint}°C`}
                      </p>
                      <p className="text-xs text-muted">{minutosAtras(comando.commanded_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fila 4: Tabla de últimas lecturas ───────────────────────── */}
      <div className="card">
        <p className="font-semibold text-dark text-sm mb-4">Últimas lecturas</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  { etiqueta: "Hora",      clase: "" },
                  { etiqueta: "Temp",      clase: "" },
                  { etiqueta: "Humedad",   clase: "hidden lg:table-cell" },
                  { etiqueta: "Presencia", clase: "" },
                  { etiqueta: "AC",        clase: "" },
                  { etiqueta: "Potencia",  clase: "" },
                  { etiqueta: "Energía",   clase: "hidden md:table-cell" },
                ].map(col => (
                  <th key={col.etiqueta} className={`text-left pb-2 pr-4 text-muted font-medium uppercase tracking-wide ${col.clase}`}>
                    {col.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimasLecturas.map((lectura, i) => (
                <tr
                  key={lectura.recorded_at ?? i}
                  className={`border-b border-gray-50 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}
                >
                  <td className="py-2 pr-4 text-muted">{formatearHora(lectura.recorded_at)}</td>
                  <td className="py-2 pr-4 font-medium text-dark">
                    {lectura.temperature?.toFixed(1) ?? "—"} °C
                  </td>
                  <td className="py-2 pr-4 font-medium text-dark hidden lg:table-cell">
                    {lectura.humidity?.toFixed(0) ?? "—"} %
                  </td>
                  <td className="py-2 pr-4">
                    {lectura.presence
                      ? <span className="badge-success">Sí</span>
                      : <span className="badge-muted">No</span>
                    }
                  </td>
                  <td className="py-2 pr-4">
                    {lectura.ac_is_on
                      ? <span className="badge-success">ON</span>
                      : <span className="badge-muted">OFF</span>
                    }
                  </td>
                  <td className="py-2 pr-4 font-medium text-dark">
                    {lectura.power_w?.toFixed(0) ?? "—"} W
                  </td>
                  <td className="py-2 font-medium text-dark hidden md:table-cell">
                    {lectura.energy_wh?.toFixed(2) ?? "—"} Wh
                  </td>
                </tr>
              ))}
              {!ultimasLecturas.length && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted">
                    Sin lecturas disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </PageWrapper>
  )
}
