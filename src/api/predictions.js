import cliente from "./client"

function esRoomAire(salon) {
  return /^aire[_\s-]*\d+$/i.test(String(salon.nombre ?? salon.name ?? "").trim())
}

function filtrarSalonesPrincipales(salones) {
  return salones.filter((salon) => {
    if (!esRoomAire(salon)) return true

    const nombreAire = String(salon.nombre ?? salon.name ?? "").trim().toLowerCase()
    const pabellon = salon.pabellon ?? salon.pavilion
    return !salones.some((otro) =>
      otro !== salon
      && (otro.pabellon ?? otro.pavilion) === pabellon
      && Array.isArray(otro.aires)
      && otro.aires.some(aire => String(aire).trim().toLowerCase() === nombreAire)
    )
  })
}

function resolverSalaFuente(salon, salones) {
  const airePrincipal = salon.aires?.[0]
  if (!airePrincipal) return salon

  const pabellon = salon.pabellon ?? salon.pavilion
  const aireNormalizado = String(airePrincipal).trim().toLowerCase()
  return salones.find((candidato) =>
    (candidato.pabellon ?? candidato.pavilion) === pabellon
    && String(candidato.nombre ?? candidato.name ?? "").trim().toLowerCase() === aireNormalizado
  ) ?? salon
}

function textoRecomendacion(prediccion) {
  const accion = String(
    prediccion.operational_recommendation
    ?? prediccion.recomendacion_actual
    ?? prediccion.recommendation_text
    ?? ""
  ).trim().toLowerCase()

  const textos = {
    apagar: "Apagar aire",
    mantener: "Mantener estado actual",
    mantener_monitoreo: "Mantener estado actual",
    posible_ahorro: "Posible ahorro energético",
    ahorro_24: "Modo ahorro a 24 C",
    encender_22: "Encender a 22 C",
    enfriar_fuerte: "Enfriamiento fuerte",
  }

  if (textos[accion]) return textos[accion]
  return prediccion.recommendation_text
}

function prepararSalonPredicciones(salon, salones) {
  const salaFuente = resolverSalaFuente(salon, salones)
  return {
    ...salon,
    prediction_source_room_id: salaFuente.id,
    source_room_id: salaFuente.id,
    source_room_name: salaFuente.name ?? salaFuente.nombre,
  }
}

function normalizarPrediccion(prediccion, salon, salaFuente) {
  const recommendationText = textoRecomendacion(prediccion)
  return {
    ...prediccion,
    room_id: salon.id,
    sala_id: salon.id,
    prediction_source_room_id: salaFuente?.id ?? salon.id,
    source_room_id: salaFuente?.id ?? salon.id,
    room_name: salon.name ?? salon.nombre,
    recommendation_text: recommendationText ?? prediccion.recommendation_text,
  }
}

export const obtenerSalonesPrediciones = () =>
  cliente.get("/rooms").then(res => {
    const salones = res.data
    return filtrarSalonesPrincipales(salones)
      .map(salon => prepararSalonPredicciones(salon, salones))
  })

export const obtenerUltimaPrediccion = (idSalon) =>
  cliente.get(`/ml/predictions/${idSalon}/latest`)
    .then(res => res.data)
    .catch(() => null)

export const obtenerTodasUltimasPredicciones = async () => {
  const salones = await cliente.get("/rooms").then(res => res.data)
  const salonesPrincipales = filtrarSalonesPrincipales(salones)
  const predicciones = await Promise.all(
    salonesPrincipales.map(salon => {
      const salaFuente = resolverSalaFuente(salon, salones)
      return cliente.get(`/ml/predictions/${salaFuente.id}/latest`)
        .then(res => normalizarPrediccion(res.data, salon, salaFuente))
        .catch(() => ({
          room_id:               salon.id,
          prediction_source_room_id: salaFuente.id,
          source_room_id:        salaFuente.id,
          room_name:             salon.name ?? salon.nombre,
          recommended_setpoint:  null,
          predicted_savings_pct: null,
          confidence_score:      null,
          model_version:         null,
          was_applied:           false,
          predicted_at:          null,
        }))
    })
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
