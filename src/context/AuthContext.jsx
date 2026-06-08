import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const ContextoAuth = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function iniciarSesion(correo, contrasena) {
    return supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    })
  }

  async function cerrarSesion() {
    return supabase.auth.signOut()
  }

  const rol = usuario?.user_metadata?.rol ?? null
  const perfil = usuario
    ? {
        rol,
        nombre: usuario.user_metadata?.nombre ?? usuario.user_metadata?.name ?? usuario.email?.split("@")[0] ?? "Usuario",
        correo: usuario.email ?? "",
      }
    : null

  const estaLogueado = !!usuario
  const esAdmin = perfil?.rol === "admin"
  const esMantenimiento = perfil?.rol === "mantenimiento"

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
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return contexto
}
