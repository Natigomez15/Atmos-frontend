import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  MdRefresh, MdSearch, MdMeetingRoom, MdOpenInNew, MdGridView,
} from "react-icons/md"
import { useAuth }           from "../context/AuthContext"
import PageWrapper           from "../components/layout/PageWrapper"
import UltimaActualizacion   from "../components/common/UltimaActualizacion"
import { usarToast }         from "../components/common/SistemaToast"
import { obtenerSalonesConLecturas, enviarComandoRapido } from "../api/pabellon"

// Determina el estado operativo de una sala según la antigüedad de su lectura
function obtenerEstado(lectura) {
  if (!lectura.registrado_en) return "sin_senal"
  const minutos = Math.floor(
    (Date.now() - new Date(lectura.registrado_en)) / 60000
  )
  if (minutos > 10) return "sin_senal"
  if (lectura.ac_encendido) return "encendido"
  return "apagado"
}

function colorTemperatura(temp) {
  if (temp === null || temp === undefined) return "text-muted"
  if (temp > 26) return "text-danger font-medium"
  if (temp >= 24) return "text-warning font-medium"
  return "text-success font-medium"
}

function etiquetaTiempo(minutos) {
  if (minutos === null) return { texto: "Nunca",        clase: "text-danger" }
  if (minutos === 0)    return { texto: "Ahora",        clase: "text-success" }
  if (minutos < 60)     return { texto: `hace ${minutos}m`, clase: "text-muted" }
  return { texto: `hace ${Math.floor(minutos / 60)}h`,  clase: "text-danger" }
}

const estiloSelect =
  "border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

