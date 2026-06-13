import { useEffect, useState } from "react"

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
    const temporizador = setTimeout(() => setDestellando(false), 800)
    return () => clearTimeout(temporizador)
  }, [valor])

  const borderClass = {
    primary:   "border-l-primary",
    secondary: "border-l-secondary",
    success:   "border-l-success",
    warning:   "border-l-warning",
    danger:    "border-l-danger",
  }[color] ?? "border-l-secondary"

  const bgDestello = {
    primary:   "bg-primary/5",
    secondary: "bg-secondary/5",
    success:   "bg-success/5",
    warning:   "bg-warning/5",
    danger:    "bg-danger/5",
  }[color] ?? "bg-secondary/5"

  const textoValor = {
    primary:   "text-primary",
    secondary: "text-secondary",
    success:   "text-success",
    warning:   "text-warning",
    danger:    "text-danger",
  }[color] ?? "text-secondary"

  return (
    <div
      className={`card border-l-4 ${borderClass} p-2 lg:p-4 transition-colors duration-300 ${
        destellando ? bgDestello : "bg-surface"
      } ${className}`}
    >
      <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-1.5">
        <span className={textoValor}>{icono}</span>
        <p className="text-[10px] lg:text-xs text-muted uppercase tracking-wide truncate">{etiqueta}</p>
      </div>

      <div className="flex items-baseline justify-center lg:justify-start gap-0.5">
        {valor != null ? (
          <>
            <span className={`font-bold text-dark leading-tight ${
              tamano === "lg" ? "text-base lg:text-2xl" : "text-sm lg:text-xl"
            }`}>
              {typeof valor === "number" ? valor.toFixed(1) : valor}
            </span>
            {unidad && <span className="text-[10px] lg:text-xs text-muted">{unidad}</span>}
          </>
        ) : (
          <span className={`font-bold text-muted leading-tight ${
            tamano === "lg" ? "text-base lg:text-2xl" : "text-sm lg:text-xl"
          }`}>
            —
          </span>
        )}
      </div>
    </div>
  )
}
