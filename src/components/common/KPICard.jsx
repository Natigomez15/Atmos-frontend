const MAPA_COLORES = {
  primary:   { fondo: "bg-primary/10",   texto: "text-primary" },
  secondary: { fondo: "bg-secondary/10", texto: "text-secondary" },
  success:   { fondo: "bg-success/10",   texto: "text-success" },
  warning:   { fondo: "bg-warning/10",   texto: "text-warning" },
  danger:    { fondo: "bg-danger/10",    texto: "text-danger" },
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
  const { fondo, texto } = MAPA_COLORES[color] ?? MAPA_COLORES.primary

  if (cargando) {
    return (
      <div className="card p-2 lg:p-4 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-gray-200 mb-2" />
        <div className="h-2.5 w-full bg-gray-200 rounded mb-1.5" />
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="card p-2 lg:p-4">
      <div className="flex items-start justify-between mb-1.5">
        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full ${fondo} flex items-center justify-center shrink-0`}>
          <span className={texto}>{icono}</span>
        </div>
        {tendencia != null && (
          <span className={`hidden lg:flex text-xs font-medium items-center gap-0.5 ${
            tendencia >= 0 ? "text-success" : "text-danger"
          }`}>
            {tendencia >= 0 ? "↑" : "↓"} {Math.abs(tendencia).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="text-[10px] lg:text-xs text-muted truncate leading-tight">{titulo}</p>
      <div className="flex items-baseline gap-0.5 mt-0.5">
        <span className="text-base lg:text-xl font-bold text-dark leading-tight">{valor}</span>
        {unidad && <span className="text-[10px] lg:text-xs text-muted">{unidad}</span>}
      </div>
    </div>
  )
}
