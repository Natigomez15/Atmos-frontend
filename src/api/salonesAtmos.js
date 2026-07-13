const AIRES_IGNORADOS = new Set(["aire_3"])
const SALONES_AIRE_OCULTOS = new Set(["aire_1", "aire_3"])

export function normalizarNombreAtmos(valor) {
  return String(valor ?? "").trim().toLowerCase().replace(/\s+/g, "_")
}

export function esAireIgnorado(aire) {
  return AIRES_IGNORADOS.has(normalizarNombreAtmos(aire))
}

export function esSalonRobotica(salon) {
  return normalizarNombreAtmos(salon?.nombre ?? salon?.name) === "robotica"
}

export function limpiarAiresSalon(salon) {
  const aires = Array.isArray(salon?.aires) ? salon.aires : []
  const airesLimpios = aires.filter(aire => !esAireIgnorado(aire))

  if (esSalonRobotica(salon) && !airesLimpios.some(aire => normalizarNombreAtmos(aire) === "aire_1")) {
    return ["Aire_1", ...airesLimpios]
  }

  return airesLimpios
}

export function airePrincipalSalon(salon, aireSeleccionado = null) {
  if (aireSeleccionado && !esAireIgnorado(aireSeleccionado)) return aireSeleccionado
  if (esSalonRobotica(salon)) return "Aire_1"

  const aires = limpiarAiresSalon(salon)
  const aire = aires[0] ?? salon?.nombre ?? salon?.name
  return esAireIgnorado(aire) ? null : aire
}

export function prepararSalonAtmos(salon) {
  const normalizado = {
    ...salon,
    sala_id: salon.sala_id ?? salon.id,
    room_id: salon.room_id ?? salon.id,
    name: salon.name ?? salon.nombre,
    nombre: salon.nombre ?? salon.name,
    pavilion: salon.pavilion ?? salon.pabellon ?? salon.edificio,
    pabellon: salon.pabellon ?? salon.pavilion ?? salon.edificio,
    floor: salon.floor ?? salon.piso,
    piso: salon.piso ?? salon.floor,
    tipo: salon.tipo ?? "laboratorio",
  }

  const aires = limpiarAiresSalon(normalizado)
  return {
    ...normalizado,
    aires,
    aire_monitoreo: airePrincipalSalon({ ...normalizado, aires }),
  }
}

export function filtrarSalonesAtmos(salones) {
  return salones
    .map(prepararSalonAtmos)
    .filter(salon => !SALONES_AIRE_OCULTOS.has(normalizarNombreAtmos(salon.nombre ?? salon.name)))
}
