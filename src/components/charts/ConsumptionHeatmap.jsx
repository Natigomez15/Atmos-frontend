function colorCelda(valor, maximo) {
  if (valor == null) return "rgba(148, 163, 184, 0.10)"
  if (!maximo) return "rgba(42, 191, 191, 0.12)"
  const intensidad = Math.max(0.12, Math.min(1, valor / maximo))
  return `rgba(27, 79, 138, ${0.12 + intensidad * 0.78})`
}

export default function ConsumptionHeatmap({ heatmap = {} }) {
  const dias = heatmap.days ?? []
  const horas = heatmap.hours ?? []
  const puntos = heatmap.points ?? []
  const maximo = heatmap.max_kwh ?? 0
  const porClave = new Map(puntos.map(p => [`${p.day_index}-${p.hour}`, p]))
  const tieneDatos = puntos.some(p => p.kwh != null && Number.isFinite(Number(p.kwh)))

  return (
    <section className="card relative">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Patrón de consumo</h2>
          <p className="caption mt-0.5">kWh promedio por hora y día de semana</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted">
          <span>Menos</span>
          <span className="w-16 h-2 rounded-full bg-gradient-to-r from-primary/10 to-primary" />
          <span>Más</span>
        </div>
      </div>

      {!tieneDatos ? (
        <div className="flex min-h-24 items-center justify-center px-4 text-center">
          <div>
            <p className="card-label text-muted">Sin historial suficiente</p>
            <p className="caption mt-1">Estamos recopilando información para identificar patrones.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto xl:overflow-x-visible">
          <div
            className="grid min-w-[620px] justify-center gap-[3px] xl:min-w-0"
            style={{ gridTemplateColumns: `56px repeat(${horas.length}, minmax(19px, 24px))` }}
          >
            <div />
            {horas.map(hora => (
              <div key={hora} className="text-[10px] text-muted text-center">{hora}</div>
            ))}
            {dias.map((dia, diaIndex) => (
              <div key={dia} className="contents">
                <div className="flex items-center text-[11px] font-semibold text-muted">{dia}</div>
                {horas.map(hora => {
                  const punto = porClave.get(`${diaIndex}-${hora}`)
                  const valor = punto?.kwh
                  const horaFormateada = `${String(hora).padStart(2, "0")}:00`
                  const detalle = valor == null
                    ? "Sin datos"
                    : `${Number(valor).toFixed(2)} kWh promedio`
                  return (
                    <div
                      key={`${dia}-${hora}`}
                      title={`${dia} · ${horaFormateada} — ${detalle}`}
                      aria-label={`${dia} · ${horaFormateada} — ${detalle}`}
                      className="h-7 rounded-md border border-white"
                      style={{ backgroundColor: colorCelda(valor, maximo) }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
