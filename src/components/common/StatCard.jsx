// Estructura de 3 filas alineada con las metric cards del dashboard:
// label uppercase 11px / valor 24px / línea corta 12px.
// El badge (opcional) refleja el ESTADO REAL derivado del valor, nunca es decorativo fijo.
const TONOS = {
  success: { dot: "bg-success",   badge: "bg-success/10 text-success" },
  danger:  { dot: "bg-danger",    badge: "bg-danger/10 text-danger" },
  warning: { dot: "bg-warning",   badge: "bg-warning/10 text-warning" },
  neutral: { dot: "bg-gray-300",  badge: "bg-gray-100 text-muted" },
}

export default function StatCard({ icono, valor, unidad, etiqueta, linea, tono, badgeTexto }) {
  const cfg = TONOS[tono] ?? TONOS.neutral

  return (
    <article className="card px-[14px] py-3 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted uppercase tracking-[0.05em] truncate flex items-center gap-1.5">
          {icono && <span className="text-muted/60 [&>svg]:w-4 [&>svg]:h-4 shrink-0">{icono}</span>}
          {etiqueta}
        </p>
        {badgeTexto && (
          <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {badgeTexto}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-1 h-8">
        <span className="text-2xl font-semibold tabular-nums leading-none text-dark">{valor}</span>
        {unidad && <span className="text-[13px] font-normal text-muted">{unidad}</span>}
      </div>

      {linea && <p className="mt-0.5 text-xs leading-4 text-muted truncate">{linea}</p>}
    </article>
  )
}
