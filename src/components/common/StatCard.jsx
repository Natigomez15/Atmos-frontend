const CONFIG = {
  "text-success": {
    dot:        "bg-success",
    badge:      "bg-success/8 text-success",
    badgeTexto: "Activo",
    descripcion:"Salones operativos",
  },
  "text-danger": {
    dot:        "bg-danger",
    badge:      "bg-danger/8 text-danger",
    badgeTexto: "Alerta",
    descripcion:"Requiere atención",
  },
  "text-secondary": {
    dot:        "bg-secondary",
    badge:      "bg-secondary/8 text-secondary",
    badgeTexto: "Normal",
    descripcion:"Climatización activa",
  },
}

export default function StatCard({ icono, valor, etiqueta, colorTexto, descripcion, badgeTexto }) {
  const cfg = CONFIG[colorTexto] ?? CONFIG["text-secondary"]
  const desc  = descripcion ?? cfg.descripcion
  const badge = badgeTexto  ?? cfg.badgeTexto

  return (
    <div className="card p-4 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Dot + icono */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Estado</p>
        </div>
        <span className="text-muted/40">{icono}</span>
      </div>

      {/* Número + etiqueta */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xl font-bold tabular-nums tracking-tight leading-none text-dark">{valor}</span>
        <span className="text-sm font-semibold text-dark">{etiqueta}</span>
      </div>

      {/* Descripción + badge */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="text-xs text-muted">{desc}</p>
        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
          {badge}
        </span>
      </div>
    </div>
  )
}
