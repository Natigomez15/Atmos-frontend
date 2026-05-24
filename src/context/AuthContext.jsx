import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const ContextoAuth = createContext(null)

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setCargando(false)
    })

    // Escuchar cambios de sesión (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  return (
    <ContextoAuth.Provider value={{ usuario, cargando, cerrarSesion }}>
      {children}
    </ContextoAuth.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(ContextoAuth)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return ctx
}
