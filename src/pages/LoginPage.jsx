import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import logoAtmos from "../assets/logo_atmos.png"

export default function LoginPage() {
  const navegar = useNavigate()

  const [correo,     setCorreo]     = useState("")
  const [contrasena, setContrasena] = useState("")
  const [cargando,   setCargando]   = useState(false)
  const [error,      setError]      = useState(null)

  async function manejarLogin(e) {
    e.preventDefault()
    if (!correo || !contrasena) {
      setError("Ingresa tu correo y contraseña")
      return
    }
    setCargando(true)
    setError(null)
    const { error: errSupabase } = await supabase.auth.signInWithPassword({
      email:    correo.trim(),
      password: contrasena,
    })
    setCargando(false)
    if (errSupabase) {
      setError("Correo o contraseña incorrectos")
    } else {
      navegar("/dashboard", { replace: true })
    }
  }

  const estiloInput =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <img src={logoAtmos} alt="ATMOS" className="h-14 w-auto object-contain" />
          <p className="text-xs text-muted text-center">Sistema de Control Energético</p>
          <p className="text-xs text-muted text-center">UTP — Proyecto JIC 2025</p>
        </div>

        <hr className="border-gray-100" />

        {/* Formulario */}
        <form onSubmit={manejarLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="usuario@utp.edu.pe"
              autoComplete="email"
              className={estiloInput}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={estiloInput}
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          ¿Problemas para ingresar? Contacta al administrador del sistema.
        </p>

        {/* Volver */}
        <button
          onClick={() => navegar("/dashboard")}
          className="text-xs text-secondary hover:underline text-center"
        >
          ← Volver al panel (modo lectura)
        </button>
      </div>
    </div>
  )
}
