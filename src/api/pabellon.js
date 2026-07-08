import clienteAPI from "./cliente"
import { airePrincipalSalon, filtrarSalonesAtmos } from "./salonesAtmos"

function datoSensorValido(valor) {
  return valor != null && Number(valor) !== 0 ? valor : null
}

function mapearRegistroComoLectura(registro, sala) {
  return {
    sala_id:       sala.id,
    nombre_sala:   sala.nombre,
    temperatura:   datoSensorValido(registro.temperatura_ambiente),
    humedad:       datoSensorValido(registro.humedad),
    presencia:     registro.estado_ocupacion ?? false,
    ac_encendido:  registro.aire_encendido_atmos ?? false,
    potencia_w:    registro.potencia_w ?? null,
    energia_kwh:   registro.energia_kwh ?? null,
    registrado_en: registro.fecha_sync ?? null,
    aire:          registro.aire ?? null,
    pabellon:      registro.pabellon ?? null,
  }
}

export const obtenerSalonesConLecturas = async () => {
  const salas = await clienteAPI.get("/salas").then(r => filtrarSalonesAtmos(r.data))
  const lecturas = await Promise.all(
    salas.map(sala =>
      clienteAPI.get("/lecturas/registros/reciente", {
        params: {
          pabellon: sala.pabellon ?? sala.edificio ?? "robotica",
          aire:     airePrincipalSalon(sala),
        },
      })
        .then(r => mapearRegistroComoLectura(r.data, sala))
        .catch(() => ({
          sala_id:       sala.id,
          nombre_sala:   sala.nombre,
          temperatura:   null,
          humedad:       null,
          presencia:     false,
          ac_encendido:  false,
          potencia_w:    null,
          registrado_en: null,
        }))
    )
  )
  return lecturas
}

export const enviarComandoRapido = (payload) =>
  clienteAPI.post("/ac-commands", payload).then(r => r.data)
