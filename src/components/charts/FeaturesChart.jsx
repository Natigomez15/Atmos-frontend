import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

const ZONA_PANAMA = "America/Panama"

const VARIABLES = {
  temperatura: {
    campo: "avg_temp",
    etiqueta: "Temperatura",
    unidad: "°C",
    color: "#1B4F8A",
    decimales: 1,
  },
  potencia: {
    campo: "avg_power_w",
    etiqueta: "Potencia",
    unidad: "W",
    color: "#2ABFBF",
    decimales: 0,
  },
  presencia: {
    campo: "presence_pct",
    etiqueta: "Presencia",
    unidad: "%",
    color: "#7C3AED",
    decimales: 0,
    dominio: [0, 100],
  },
}

function fechaValida(valor) {
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function formatoEje(valor, variosDias) {
  const fecha = fechaValida(valor)
  if (!fecha) return "—"
  return new Intl.DateTimeFormat("es-PA", {
    timeZone: ZONA_PANAMA,
    ...(variosDias ? { day: "2-digit", month: "short" } : { hour: "2-digit", minute: "2-digit", hour12: false }),
  }).format(fecha)
}

function formatoCompleto(valor) {
  const fecha = fechaValida(valor)
  if (!fecha) return "Fecha no disponible"
  return new Intl.DateTimeFormat("es-PA", {
    timeZone: ZONA_PANAMA,
    dateStyle: "full",
    timeStyle: "short",
  }).format(fecha)
}

function TooltipPersonalizado({ active, payload, variable }) {
  if (!active || !payload?.length) return null
  const config = VARIABLES[variable]
  const punto = payload[0]?.payload
  const valor = punto?.[config.campo]
  return (
    <div className="max-w-[260px] rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs shadow-md">
      <p className="mb-1.5 leading-relaxed text-muted">{formatoCompleto(punto?.timestamp)}</p>
      <p className="font-semibold text-dark">
        {config.etiqueta}: {valor == null ? "No disponible" : `${Number(valor).toFixed(config.decimales)} ${config.unidad}`}
      </p>
    </div>
  )
}

export default function FeaturesChart({ datos = [], variable = "temperatura", cargando = false }) {
  if (cargando) {
    return <div className="h-[230px] md:h-[300px] rounded-xl bg-gray-100 motion-safe:animate-pulse" aria-label="Cargando evolución reciente" />
  }

  const config = VARIABLES[variable] ?? VARIABLES.temperatura
  const puntos = datos
    .map(registro => ({
      ...registro,
      timestamp: registro.bucket_hour ?? registro.cubo_hora ?? registro.last_reading_at,
      presence_pct: registro.presence_ratio == null ? null : Number(registro.presence_ratio) * 100,
    }))
    .filter(registro => fechaValida(registro.timestamp) && registro[config.campo] != null)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  if (!puntos.length) {
    return (
      <div className="flex h-[230px] md:h-[300px] items-center justify-center rounded-xl bg-gray-50 px-4 text-center">
        <p className="max-w-md text-sm leading-relaxed text-muted">
          No hay datos disponibles para {config.etiqueta.toLowerCase()} en este periodo.
        </p>
      </div>
    )
  }

  const inicio = new Date(puntos[0].timestamp).getTime()
  const fin = new Date(puntos[puntos.length - 1].timestamp).getTime()
  const variosDias = fin - inicio >= 24 * 60 * 60 * 1000

  return (
    <div className="h-[230px] min-w-0 md:h-[300px]" role="img" aria-label={`Gráfico de ${config.etiqueta.toLowerCase()} en hora de Panamá`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart accessibilityLayer data={puntos} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={valor => formatoEje(valor, variosDias)}
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={config.dominio ?? ["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickFormatter={valor => `${Number(valor).toFixed(config.decimales)}${config.unidad}`}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<TooltipPersonalizado variable={variable} />} />
          <Line
            type="monotone"
            dataKey={config.campo}
            name={config.etiqueta}
            stroke={config.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: "white" }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
