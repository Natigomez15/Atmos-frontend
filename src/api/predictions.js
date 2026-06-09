import cliente from "./client"

export const obtenerSalonesPrediciones = () =>
  cliente.get("/rooms").then(res => res.data)

export const obtenerUltimaPrediccion = (idSalon) =>
  cliente.get(`/ml/predictions/${idSalon}/latest`)
    .then(res => res.data)
    .catch(() => null)

export const obtenerTodasUltimasPredicciones = async () => {
  const salones = await cliente.get("/rooms").then(res => res.data)
  const predicciones = await Promise.all(
    salones.map(salon =>
      cliente.get(`/ml/predictions/${salon.id}/latest`)
        .then(res => ({
          ...res.data,
          room_name: salon.name ?? salon.nombre,
        }))
        .catch(() => ({
          room_id:               salon.id,
          room_name:             salon.name ?? salon.nombre,
          recommended_setpoint:  null,
          predicted_savings_pct: null,
          confidence_score:      null,
          model_version:         null,
          was_applied:           false,
          predicted_at:          null,
        }))
    )
  )
  return predicciones
}

export const obtenerImpactoDecisiones = () =>
  cliente.get("/ml/impacto/decisiones", {
    params: { pabellon: "robotica", aire: "Aire_1" },
  }).then(res => res.data)

export const obtenerImpactoReal = () =>
  cliente.get("/ml/impacto/real").then(res => res.data)

export const obtenerCaracteristicasML = (idSalon, diasAtras = 7) =>
  cliente.get(`/ml/features/${idSalon}`, {
    params: { days_back: diasAtras }
  }).then(res => res.data)
    .catch(() => [])

export const aplicarPrediccion = (idPrediccion) =>
  cliente.post(`/ac-commands/from-prediction/${idPrediccion}`).then(res => res.data)

export const dispararEvaluacion = () =>
  cliente.post("/ml/evaluate").then(res => res.data)

export const decidirAtmos = (datosLectura) =>
  cliente.post("/ml/atmos/decidir", datosLectura).then(res => res.data)
