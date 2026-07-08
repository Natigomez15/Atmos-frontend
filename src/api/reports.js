import cliente from "./client"
import { filtrarSalonesAtmos } from "./salonesAtmos"

export const obtenerSalonesReportes = () =>
  cliente.get("/rooms").then(res => filtrarSalonesAtmos(res.data))

export const generarReporteEnergia = (carga) =>
  cliente.post("/reports/energy", carga).then(res => res.data)

export const generarReporteEnergiaCSV = async (carga) => {
  const respuesta = await cliente.post(
    "/reports/energy",
    { ...carga, format: "csv" },
    { responseType: "blob" }
  )
  const url    = window.URL.createObjectURL(new Blob([respuesta.data]))
  const enlace = document.createElement("a")
  const inicio = carga.period.start.split("T")[0]
  const fin    = carga.period.end.split("T")[0]
  enlace.href  = url
  enlace.setAttribute("download", `atmos_reporte_${inicio}_${fin}.csv`)
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.URL.revokeObjectURL(url)
}

export const obtenerReporteDetalladoSalon = (idSalon, carga) =>
  cliente.post(`/reports/room/${idSalon}`, carga).then(res => res.data)

export const obtenerReporteDetalladoSalonCSV = async (idSalon, carga) => {
  const respuesta = await cliente.post(
    `/reports/room/${idSalon}`,
    { ...carga, format: "csv" },
    { responseType: "blob" }
  )
  const url    = window.URL.createObjectURL(new Blob([respuesta.data]))
  const enlace = document.createElement("a")
  enlace.href  = url
  enlace.setAttribute("download", `atmos_salon_${idSalon}.csv`)
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.URL.revokeObjectURL(url)
}

export const obtenerResumenPabellon = (diasPeriodo = 7) =>
  cliente.get(`/reports/summary/pavilion?period_days=${diasPeriodo}`).then(res => res.data)

export const compararSalon = (idSalon, diasPeriodo = 30) =>
  cliente.get(`/reports/compare?room_id=${idSalon}&period_days=${diasPeriodo}`).then(res => res.data)

export const obtenerHistorialReportes = () =>
  cliente.get("/reports/history?limit=10").then(res => res.data)
