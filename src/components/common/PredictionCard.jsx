import { useState } from "react"
import { MdAutoGraph, MdCheckCircle, MdSend, MdExpandMore } from "react-icons/md"

function tiempoAtras(iso) {
  if (!iso) return "-"
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutos < 1) return "hace un momento"
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}

function formatearFecha(iso) {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("es-PA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function CirculoConfianza({ puntuacion }) {
  const porcentaje = Math.round((puntuacion ?? 0) * 100)
  const radio = 20
  const circunferencia = 2 * Math.PI * radio
  const trazo = circunferencia * (porcentaje / 100)
  const colorTrazo = puntuacion >= 0.8 ? "#10B981" : puntuacion >= 0.6 ? "#F59E0B" : "#EF4444"

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={52} height={52} className="-rotate-90">
        <circle cx={26} cy={26} r={radio} fill="none" stroke="#F1F5F9" strokeWidth={4} />
        <circle
          cx={26}
          cy={26}
          r={radio}
          fill="none"
          stroke={colorTrazo}
          strokeWidth={4}
          strokeDasharray={`${trazo} ${circunferencia}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="text-sm font-bold text-dark -mt-8 relative z-10"
        style={{ position: "relative", top: -38 }}
      >
        {porcentaje}%
      </span>
      <p className="text-xs text-muted" style={{ marginTop: -24 }}>Confianza</p>
    </div>
  )
}

function formatearValor(valor) {
  if (valor == null) return "-"
  if (typeof valor === "number") return Number.isInteger(valor) ? valor : valor.toFixed(2)
  return String(valor)
}

function etiquetaModelo(prediccion, esOperativa) {
  const modelo = prediccion.modelo_ml
  if (modelo?.modelo_usado) return modelo.tipo_modelo ?? prediccion.model_version
  if (modelo?.modelo_disponible) return "Modelo disponible"
  if (esOperativa) return "Registros"
  return prediccion.model_version ?? "Sin modelo"
}

export default function PredictionCard({ prediccion, alAplicar, aplicando }) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false)

  const esPrediccionGuardada = prediccion.disponible === true || prediccion.fuente === "ml_predictions"
  const esOperativa = prediccion.fallback_disponible && !esPrediccionGuardada
  const sinDatos = !esPrediccionGuardada && !esOperativa
  const modeloMl = prediccion.modelo_ml ?? {}
  const featuresUsadas = modeloMl.features_usadas ?? prediccion.snapshot_features?.features_usadas
  const prediccionModelo = modeloMl.prediccion_modelo ?? prediccion.snapshot_features?.prediccion_modelo
  const accionFinal = modeloMl.accion_final ?? prediccion.snapshot_features?.accion_final

  return (
    <div className="card p-4 flex flex-col gap-2 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Header: nombre + badge */}
      <div className="flex items-center justify-between">
        <p className="font-semibold text-dark text-sm">{prediccion.room_name}</p>
        <span className="badge-muted text-[10px]">
          {etiquetaModelo(prediccion, esOperativa)}
        </span>
      </div>

      {/* ── Sin datos ── */}
      {sinDatos && (
        <div className="flex items-center gap-3 py-2">
          <MdAutoGraph size={20} className="text-muted shrink-0" />
          <div>
            <p className="text-sm font-medium text-dark">Datos insuficientes</p>
            <p className="text-xs text-muted">Aun no hay lecturas validas suficientes.</p>
          </div>
        </div>
      )}

      {/* ── Operativa (fallback) ── */}
      {esOperativa && (
        <>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">
              Recomendacion operativa
            </p>
            <p className="text-[15px] font-semibold text-dark leading-snug">
              {prediccion.recommendation_text ?? "Mantener estado actual"}
            </p>
            <p className="text-xs text-muted mt-1">Basado en registros recientes</p>

            {modeloMl.modelo_disponible && !modeloMl.modelo_usado && (
              <button
                onClick={() => setMostrarDetalles(v => !v)}
                className="flex items-center gap-1 text-[10px] text-muted mt-2 hover:text-dark transition-colors"
              >
                <MdExpandMore
                  size={13}
                  className={`transition-transform duration-150 ${mostrarDetalles ? "rotate-180" : ""}`}
                />
                Ver estado del modelo
              </button>
            )}
            {mostrarDetalles && modeloMl.motivo_no_usado && (
              <p className="text-[10px] text-muted mt-1 leading-relaxed">
                {modeloMl.motivo_no_usado}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-dark tabular-nums">
                {prediccion.recommended_setpoint != null ? `${prediccion.recommended_setpoint} C` : "Sin cambio"}
              </span>
              <p className="text-xs text-muted">Setpoint sugerido</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-dark tabular-nums">
                {prediccion.predicted_savings_pct != null
                  ? `${prediccion.predicted_savings_pct.toFixed(1)}%`
                  : "Pendiente"}
              </span>
              <p className="text-xs text-muted">Ahorro estimado</p>
            </div>
          </div>
        </>
      )}

      {/* ── Prediccion ML guardada ── */}
      {esPrediccionGuardada && (
        <>
          {(prediccionModelo || accionFinal) && (
            <div className="bg-secondary/5 rounded-xl p-2.5">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">
                Prediccion del modelo
              </p>
              <p className="text-[15px] font-semibold text-dark leading-snug">
                {prediccionModelo ?? "No disponible"}
              </p>
              {accionFinal && (
                <p className="text-xs text-muted mt-0.5">{accionFinal}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[15px] font-semibold text-dark tabular-nums">
                {prediccion.recommended_setpoint} C
              </span>
              <p className="text-xs text-muted text-center">Setpoint</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[15px] font-semibold text-dark tabular-nums">
                {prediccion.predicted_savings_pct?.toFixed(1)}%
              </span>
              <p className="text-xs text-muted text-center">Ahorro</p>
            </div>
            <CirculoConfianza puntuacion={prediccion.confidence_score} />
          </div>

          {featuresUsadas && (
            <>
              <button
                onClick={() => setMostrarDetalles(v => !v)}
                className="flex items-center gap-1 text-[10px] text-muted hover:text-dark transition-colors w-fit"
              >
                <MdExpandMore
                  size={13}
                  className={`transition-transform duration-150 ${mostrarDetalles ? "rotate-180" : ""}`}
                />
                {mostrarDetalles ? "Ocultar caracteristicas" : "Ver caracteristicas"}
              </button>
              {mostrarDetalles && (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {Object.entries(featuresUsadas).map(([clave, valor]) => (
                    <div key={clave} className="bg-gray-50 rounded-lg px-2 py-1">
                      <p className="text-muted">{clave}</p>
                      <p className="font-semibold text-dark">{formatearValor(valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between gap-2">
            <div>
              {prediccion.was_applied ? (
                <>
                  <span className="badge-success flex items-center gap-1 w-fit">
                    <MdCheckCircle size={12} /> Aplicada
                  </span>
                  {prediccion.applied_at && (
                    <p className="text-xs text-muted mt-0.5">{formatearFecha(prediccion.applied_at)}</p>
                  )}
                </>
              ) : (
                <span className="badge-muted">Pendiente de aplicar</span>
              )}
            </div>

            {prediccion.was_applied ? (
              <button
                disabled
                className="btn-secondary text-xs opacity-50 cursor-not-allowed flex items-center gap-1"
              >
                Ya aplicada
              </button>
            ) : (
              <button
                onClick={() => alAplicar(prediccion.id)}
                disabled={aplicando || prediccion.id == null}
                className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aplicando
                  ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <MdSend size={13} />
                }
                Aplicar ahora
              </button>
            )}
          </div>
        </>
      )}

      {/* Pie */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <p className="text-xs text-muted">{tiempoAtras(prediccion.predicted_at)}</p>
        {prediccion.model_version && (
          <p className="text-xs text-muted">
            {esOperativa ? "Motor" : "Modelo"}: {prediccion.model_version}
          </p>
        )}
      </div>
    </div>
  )
}
