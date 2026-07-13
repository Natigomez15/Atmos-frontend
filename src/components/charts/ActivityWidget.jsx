function etiquetaTipo(tipo) {
  const mapa = {
    apagado_automatico: "Apagado automático",
    enfriamiento: "Enfriamiento",
    mantener: "Mantener",
    espera_apagado: "Espera apagado",
    posible_falla_ac: "Posible falla",
  }
  return mapa[tipo] ?? tipo ?? "Evento"
}

function horaLocal(valor) {
  if (!valor) return "—"
  return new Date(valor).toLocaleString("es-PA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  })
}

export default function ActivityWidget({ actividad = {} }) {
  const eventos = actividad.events ?? []
  const conteos = actividad.counts ?? []
  const maximo = Math.max(...conteos.map(c => c.count ?? 0), 1)

  return (
    <section className="card relative min-h-[280px]">
      <div className="mb-4">
        <p className="font-semibold text-dark">Actividad del sistema</p>
        <p className="text-xs text-muted mt-0.5">Últimos eventos y conteo 30 días</p>
      </div>

      {!eventos.length ? (
        <div className="h-[190px] flex items-center justify-center text-sm font-semibold text-muted">
          {actividad.empty_message ?? "Sin eventos registrados todavía"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {eventos.map(evento => (
              <div key={evento.id ?? `${evento.timestamp_utc}-${evento.tipo}`} className="border-l-2 border-secondary/50 pl-3 py-1">
                <p className="text-xs font-semibold text-dark">{etiquetaTipo(evento.tipo)}</p>
                <p className="text-[11px] text-muted truncate">{evento.motivo}</p>
                <p className="text-[11px] text-muted">{horaLocal(evento.timestamp_utc)} · {evento.pabellon ?? "ATMOS"}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {conteos.map(item => (
              <div key={item.tipo}>
                <div className="flex justify-between text-[11px] text-muted mb-1">
                  <span>{etiquetaTipo(item.tipo)}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.max(6, ((item.count ?? 0) / maximo) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
