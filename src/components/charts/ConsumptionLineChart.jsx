import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts"

function TooltipPersonalizado({ active, payload, label, unidad, valueKey }) {
  if (!active || !payload?.length) return null
  const punto = payload[0]?.payload ?? {}
  const valor = punto[valueKey]

  return (
    <div className="bg-white shadow-md rounded-xl px-3 py-2 text-xs border border-gray-100">
      <p className="text-muted mb-1">{label}</p>
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
  baseline,
  mensajeVacio = "Aún no hay historial suficiente para graficar este rango.",
}) {
  if (cargando) {
    return <div className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />
  }

  if (!datos?.length || datos.length < 2) {
    return (
      <div className="h-[150px] rounded-xl bg-gray-50/70 flex items-center justify-center text-center px-6">
        <p className="font-semibold text-muted">{mensajeVacio || "Datos insuficientes"}</p>
      </div>
    )
  }

  return (
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
          unit={` ${unidad}`}
          tick={{ fontSize: 11, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          width={72}
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
        {baseline != null && (
          <ReferenceLine
            yAxisId="valor"
            y={baseline}
            stroke="#94A3B8"
            strokeDasharray="5 5"
            label={{ value: "baseline", position: "insideTopRight", fill: "#64748B", fontSize: 11 }}
          />
        )}
        <Line
          yAxisId="valor"
          type="monotone"
          dataKey={valueKey}
          name={unidad === "W" ? "Potencia" : "Energía"}
          stroke="#235B9B"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: "#235B9B" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
