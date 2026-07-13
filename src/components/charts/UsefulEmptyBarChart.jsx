import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-md rounded-xl px-3 py-2 text-xs border border-gray-100">
      <p className="text-muted mb-1">{label}</p>
      {payload.map(item => (
        <p key={item.dataKey} className="font-semibold" style={{ color: item.color }}>
          {item.name}: {Number(item.value ?? 0).toFixed(1)} kWh
        </p>
      ))}
    </div>
  )
}

export default function UsefulEmptyBarChart({ datos = [] }) {
  const hayDatos = datos.some(d => (d.util_kwh ?? 0) > 0 || (d.vacio_kwh ?? 0) > 0)
  return (
    <section className="card relative min-h-[280px]">
      <div className="mb-4">
        <p className="font-semibold text-dark">Energía útil vs vacío</p>
        <p className="text-xs text-muted mt-0.5">Últimos 7 días</p>
      </div>
      {!hayDatos ? (
        <div className="h-[190px] flex items-center justify-center text-sm font-semibold text-muted">
          Datos insuficientes
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis unit=" kWh" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={58} />
            <Tooltip content={<TooltipPersonalizado />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="util_kwh" name="Útil" stackId="energia" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vacio_kwh" name="Vacío" stackId="energia" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
