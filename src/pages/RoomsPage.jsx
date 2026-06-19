import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../context/AuthContext"
import {
  MdAdd,
  MdSearch,
  MdMeetingRoom,
} from "react-icons/md"
import {
  TbCircleCheck,
  TbWifiOff,
  TbWind,
} from "react-icons/tb"

import PageWrapper     from "../components/layout/PageWrapper"
import PageHeader      from "../components/common/PageHeader"
import StatCard        from "../components/common/StatCard"
import RoomRow         from "../components/common/RoomRow"
import RoomFormModal   from "../components/common/RoomFormModal"
import AccionProtegida  from "../components/common/AccionProtegida"
import { obtenerSalones, obtenerUltimaLecturaDetalladaSalon } from "../api/rooms"

const ENCABEZADOS_TABLA = [
  { texto: "Salón",     clase: "" },
  { texto: "Estado",    clase: "" },
  { texto: "Temp",      clase: "" },
  { texto: "Humedad",   clase: "hidden md:table-cell" },
  { texto: "Consumo",   clase: "hidden md:table-cell" },
  { texto: "AC",        clase: "" },
  { texto: "Capacidad", clase: "hidden lg:table-cell" },
  { texto: "Acciones",  clase: "" },
]

const OPCIONES_FILTRO = [
  { valor: "todos",        etiqueta: "Todos" },
  { valor: "en_linea",     etiqueta: "En línea" },
  { valor: "sin_senal",    etiqueta: "Sin señal" },
  { valor: "ac_encendido", etiqueta: "AC encendido" },
]

