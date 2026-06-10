import { useEffect, useState } from "react"

export default function LiveMetric({
  etiqueta,
  valor,
  unidad,
  icono,
  color  = "secondary",
  tamano = "md",
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
      className={`card border-l-4 ${borderClass} transition-colors duration-300 ${
        destellando ? bgDestello : "bg-surface"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={textoValor}>{icono}</span>
        <p className="text-xs text-muted uppercase tracking-wide">{etiqueta}</p>
      </div>

      <div className="flex items-baseline gap-1">
        {valor != null ? (
          <>
            <span
              className={`font-bold text-dark ${
                tamano === "lg" ? "text-3xl" : "text-2xl"
              }`}
            >
              {typeof valor === "number" ? valor.toFixed(1) : valor}
            </span>
            {unidad && <span className="text-sm text-muted">{unidad}</span>}
          </>
        ) : (
          <span className={`font-bold text-muted ${tamano === "lg" ? "text-3xl" : "text-2xl"}`}>
            —
          </span>
        )}
      </div>
    </div>
  )
}
