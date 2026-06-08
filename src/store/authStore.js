import { useAuth as usarContextoAuth } from "../context/AuthContext"

export function useAuth() {
  const contexto = usarContextoAuth()
  const {
    estaLogueado,
    esAdmin,
    esMantenimiento,
    cerrarSesion,
  } = contexto

  return {
    ...contexto,
    isLoggedIn: estaLogueado,
    isAdmin: esAdmin,
    isMaintenance: esMantenimiento,
    logout: cerrarSesion,
  }
}
