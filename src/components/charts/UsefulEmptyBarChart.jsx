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

export default function UsefulEmptyBarChart({ datos = [], insufficientData = false }) {
  const hayDatos = datos.some(d => (d.util_kwh ?? 0) > 0 || (d.vacio_kwh ?? 0) > 0)
  return (
    <section className="card relative">
      <div className="mb-4">
        <h2 className="section-title">Consumo con ocupación vs sin ocupación</h2>
        <p className="caption mt-0.5">Últimos 7 días con información disponible</p>
      </div>
      {!hayDatos || insufficientData ? (
        <div className="flex min-h-24 items-center justify-center px-4 text-center">
          <div>
            <p className="card-label text-muted">Sin historial suficiente</p>
            <p className="caption mt-1">Estamos recopilando información diaria para comparar.</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={valor => `${Number(valor).toFixed(1)} kWh`} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={64} />
            <Tooltip content={<TooltipPersonalizado />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="util_kwh" name="Con ocupación" stackId="energia" fill="#2ABFBF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vacio_kwh" name="Sin ocupación" stackId="energia" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