function minutosDesde(iso) {
  if (!iso) return Infinity
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function estaEnLinea(lectura) {
  return lectura != null && minutosDesde(lectura.registrado_en) <= 10
}


export default function RoomsPage() {
  const navegar = useNavigate()
  const { esAdmin } = useAuth()

  const [mostrarModal,   setMostrarModal]   = useState(false)
  const [salonEditando,  setSalonEditando]  = useState(null)
  const [terminoBusqueda, setTerminoBusqueda] = useState("")
  const [filtroActivo,   setFiltroActivo]   = useState("todos")
  const [ultimaActualizacion] = useState(new Date())

  // ── Queries ────────────────────────────────────────────────────────

  const { data: salones, isLoading: cargandoSalones, refetch: recargarSalones } = useQuery({
    queryKey:        ["rooms"],
    queryFn:         obtenerSalones,
    refetchInterval: 60000,
  })

  const { data: lecturas } = useQuery({
    queryKey: ["rooms-readings"],
    queryFn: async () => {
      if (!salones) return {}
      const resultados = await Promise.all(
        salones.map(salon => obtenerUltimaLecturaDetalladaSalon(salon))
      )
      return Object.fromEntries(salones.map((salon, i) => [salon.sala_id, resultados[i]]))
    },
    enabled:         !!salones,
    refetchInterval: 30000,
  })

  // ── Estadísticas ───────────────────────────────────────────────────

  const conteoEnLinea = useMemo(() =>
    salones?.filter(salon => estaEnLinea(lecturas?.[salon.sala_id])).length ?? 0,
    [salones, lecturas]
  )
  const conteoSinSenal = useMemo(() =>
    salones?.filter(salon => !estaEnLinea(lecturas?.[salon.sala_id])).length ?? 0,
    [salones, lecturas]
  )
  const conteoAcEncendido = useMemo(() =>
    salones?.filter(salon => lecturas?.[salon.sala_id]?.ac_encendido).length ?? 0,
    [salones, lecturas]
  )

  // ── Filtrado ───────────────────────────────────────────────────────

  const salonesFiltrados = useMemo(() => {
    if (!salones) return []
    let resultado = salones

    if (terminoBusqueda.trim()) {
      const termino = terminoBusqueda.toLowerCase()
      resultado = resultado.filter(salon => salon.nombre.toLowerCase().includes(termino))
    }

    if (filtroActivo === "en_linea") {
      resultado = resultado.filter(salon => estaEnLinea(lecturas?.[salon.sala_id]))
    } else if (filtroActivo === "sin_senal") {
      resultado = resultado.filter(salon => !estaEnLinea(lecturas?.[salon.sala_id]))
    } else if (filtroActivo === "ac_encendido") {
      resultado = resultado.filter(salon => lecturas?.[salon.sala_id]?.ac_encendido)
    }

    return resultado
  }, [salones, lecturas, terminoBusqueda, filtroActivo])

  // ── Handlers ───────────────────────────────────────────────────────

  function abrirNuevoSalon() {
    setSalonEditando(null)
    setMostrarModal(true)
  }

  function abrirEdicionSalon(salon) {
    setSalonEditando(salon)
    setMostrarModal(true)
  }

  function cerrarModal() {
    setMostrarModal(false)
    setSalonEditando(null)
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <PageWrapper>

      {/* ── Fila 1: Encabezado ──────────────────────────────────────── */}
      <div className="mb-6">
        <PageHeader
          eyebrow="Gestión de espacios"
          title="Laboratorios"
          description={`${salones?.length ?? 0} salones registrados en el sistema`}
          actions={
            <AccionProtegida requiereRol="admin">
              <button className="btn-primary flex items-center gap-2" onClick={abrirNuevoSalon}>
                <MdAdd size={18} />
                Nuevo salón
              </button>
            </AccionProtegida>
          }
        />
      </div>

      {/* ── Fila 2: Estadísticas ────────────────────────────────────── */}

      {/* Mobile: scroll horizontal con mini cards */}
      <div className="flex sm:hidden gap-3 overflow-x-auto pb-1 mb-6 -mx-4 px-4 hide-scrollbar">
        {[
          { dot: "bg-success",   badge: "bg-success/8 text-success",     badgeTexto: "Activo", etiqueta: "En línea",     valor: conteoEnLinea,     icono: <TbCircleCheck size={16} /> },
          { dot: "bg-danger",    badge: "bg-danger/8 text-danger",        badgeTexto: "Alerta", etiqueta: "Sin señal",    valor: conteoSinSenal,    icono: <TbWifiOff size={16} /> },
          { dot: "bg-secondary", badge: "bg-secondary/8 text-secondary",  badgeTexto: "Normal", etiqueta: "AC encendido", valor: conteoAcEncendido, icono: <TbWind size={16} /> },
        ].map(({ dot, badge, badgeTexto, etiqueta, valor, icono }) => (
          <div key={etiqueta} className="card shrink-0 w-40 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-muted/40">{icono}</span>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${badge}`}>
                {badgeTexto}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums text-dark leading-none">{valor}</p>
              <p className="text-xs text-muted mt-0.5 leading-tight">{etiqueta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet / Desktop: 3 cards completas */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          icono={<TbCircleCheck size={22} />}
          valor={conteoEnLinea}
          etiqueta="En línea"
          colorTexto="text-success"
        />
        <StatCard
          icono={<TbWifiOff size={22} />}
          valor={conteoSinSenal}
          etiqueta="Sin señal"
          colorTexto="text-danger"
        />
        <StatCard
          icono={<TbWind size={22} />}
          valor={conteoAcEncendido}
          etiqueta="AC encendido"
          colorTexto="text-secondary"
        />
      </div>

      {/* ── Fila 3: Búsqueda y filtros ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        {/* Búsqueda */}
        <div className="relative w-full sm:w-64">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={terminoBusqueda}
            onChange={e => setTerminoBusqueda(e.target.value)}
            placeholder="Buscar salón..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-secondary/30
                       focus:border-secondary transition-colors"
          />
        </div>

        {/* Filtro de estado */}
        <select
          value={filtroActivo}
          onChange={e => setFiltroActivo(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-secondary/30
                     focus:border-secondary transition-colors bg-white text-dark"
        >
          {OPCIONES_FILTRO.map(opcion => (
            <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
          ))}
        </select>
      </div>

      {/* ── Fila 4: Tabla ───────────────────────────────────────────── */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr className="border-b border-gray-100">
              {ENCABEZADOS_TABLA.map(enc => (
                <th
                  key={enc.texto}
                  className={`px-3 py-3 lg:px-4 lg:py-3.5 text-left text-[11px] font-bold text-muted uppercase tracking-widest bg-gray-50/80 first:rounded-tl-2xl last:rounded-tr-2xl ${enc.clase}`}
                >
                  {enc.texto}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {cargandoSalones ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !salonesFiltrados.length ? (
              <tr>
                <td colSpan={8} className="px-2 py-16 text-center">
                  <MdMeetingRoom size={40} className="text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-dark">No se encontraron salones</p>
                  {terminoBusqueda ? (
                    <p className="text-xs text-muted mt-1">
                      Intenta con otro término de búsqueda
                    </p>
                  ) : (
                    <AccionProtegida requiereRol="admin">
                      <button
                        className="btn-primary mt-4 inline-flex items-center gap-2"
                        onClick={abrirNuevoSalon}
                      >
                        <MdAdd size={16} /> Registrar primer salón
                      </button>
                    </AccionProtegida>
                  )}
                </td>
              </tr>
            ) : (
              salonesFiltrados.map(salon => (
                <RoomRow
                  key={salon.sala_id}
                  salon={salon}
                  lectura={lecturas?.[salon.sala_id] ?? null}
                  alEditar={() => abrirEdicionSalon(salon)}
                  alMonitorear={() => navegar(`/monitoring?room_id=${salon.sala_id}`)}
                  puedeEditar={esAdmin}
                />
              ))
            )}
          </tbody>
        </table>

        {/* ── Pie de tabla ──────────────────────────────────────────── */}
        {!cargandoSalones && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-muted">
              Mostrando {salonesFiltrados.length} de {salones?.length ?? 0} salones
            </p>
            <p className="text-xs text-muted">
              Actualizado: {ultimaActualizacion.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
          </div>
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────── */}
      {esAdmin && (
        <RoomFormModal
          estaAbierto={mostrarModal}
          alCerrar={cerrarModal}
          alGuardar={recargarSalones}
          salon={salonEditando}
        />
      )}

    </PageWrapper>
  )
}
