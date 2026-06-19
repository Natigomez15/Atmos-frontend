function tiempoAtras(iso) {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutos < 1)  return "ahora"
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24)   return `${horas} h`
  return `${Math.floor(horas / 24)} d`
}

const SEVERIDAD = {
  high:   { punto: "bg-danger",  pulsing: true,  insignia: "badge-danger",  etiqueta: "Alta" },
  medium: { punto: "bg-warning", pulsing: false, insignia: "badge-warning", etiqueta: "Media" },
  low:    { punto: "bg-success", pulsing: false, insignia: "badge-success", etiqueta: "Baja" },
}

export default function AlertItem({
  alert_type,
  severity = "low",
  message,
  created_at,
  room_name,
}) {
  const nivel = SEVERIDAD[severity] ?? SEVERIDAD.low

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50/60 -mx-2 px-2 rounded-lg transition-colors duration-150">
      <span className="relative flex items-center justify-center mt-[5px] shrink-0">
        {nivel.pulsing && (
          <span className={`absolute inline-flex w-3 h-3 rounded-full ${nivel.punto} opacity-30 animate-ping`} />
        )}
        <span className={`relative w-2 h-2 rounded-full flex-shrink-0 ${nivel.punto}`} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-dark leading-snug font-medium">{message}</p>
        <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
          {room_name && <span className="truncate">{room_name}</span>}
          {room_name && <span className="text-gray-200">·</span>}
          <span className="shrink-0">{created_at ? tiempoAtras(created_at) : "—"}</span>
        </p>
      </div>

      <span className={`flex-shrink-0 ${nivel.insignia}`}>{nivel.etiqueta}</span>
    </div>
  )
}
