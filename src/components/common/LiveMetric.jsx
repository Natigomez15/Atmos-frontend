import { useEffect, useState } from "react"

const MAPA_DOT = {
  primary:   "bg-primary",
  secondary: "bg-secondary",
  success:   "bg-success",
  warning:   "bg-warning",
  danger:    "bg-danger",
}

export default function LiveMetric({
  etiqueta,
  valor,
  unidad,
  icono,
  color     = "secondary",
  tamano    = "md",
  className = "",
}) {
  const [destellando, setDestellando] = useState(false)

  useEffect(() => {
    if (valor == null) return
    setDestellando(true)
    const t = setTimeout(() => setDestellando(false), 600)
    return () => clearTimeout(t)
  }, [valor])

  const dot = MAPA_DOT[color] ?? MAPA_DOT.secondary

  return (
    <div
      className={`card p-4 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 cursor-default ${
        destellando ? "bg-secondary/[0.03]" : "bg-white"
      } ${className}`}
    >
      {/* Dot pulsante + label | icono ghost */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot} ${destellando ? "animate-ping" : ""}`} />
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">En vivo</p>
        </div>
        <span className="text-muted/40 [&>svg]:w-[15px] [&>svg]:h-[15px]">{icono}</span>
      </div>

      {/* Valor */}
      <div className="flex items-baseline gap-1">
        {valor != null ? (
          <>
            <span className="text-2xl font-bold text-dark tracking-tight leading-none tabular-nums">
              {typeof valor === "number" ? valor.toFixed(1) : valor}
            </span>
            {unidad && <span className="text-xs text-muted font-medium">{unidad}</span>}
          </>
        ) : (
          <span className="text-2xl font-bold text-gray-300 tracking-tight leading-none">—</span>
        )}
      </div>

      {/* Etiqueta */}
      <p className="text-xs text-muted mt-1 truncate">{etiqueta}</p>
    </div>
  )
}
