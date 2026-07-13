import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-md rounded-xl px-3 py-2 text-xs border border-gray-100">
      <p className="text-muted mb-1">{label}:00</p>
      {payload.map((entrada, i) => (
        <p key={i} style={{ color: entrada.color }} className="font-semibold">
          {entrada.name}: {entrada.value?.toFixed(entrada.name === "Presencia" ? 2 : 0)}
          {entrada.name === "Presencia" ? "" : " W"}
        </p>
      ))}
    </div>
  )
}

export default function FeaturesChart({ datos = [], cargando = false }) {
  if (cargando) {
    return <div className="h-[160px] bg-gray-100 rounded-xl animate-pulse" />
  }

  if (!datos.length) {
    return (
      <div className="h-[160px] bg-gray-50 rounded-xl flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted">
          Aún no hay suficientes lecturas válidas para graficar los últimos días.
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart data={datos} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="hour_of_day"
          tickFormatter={hora => `${hora}:00`}
          tick={{ fontSize: 10, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="izquierda"
          tick={{ fontSize: 10, fill: "#2ABFBF" }}
          axisLine={false}
          tickLine={false}
          unit=" W"
          width={46}
        />
        <YAxis
          yAxisId="derecha"
          orientation="right"
          domain={[0, 1]}
          tick={{ fontSize: 10, fill: "#1B4F8A" }}
          axisLine={false}
          tickLine={false}
          unit="%"
          width={36}
        />
        <Tooltip content={<TooltipPersonalizado />} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Area
          yAxisId="derecha"
          type="monotone"
          dataKey="presence_ratio"
          name="Presencia"
          fill="#1B4F8A"
          fillOpacity={0.1}
          stroke="#1B4F8A"
          strokeWidth={1}
          dot={false}
        />
        <Line
          yAxisId="izquierda"
          type="monotone"
          dataKey="avg_power_w"
          name="Potencia (W)"
          stroke="#2ABFBF"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
