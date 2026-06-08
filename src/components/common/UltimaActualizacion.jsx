import { useState, useEffect } from "react"
import { MdAccessTime } from "react-icons/md"

function textoDesde(fecha) {
  if (!fecha) return "Sin datos"
  const seg = Math.floor((Date.now() - fecha.getTime()) / 1000)
  if (seg < 60)           return `Actualizado hace ${seg}s`
  if (seg < 3600)         return `Actualizado hace ${Math.floor(seg / 60)}m`
  return `Actualizado hace ${Math.floor(seg / 3600)}h`
}

export default function UltimaActualizacion({ fechaActualizacion, alRecargar }) {
  // Forzar re-render cada 10 segundos para mantener el contador vivo
  const [, setTick] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <MdAccessTime size={14} className="flex-shrink-0" />
      <span>{textoDesde(fechaActualizacion)}</span>
      <span>·</span>
      <button
        onClick={alRecargar}
        className="text-secondary hover:text-primary transition-colors cursor-pointer"
      >
        Actualizar
      </button>
    </div>
  )
}
