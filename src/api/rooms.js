import cliente from "./client"

function mapearSalon(salon) {
  return {
    ...salon,
    sala_id:  salon.sala_id ?? salon.id,
    room_id:  salon.room_id ?? salon.id,
    name:     salon.name ?? salon.nombre,
    nombre:   salon.nombre ?? salon.name,
    pavilion: salon.pavilion ?? salon.pabellon ?? salon.edificio,
    pabellon: salon.pabellon ?? salon.pavilion ?? salon.edificio,
    floor:    salon.floor ?? salon.piso,
    piso:     salon.piso ?? salon.floor,
    capacity: salon.capacity ?? salon.capacidad,
    capacidad: salon.capacidad ?? salon.capacity,
  }
}

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

function datoSensorValido(valor) {
  return valor != null && Number(valor) !== 0 ? valor : null
}

function mapearLectura(registro) {
  if (!registro) return null
  return {
    ...registro,
    temperatura:   datoSensorValido(registro.temperatura ?? registro.temperatura_ambiente),
    humedad:       datoSensorValido(registro.humedad),
    presencia:     registro.presencia ?? registro.estado_ocupacion ?? false,
    ac_encendido:  registro.ac_encendido ?? registro.aire_encendido_atmos ?? false,
    potencia_w:    registro.potencia_w ?? null,
    energia_kwh:   registro.energia_kwh ?? null,
    registrado_en: registro.registrado_en ?? registro.fecha_sync ?? null,
  }
}

export const obtenerSalones = () =>
  cliente.get("/salas").then(res => filtrarSalonesPrincipales(res.data.map(mapearSalon)))

export const crearSalon = (carga) =>
  cliente.post("/salas", carga).then(res => mapearSalon(res.data))

export const actualizarSalon = (idSalon, carga) =>
  cliente.patch(`/salas/${idSalon}`, carga).then(res => mapearSalon(res.data))

export const obtenerUltimaLecturaDetalladaSalon = (salon) =>
  cliente.get("/lecturas/registros/reciente", {
    params: {
      pabellon: salon.pabellon ?? salon.pavilion,
      aire: salon.aires?.[0] ?? salon.nombre ?? salon.name,
    },
  })
    .then(res => mapearLectura(res.data))
    .catch(() => null)
