function colorCelda(valor, maximo) {
  if (!valor || !maximo) return "rgba(35, 91, 155, 0.06)"
  const intensidad = Math.max(0.12, Math.min(1, valor / maximo))
  return `rgba(35, 91, 155, ${0.12 + intensidad * 0.78})`
}

export default function ConsumptionHeatmap({ heatmap = {} }) {
  const dias = heatmap.days ?? []
  const horas = heatmap.hours ?? []
  const puntos = heatmap.points ?? []
  const maximo = heatmap.max_kwh ?? 0
  const porClave = new Map(puntos.map(p => [`${p.day_index}-${p.hour}`, p]))

  return (
    <section className="card relative mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-dark">Heatmap de consumo</p>
          <p className="text-xs text-muted mt-0.5">kWh promedio por hora y día de semana</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted">
          <span>Menos</span>
          <span className="w-16 h-2 rounded-full bg-gradient-to-r from-primary/10 to-primary" />
          <span>Más</span>
        </div>
      </div>

      {heatmap.insufficient_data ? (
        <div className="h-[130px] flex items-center justify-center text-sm font-semibold text-muted">
          {heatmap.empty_message ?? "Acumulando datos históricos"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid gap-1 min-w-[760px]"
            style={{ gridTemplateColumns: `64px repeat(${horas.length}, minmax(34px, 1fr))` }}
          >
            <div />
            {horas.map(hora => (
              <div key={hora} className="text-[10px] text-muted text-center">{hora}</div>
            ))}
            {dias.map((dia, diaIndex) => (
              <div key={dia} className="contents">
                <div className="text-xs font-semibold text-muted flex items-center">{dia}</div>
                {horas.map(hora => {
                  const punto = porClave.get(`${diaIndex}-${hora}`) ?? { kwh: 0 }
                  return (
                    <div
                      key={`${dia}-${hora}`}
                      title={`${dia} ${hora}:00 · ${Number(punto.kwh ?? 0).toFixed(1)} kWh`}
                      className="h-7 rounded-md border border-white"
                      style={{ backgroundColor: colorCelda(punto.kwh, maximo) }}
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