export default function PabellonPage() {
  const navegar = useNavigate()
  const { estaLogueado } = useAuth()
  const { mostrarToast } = usarToast()

  const [filtro,               setFiltro]               = useState("todos")
  const [busqueda,             setBusqueda]             = useState("")
  const [enviandoId,           setEnviandoId]           = useState(null)
  const [ultimaActualizacion,  setUltimaActualizacion]  = useState(null)

  const {
    data: salones,
    isLoading,
    refetch: recargar,
  } = useQuery({
    queryKey: ["pabellon-estado"],
    queryFn:  () => obtenerSalonesConLecturas().then(d => { setUltimaActualizacion(new Date()); return d }),
    refetchInterval: 30000,
  })

  // ── Derivados ──────────────────────────────────────────────────────────────
  const totalEncendidos = salones?.filter(s => obtenerEstado(s) === "encendido").length ?? 0
  const totalApagados   = salones?.filter(s => obtenerEstado(s) === "apagado").length   ?? 0
  const totalSinSenal   = salones?.filter(s => obtenerEstado(s) === "sin_senal").length ?? 0

  const consumoTotal = salones
    ?.filter(s => obtenerEstado(s) === "encendido")
    .reduce((suma, s) => suma + (s.potencia_w ?? 0), 0) ?? 0

  const salonesFiltrados = salones?.filter(s => {
    const estado = obtenerEstado(s)
    const coincideBusqueda = s.nombre_sala
      .toLowerCase()
      .includes(busqueda.toLowerCase())
    const coincideFiltro =
      filtro === "todos"       ||
      (filtro === "encendidos" && estado === "encendido") ||
      (filtro === "apagados"   && estado === "apagado")   ||
      (filtro === "sin_senal"  && estado === "sin_senal")
    return coincideBusqueda && coincideFiltro
  }) ?? []

  // ── Acción: comando rápido de AC ───────────────────────────────────────────
  async function manejarComando(salaId, tipoComando) {
    setEnviandoId(salaId)
    try {
      await enviarComandoRapido({
        sala_id:      salaId,
        tipo_comando: tipoComando,
        origen:       "manual",
      })
      recargar()
      mostrarToast("Comando enviado al ESP32")
    } catch (e) {
      console.error(e)
      mostrarToast("Error al enviar el comando", "error")
    } finally {
      setEnviandoId(null)
    }
  }

  // ── Botón de filtro toggle ─────────────────────────────────────────────────
  function BtnFiltro({ valor, etiqueta }) {
    const activo = filtro === valor
    return (
      <button
        onClick={() => setFiltro(valor)}
        className={`flex-1 py-2 text-xs sm:text-sm sm:flex-none sm:px-4 rounded-xl transition-colors whitespace-nowrap ${
          activo ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"
        }`}
      >
        {etiqueta}
      </button>
    )
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">

        {/* FILA 1 — Encabezado ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-dark">Estado del pabellón</h1>
            <p className="text-sm text-muted mt-0.5">
              {salones?.length ?? 0} laboratorios monitoreados
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => recargar()}
              className="btn-secondary flex items-center gap-1.5"
            >
              <MdRefresh size={16} /> Actualizar
            </button>
            <UltimaActualizacion fechaActualizacion={ultimaActualizacion} alRecargar={recargar} />
          </div>
        </div>


        {/* FILA 3 — Barra de búsqueda y filtros ───────────────────────────── */}
        <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <MdSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar laboratorio..."
              className={`${estiloSelect} pl-9 w-full`}
            />
          </div>

          {/* Botones de filtro */}
          <div className="flex gap-1.5">
            <BtnFiltro valor="todos"      etiqueta="Todos" />
            <BtnFiltro valor="encendidos" etiqueta="Encendidos" />
            <BtnFiltro valor="apagados"   etiqueta="Apagados" />
            <BtnFiltro valor="sin_senal"  etiqueta="Sin señal" />
          </div>
        </div>

        {/* FILA 4 — Tabla de laboratorios ─────────────────────────────────── */}
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {["Laboratorio", "Temp", "Humedad", "Presencia", "Estado AC", "Potencia", "Actualizado", "Acciones"]
                  .map(col => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))
                }
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-16" />
                        </td>
                      ))}
                    </tr>
                  ))

                : salonesFiltrados.length === 0
                  ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <MdMeetingRoom size={40} className="text-gray-300" />
                          <p className="font-medium text-dark">No se encontraron laboratorios</p>
                          {busqueda && (
                            <p className="text-sm text-muted">Intenta con otro término</p>
                          )}
                          {filtro !== "todos" && (
                            <button
                              onClick={() => { setFiltro("todos"); setBusqueda("") }}
                              className="btn-secondary text-sm"
                            >
                              Ver todos
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )

                  : salonesFiltrados.map(sala => {
                      const estado     = obtenerEstado(sala)
                      const minutos    = sala.registrado_en
                        ? Math.floor((Date.now() - new Date(sala.registrado_en)) / 60000)
                        : null
                      const { texto: textoTiempo, clase: claseTiempo } = etiquetaTiempo(minutos)
                      const ocupado = enviandoId === sala.sala_id

                      return (
                        <tr
                          key={sala.sala_id}
                          onClick={() => navegar(`/monitoring?room_id=${sala.sala_id}`)}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                          {/* Laboratorio */}
                          <td className="px-4 py-3 font-medium text-dark text-sm whitespace-nowrap">
                            {sala.nombre_sala}
                          </td>

                          {/* Temperatura */}
                          <td className={`px-4 py-3 text-sm whitespace-nowrap ${colorTemperatura(sala.temperatura)}`}>
                            {sala.temperatura !== null && sala.temperatura !== undefined
                              ? `${sala.temperatura}°C`
                              : <span className="text-muted">—</span>
                            }
                          </td>

                          {/* Humedad */}
                          <td className="px-4 py-3 text-sm text-dark whitespace-nowrap">
                            {sala.humedad !== null && sala.humedad !== undefined
                              ? `${sala.humedad}%`
                              : <span className="text-muted">—</span>
                            }
                          </td>

                          {/* Presencia */}
                          <td className="px-4 py-3">
                            {sala.presencia
                              ? <span className="badge-success">Ocupado</span>
                              : <span className="badge-muted">Vacío</span>
                            }
                          </td>

                          {/* Estado AC */}
                          <td className="px-4 py-3">
                            {estado === "encendido" && <span className="badge-success">Encendido</span>}
                            {estado === "apagado"   && <span className="badge-muted">Apagado</span>}
                            {estado === "sin_senal" && <span className="badge-danger">Sin señal</span>}
                          </td>

                          {/* Potencia */}
                          <td className="px-4 py-3 text-sm text-dark whitespace-nowrap">
                            {sala.potencia_w !== null && sala.potencia_w !== undefined
                              ? `${sala.potencia_w} W`
                              : <span className="text-muted">—</span>
                            }
                          </td>

                          {/* Actualizado */}
                          <td className={`px-4 py-3 text-xs whitespace-nowrap ${claseTiempo}`}>
                            {textoTiempo}
                          </td>

                          {/* Acciones */}
                          <td
                            className="px-4 py-3"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {estaLogueado && estado !== "sin_senal" && (
                                estado === "apagado"
                                  ? (
                                    <button
                                      disabled={ocupado}
                                      onClick={() => manejarComando(sala.sala_id, "on")}
                                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl
                                                 bg-success/10 text-success hover:bg-success/20
                                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {ocupado
                                        ? <span className="w-3 h-3 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                                        : null
                                      }
                                      Encender
                                    </button>
                                  ) : (
                                    <button
                                      disabled={ocupado}
                                      onClick={() => manejarComando(sala.sala_id, "off")}
                                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl
                                                 bg-danger/10 text-danger hover:bg-danger/20
                                                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {ocupado
                                        ? <span className="w-3 h-3 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
                                        : null
                                      }
                                      Apagar
                                    </button>
                                  )
                              )}

                              {!estaLogueado && (
                                <span className="text-xs text-muted">—</span>
                              )}

                              <span className="text-gray-200">|</span>

                              <button
                                onClick={() => navegar(`/monitoring?room_id=${sala.sala_id}`)}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl
                                           bg-gray-100 text-muted hover:bg-gray-200 transition-colors"
                              >
                                <MdOpenInNew size={12} /> Ver detalle
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
              }
            </tbody>
          </table>

          {/* FILA 5 — Footer de tabla */}
          {!isLoading && salones && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-muted">
                Mostrando {salonesFiltrados.length} de {salones.length} laboratorios
              </p>
              <p className="text-xs text-muted font-medium">
                Consumo total: {consumoTotal.toFixed(0)} W
              </p>
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  )
}
