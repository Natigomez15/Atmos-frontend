import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

function TooltipPersonalizado({ active, payload, label, unidad, valueKey }) {
  if (!active || !payload?.length) return null
  const punto = payload[0]?.payload ?? {}
  const valor = punto[valueKey]

  return (
    <div className="bg-white shadow-md rounded-xl px-3 py-2 text-xs border border-gray-100">
      <p className="text-muted mb-1">{punto.tooltip_label ?? label}</p>
      <p className="font-semibold text-dark">
        {valor != null ? Number(valor).toFixed(unidad === "W" ? 0 : 1) : "—"} {unidad}
      </p>
      <p className={punto.ocupado ? "text-success mt-0.5" : "text-muted mt-0.5"}>
        {punto.ocupado ? "Lab ocupado" : "Sin ocupación registrada"}
      </p>
    </div>
  )
}

export default function ConsumptionLineChart({
  datos = [],
  cargando = false,
  unidad = "W",
  valueKey = "potencia_w",
  mensajeVacio = "Aún no hay historial suficiente para graficar este rango.",
}) {
  const datosValidos = datos.filter(punto => {
    const valor = punto?.[valueKey]
    return valor != null && Number.isFinite(Number(valor))
  })

  if (cargando) {
    return <div className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />
  }

  if (!datosValidos.length) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-xl bg-gray-50/70 px-6 text-center">
        <div>
          <p className="card-label text-muted">Sin historial suficiente</p>
          <p className="caption mt-1">
            {mensajeVacio || "Estamos recopilando información para este período."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {datosValidos.length === 1 && (
        <p className="caption mb-2 text-center">Cobertura parcial: solo hay un período con datos.</p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={datos} margin={{ top: 12, right: 18, left: 6, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="valor"
          tickFormatter={valor => `${Number(valor).toLocaleString("es-PA", { maximumFractionDigits: unidad === "W" ? 0 : 1 })} ${unidad}`}
          tick={{ fontSize: 11, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          width={78}
          domain={[0, "dataMax + 10%"]}
        />
        <YAxis yAxisId="ocupacion" hide domain={[0, 1]} />
        <Tooltip content={<TooltipPersonalizado unidad={unidad} valueKey={valueKey} />} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#64748B" }}
        />
        <Area
          yAxisId="ocupacion"
          type="stepAfter"
          dataKey="ocupacion_banda"
          name="Lab ocupado"
          stroke="none"
          fill="#D8F6F2"
          fillOpacity={0.75}
          activeDot={false}
          isAnimationActive={false}
        />
          {unidad === "W" ? (
            <Line
              yAxisId="valor"
              type="monotone"
              dataKey={valueKey}
              name="Potencia"
              stroke="#1B4F8A"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#1B4F8A" }}
            />
          ) : (
            <Bar
              yAxisId="valor"
              dataKey={valueKey}
              name="Energía"
              fill="#1B4F8A"
              radius={[5, 5, 0, 0]}
              maxBarSize={34}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
