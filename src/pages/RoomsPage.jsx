import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  MdAdd,
  MdSearch,
  MdMeetingRoom,
  MdSignalWifi4Bar,
} from "react-icons/md"
import {
  TbWifiOff,
  TbWind,
} from "react-icons/tb"

import PageWrapper      from "../components/layout/PageWrapper"
import PageHeader       from "../components/common/PageHeader"
import StatCard         from "../components/common/StatCard"
import RoomRow          from "../components/common/RoomRow"
import RoomFormModal    from "../components/common/RoomFormModal"
import DialogoConfirmacion from "../components/common/DialogoConfirmacion"
import AccionProtegida  from "../components/common/AccionProtegida"
import { obtenerSalones, obtenerUltimaLecturaDetalladaSalon, eliminarSalon } from "../api/rooms"

const ENCABEZADOS_TABLA = [
  { texto: "Espacio",   clase: "" },
  { texto: "Estado",    clase: "" },
  { texto: "Temp",      clase: "" },
  { texto: "Consumo",   clase: "hidden md:table-cell" },
  { texto: "Ocupación", clase: "hidden sm:table-cell" },
  { texto: "AC",        clase: "" },
  { texto: "Acciones",  clase: "" },
]

const TIPOS_ESPACIO = [
  { valor: "oficina",     etiqueta: "Oficina" },
  { valor: "laboratorio", etiqueta: "Laboratorio" },
  { valor: "salon",       etiqueta: "Aula" },
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
  const clienteQuery = useQueryClient()

  const [mostrarModal, setMostrarModal] = useState(false)
  const [salonEditando, setSalonEditando] = useState(null)
  const [salonEliminando, setSalonEliminando] = useState(null)
  const [terminoBusqueda, setTerminoBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [ultimaActualizacion] = useState(new Date())

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

  const mutacionEliminar = useMutation({
    mutationFn: eliminarSalon,
    onSuccess: () => {
      setSalonEliminando(null)
      clienteQuery.invalidateQueries({ queryKey: ["rooms"] })
      clienteQuery.invalidateQueries({ queryKey: ["rooms-readings"] })
    },
  })

  const totalEspacios = salones?.length ?? 0

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
  // Consumo actual: suma de potencia de los espacios en línea (misma fuente que la tabla).
  const consumoActualW = useMemo(() =>
    salones?.reduce((total, salon) => {
      const lectura = lecturas?.[salon.sala_id]
      if (!estaEnLinea(lectura)) return total
      return total + (Number(lectura?.potencia_w) || 0)
    }, 0) ?? 0,
    [salones, lecturas]
  )
  // Desperdicio: espacio en línea, Vacío y con AC encendido (condición que ATMOS detecta).
  const conteoDesperdicio = useMemo(() =>
    salones?.filter(salon => {
      const lectura = lecturas?.[salon.sala_id]
      return estaEnLinea(lectura) && !lectura?.presencia && lectura?.ac_encendido
    }).length ?? 0,
    [salones, lecturas]
  )

  const conteoPorTipo = useMemo(() => {
    const conteos = Object.fromEntries(TIPOS_ESPACIO.map(tipo => [tipo.valor, 0]))
    for (const salon of salones ?? []) {
      const tipo = salon.tipo ?? "laboratorio"
      conteos[tipo] = (conteos[tipo] ?? 0) + 1
    }
    return conteos
  }, [salones])

  const opcionesTipo = useMemo(() => [
    { valor: "todos", etiqueta: "Todos", cantidad: salones?.length ?? 0 },
    ...TIPOS_ESPACIO.map(tipo => ({
      ...tipo,
      cantidad: conteoPorTipo[tipo.valor] ?? 0,
    })),
  ], [conteoPorTipo, salones])

  const salonesFiltrados = useMemo(() => {
    if (!salones) return []
    let resultado = salones

    if (terminoBusqueda.trim()) {
      const termino = terminoBusqueda.toLowerCase()
      resultado = resultado.filter(salon => salon.nombre.toLowerCase().includes(termino))
    }

    if (filtroTipo !== "todos") {
      resultado = resultado.filter(salon => (salon.tipo ?? "laboratorio") === filtroTipo)
    }

    return resultado
  }, [salones, terminoBusqueda, filtroTipo])

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

  function confirmarEliminar() {
    if (salonEliminando?.sala_id && !mutacionEliminar.isPending) {
      mutacionEliminar.mutate(salonEliminando.sala_id)
    }
  }

  const tarjetasResumen = [
    {
      icono: <MdSignalWifi4Bar size={16} />,
      etiqueta: "Sensores en línea",
      valor: conteoEnLinea,
      linea: "Reportando ahora",
      tono: totalEspacios === 0 ? "neutral" : conteoSinSenal === 0 ? "success" : "warning",
      badgeTexto: totalEspacios === 0 ? "Sin datos" : conteoSinSenal === 0 ? "OK" : "Parcial",
    },
    {
      icono: <TbWifiOff size={16} />,
      etiqueta: "Sin señal",
      valor: conteoSinSenal,
      linea: "Sin lecturas recientes",
      tono: conteoSinSenal >= 1 ? "danger" : "success",
      badgeTexto: conteoSinSenal >= 1 ? "Alerta" : "OK",
    },
    {
      icono: <TbWind size={16} />,
      etiqueta: "Consumo actual",
      valor: Math.round(consumoActualW),
      unidad: "W",
      linea: `${conteoAcEncendido} AC encendido${conteoAcEncendido === 1 ? "" : "s"}`,
      tono: conteoDesperdicio >= 1 ? "warning" : "neutral",
      badgeTexto: conteoDesperdicio >= 1 ? "Desperdicio" : "En vivo",
    },
  ]

  return (
    <PageWrapper>
      <div className="mb-6">
        <PageHeader
          title="Espacios"
          description="Monitoreo en tiempo real de espacios climatizados"
          actions={
            <div className="flex items-center gap-3">
              <AccionProtegida requiereRol="admin">
                <button className="btn-primary flex items-center gap-2" onClick={abrirNuevoSalon}>
                  <MdAdd size={18} />
                  Nuevo espacio
                </button>
              </AccionProtegida>
            </div>
          }
        />
      </div>

      {/* Teléfono: tarjetas a ancho completo. Laptop/desktop: grilla de tres. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {tarjetasResumen.map(tarjeta => (
          <StatCard key={tarjeta.etiqueta} {...tarjeta} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center mb-4 gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={terminoBusqueda}
              onChange={e => setTerminoBusqueda(e.target.value)}
              placeholder="Buscar espacio..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-secondary/30
                         focus:border-secondary transition-colors"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="w-full sm:w-44 text-sm border border-gray-200 rounded-xl px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-secondary/30
                       focus:border-secondary transition-colors bg-white text-dark"
          >
            {opcionesTipo.map(opcion => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta} ({opcion.cantidad})
              </option>
            ))}
          </select>
        </div>
      </div>

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
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !salonesFiltrados.length ? (
              <tr>
                <td colSpan={7} className="px-2 py-16 text-center">
                  <MdMeetingRoom size={40} className="text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-dark">No se encontraron espacios</p>
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
                        <MdAdd size={16} /> Registrar primer espacio
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
                  alEliminar={() => setSalonEliminando(salon)}
                  alMonitorear={() => navegar(`/monitoring?room_id=${salon.sala_id}`)}
                  puedeEditar
                />
              ))
            )}
          </tbody>
        </table>

        {!cargandoSalones && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-muted">
              Mostrando {salonesFiltrados.length} de {totalEspacios} espacios
            </p>
            <p className="text-xs text-muted">
              Actualizado: {ultimaActualizacion.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
          </div>
        )}
      </div>

      <RoomFormModal
        estaAbierto={mostrarModal}
        alCerrar={cerrarModal}
        alGuardar={recargarSalones}
        salon={salonEditando}
      />

      <DialogoConfirmacion
        abierto={!!salonEliminando}
        titulo="Eliminar espacio"
        mensaje={`Se desactivará ${salonEliminando?.nombre ?? "este espacio"} con soft-delete: se ocultará del dashboard sin borrar su historial y podrá revertirse reactivando el registro.`}
        etiquetaConfirmar={mutacionEliminar.isPending ? "Eliminando..." : "Eliminar"}
        etiquetaCancelar="Cancelar"
        peligroso
        alConfirmar={confirmarEliminar}
        alCancelar={() => setSalonEliminando(null)}
      />
    </PageWrapper>
  )
}
