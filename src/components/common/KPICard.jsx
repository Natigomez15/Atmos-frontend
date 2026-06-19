const MAPA_DOT = {
  primary:   "bg-primary",
  secondary: "bg-secondary",
  success:   "bg-success",
  warning:   "bg-warning",
  danger:    "bg-danger",
}

export default function KPICard({
  titulo,
  valor,
  unidad,
  icono,
  tendencia,
  color    = "primary",
  cargando = false,
}) {
  const dot = MAPA_DOT[color] ?? MAPA_DOT.primary

  if (cargando) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            <div className="h-2.5 w-16 bg-gray-100 rounded" />
          </div>
          <div className="w-4 h-4 bg-gray-100 rounded" />
        </div>
        <div className="h-7 w-1/2 bg-gray-100 rounded mb-1" />
        <div className="flex items-center justify-between mt-1">
          <div className="h-2.5 w-2/3 bg-gray-100 rounded" />
          <div className="w-10 h-4 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
      {/* Dot + label | icono ghost */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Métrica</p>
        </div>
        <span className="text-muted/40 [&>svg]:w-[15px] [&>svg]:h-[15px]">{icono}</span>
      </div>

      {/* Número + unidad */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-dark tracking-tight leading-none tabular-nums">{valor}</span>
        {unidad && <span className="text-xs text-muted font-medium">{unidad}</span>}
      </div>

      {/* Titulo + tendencia */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="text-xs text-muted truncate">{titulo}</p>
        {tendencia != null && (
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
            tendencia >= 0
              ? "bg-success/8 text-success"
              : "bg-danger/8 text-danger"
          }`}>
            {tendencia >= 0 ? "+" : ""}{tendencia.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
