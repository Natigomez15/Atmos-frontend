import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-md rounded-xl px-3 py-2 text-xs border border-gray-100">
      <p className="text-muted mb-0.5">{payload[0]?.payload?.detalle ?? label}</p>
      <p className="font-semibold text-dark">{payload[0].value?.toFixed(2)} kWh</p>
    </div>
  )
}

export default function PowerChart({ datos = [], cargando = false }) {
  if (cargando) {
    return <div className="h-[180px] bg-gray-100 rounded-xl animate-pulse" />
  }
  if (!datos.length) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-muted">
        Sin datos
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="tiempo"
          tick={{ fontSize: 11, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          unit=" kWh"
          tick={{ fontSize: 11, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<TooltipPersonalizado />} />
        <Bar
          dataKey="energia_kwh"
          fill="#2ABFBF"
          radius={[5, 5, 0, 0]}
          maxBarSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
