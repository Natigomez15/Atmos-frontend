import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { MdAssessment, MdCompareArrows, MdHistory, MdBolt, MdSavings, MdTrendingDown, MdLock } from "react-icons/md"
import { useAuth } from "../context/AuthContext"
import PageWrapper         from "../components/layout/PageWrapper"
import KPICard             from "../components/common/KPICard"
import ReportGeneratorForm from "../components/common/ReportGeneratorForm"
import EnergyReportResults from "../components/common/EnergyReportResults"
import ComparisonCard      from "../components/common/ComparisonCard"
import {
  obtenerSalonesReportes,
  obtenerResumenPabellon,
  compararSalon,
  obtenerHistorialReportes,
} from "../api/reports"

const PESTANAS = [
  { id: "generar",     etiqueta: "Generar reporte",  icono: <MdAssessment size={16} /> },
  { id: "comparativa", etiqueta: "Comparativa",       icono: <MdCompareArrows size={16} /> },
  { id: "historial",   etiqueta: "Historial",         icono: <MdHistory size={16} /> },
]

const OPCIONES_DIAS = [7, 15, 30]

function formatearFecha(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function InsigniaTipo({ tipo }) {
  const mapa = {
    energy:  { clase: "badge-success", texto: "Energía" },
    room:    { clase: "badge-muted",   texto: "Salón" },
    default: { clase: "badge-muted",   texto: tipo ?? "—" },
  }
  const cfg = mapa[tipo] ?? mapa.default
  return <span className={cfg.clase}>{cfg.texto}</span>
}

export default function ReportsPage() {
  const { estaLogueado } = useAuth()
  const navegar = useNavigate()
  const [pestanaActiva,    setPestanaActiva]    = useState("generar")
  const [resultadoReporte, setResultadoReporte] = useState(null)
  const [idSalonSeleccionado, setIdSalonSeleccionado] = useState("")
  const [diasComparacion,  setDiasComparacion]  = useState(30)

  const { data: salones = [] } = useQuery({
    queryKey: ["salones-reportes"],
    queryFn:  obtenerSalonesReportes,
    enabled:  estaLogueado,
  })

  const { data: resumenPabellon, isLoading: cargandoResumen } = useQuery({
    queryKey: ["resumen-pabellon", diasComparacion],
    queryFn:  () => obtenerResumenPabellon(diasComparacion),
    enabled:  estaLogueado,
  })

  const { data: comparacion, isLoading: cargandoComparacion } = useQuery({
    queryKey: ["comparacion-salon", idSalonSeleccionado, diasComparacion],
    queryFn:  () => compararSalon(idSalonSeleccionado, diasComparacion),
    enabled:  estaLogueado && !!idSalonSeleccionado,
  })

  const { data: historial = [] } = useQuery({
    queryKey: ["historial-reportes"],
    queryFn:  obtenerHistorialReportes,
    refetchInterval: 60000,
    enabled:  estaLogueado,
  })

  const totalKwh    = resumenPabellon?.total_energy_kwh ?? 0
  const totalCosto  = resumenPabellon?.total_cost_usd ?? 0
  const totalAhorro = resumenPabellon?.total_savings_usd ?? 0
  const reduccion   = resumenPabellon?.avg_savings_pct ?? null

  async function manejarDescargarDesdeResultados() {
  }

  if (!estaLogueado) {
    return (
      <PageWrapper>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="card flex flex-col items-center justify-center gap-4 text-center max-w-sm w-full">
            <MdLock size={48} className="text-muted" />
            <p className="font-semibold text-dark">Inicia sesión para acceder a los reportes</p>
            <button className="btn-primary" onClick={() => navegar("/login")}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">

        {/* KPIs del pabellón */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            titulo="Consumo total"
            valor={totalKwh.toFixed(2)}
            unidad="kWh"
            icono={<MdBolt size={20} />}
            color="secondary"
            cargando={cargandoResumen}
          />
          <KPICard
            titulo="Costo total"
            valor={`$${totalCosto.toFixed(2)}`}
            unidad="USD"
            icono={<span className="font-bold text-lg">$</span>}
            color="warning"
            cargando={cargandoResumen}
          />
          <KPICard
            titulo="Ahorro estimado"
            valor={`$${totalAhorro.toFixed(2)}`}
            unidad="USD"
            icono={<MdSavings size={20} />}
            color="success"
            cargando={cargandoResumen}
          />
          <KPICard
            titulo="Reducción promedio"
            valor={reduccion != null ? reduccion.toFixed(1) : "—"}
            unidad="%"
            icono={<MdTrendingDown size={20} />}
            color="success"
            cargando={cargandoResumen}
          />
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto hide-scrollbar w-full sm:w-fit">
          {PESTANAS.map(p => (
            <button
              key={p.id}
              onClick={() => setPestanaActiva(p.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                pestanaActiva === p.id
                  ? "bg-white text-dark shadow-sm"
                  : "text-muted hover:text-dark"
              }`}
            >
              {p.icono}
              {p.etiqueta}
            </button>
          ))}
        </div>

        {/* Pestaña: Generar reporte */}
        {pestanaActiva === "generar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <ReportGeneratorForm
              salones={salones}
              alGenerar={setResultadoReporte}
              alDescargar={() => {}}
            />
            {resultadoReporte
              ? <div className="card lg:col-span-2">
                  <EnergyReportResults
                    reporte={resultadoReporte}
                    alDescargar={manejarDescargarDesdeResultados}
                  />
                </div>
              : <div className="card lg:col-span-2 flex flex-col items-center justify-center h-48 lg:h-64 gap-3">
                  <MdAssessment size={40} className="text-gray-300" />
                  <p className="text-muted text-sm text-center">
                    Configura los parámetros y presiona<br />
                    <span className="font-medium text-dark">"Ver reporte"</span> para ver los resultados aquí
                  </p>
                </div>
            }
          </div>
        )}

        {/* Pestaña: Comparativa */}
        {pestanaActiva === "comparativa" && (
          <div className="flex flex-col gap-4">
            <div className="card flex flex-col gap-4">
              <p className="font-semibold text-dark text-sm">Configurar comparativa</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                    Salón
                  </label>
                  <select
                    value={idSalonSeleccionado}
                    onChange={e => setIdSalonSeleccionado(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                  >
                    <option value="">Seleccionar salón...</option>
                    {salones.map(salon => (
                      <option key={salon.sala_id} value={salon.sala_id}>{salon.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                    Período de comparación
                  </label>
                  <div className="flex gap-2">
                    {OPCIONES_DIAS.map(d => (
                      <button
                        key={d}
                        onClick={() => setDiasComparacion(d)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                          diasComparacion === d
                            ? "bg-secondary text-white border-secondary"
                            : "bg-white text-muted border-gray-200 hover:border-secondary/40"
                        }`}
                      >
                        {d} días
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {idSalonSeleccionado
              ? <ComparisonCard comparacion={comparacion} cargando={cargandoComparacion} />
              : <div className="card flex flex-col items-center justify-center h-48 gap-3">
                  <MdCompareArrows size={36} className="text-gray-300" />
                  <p className="text-muted text-sm">Selecciona un salón para ver la comparativa</p>
                </div>
            }
          </div>
        )}

        {/* Pestaña: Historial */}
        {pestanaActiva === "historial" && (
          <div className="card p-0 overflow-x-auto">
            <p className="px-4 pt-4 pb-2 text-sm font-semibold text-dark">Historial de reportes generados</p>
            {historial.length === 0
              ? <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <MdHistory size={32} className="text-gray-300" />
                  <p className="text-muted text-sm">Sin reportes anteriores</p>
                </div>
              : <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Tipo", "Período inicio", "Período fin", "Generado el", "Salones"].map(enc => (
                        <th key={enc} className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                          {enc}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((item, i) => (
                      <tr key={item.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-2"><InsigniaTipo tipo={item.report_type} /></td>
                        <td className="px-4 py-2 text-dark">{formatearFecha(item.period_start)}</td>
                        <td className="px-4 py-2 text-dark">{formatearFecha(item.period_end)}</td>
                        <td className="px-4 py-2 text-muted">{formatearFecha(item.generated_at ?? item.created_at)}</td>
                        <td className="px-4 py-2 text-dark">{item.room_count ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        )}

      </div>
    </PageWrapper>
  )
}
