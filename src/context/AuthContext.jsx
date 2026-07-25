import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { obtenerPerfil } from "../api/ajustes"

const ContextoAuth = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfilBackend, setPerfilBackend] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Sesion de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setCargando(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null)

      if (!session?.user) {
        setPerfilBackend(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Perfil real almacenado en el backend de ATMOS
  useEffect(() => {
    if (!usuario) {
      setPerfilBackend(null)
      return
    }

    let activo = true

    async function cargarPerfil() {
      try {
        const perfil = await obtenerPerfil()

        if (activo) {
          setPerfilBackend(perfil)
        }
      } catch (error) {
        console.error("No se pudo cargar el perfil de ATMOS:", error)

        if (activo) {
          setPerfilBackend(null)
        }
      }
    }

    cargarPerfil()

    return () => {
      activo = false
    }
  }, [usuario?.id])

  async function iniciarSesion(correo, contrasena) {
    return supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    })
  }

  async function cerrarSesion() {
    setPerfilBackend(null)
    return supabase.auth.signOut()
  }

  // El backend de ATMOS tiene prioridad.
  // user_metadata queda solamente como respaldo.
  const rolCrudo =
    perfilBackend?.rol ??
    usuario?.user_metadata?.rol ??
    null

  const rol =
    typeof rolCrudo === "string"
      ? rolCrudo.trim().toLowerCase()
      : null

  const perfil = usuario
    ? {
        rol,
        nombre:
          perfilBackend?.nombre ??
          usuario.user_metadata?.nombre ??
          usuario.user_metadata?.name ??
          usuario.email?.split("@")[0] ??
          "Usuario",
        correo:
          perfilBackend?.correo ??
          usuario.email ??
          "",
      }
    : null

  const estaLogueado = !!usuario
  const esAdmin = rol === "admin"
  const esMantenimiento = rol === "mantenimiento"

  return (
    <ContextoAuth.Provider
      value={{
        usuario,
        estaLogueado,
        esAdmin,
        esMantenimiento,
        perfil,
        iniciarSesion,
        cerrarSesion,
        cargando,
      }}
    >
      {children}
    </ContextoAuth.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(ContextoAuth)

  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }

  return contexto
}
