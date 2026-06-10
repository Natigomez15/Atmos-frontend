import axios from "axios"
import { API_BASE_URL, API_KEY } from "../constants/config"
import { supabase } from "../lib/supabase"

const cliente = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  },
  timeout: 10000,
})

cliente.interceptors.request.use(async (configuracion) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    configuracion.headers.Authorization = `Bearer ${session.access_token}`
  }
  return configuracion
})

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401) {
      console.error("ATMOS: autenticacion invalida o sesion ausente")
    }
    if (error.response?.status === 503) {
      console.error("ATMOS: Backend no disponible")
    }
    return Promise.reject(error)
  }
)

export default cliente
