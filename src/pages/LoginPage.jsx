import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import logoAtmos from "../assets/logo_atmos.png"
import { MdArrowBack } from "react-icons/md"

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4
                    bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_#f8fafc_60%)]">
      <div className="bg-white rounded-2xl shadow-card-lg border border-gray-100/60 w-full max-w-sm p-8 flex flex-col gap-6">

        {/* Logo + título */}
        <div className="flex flex-col items-center gap-3">
          <img src={logoAtmos} alt="ATMOS" className="h-12 w-auto object-contain" />
          <div className="text-center">
            <h1 className="text-base font-bold text-dark tracking-tight">Iniciar sesión</h1>
            <p className="text-xs text-muted mt-0.5">Sistema de Control Energético</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Formulario */}
        <form onSubmit={manejarLogin} className="flex flex-col gap-4">
          <div>
            <label className="label-base">Correo electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="usuario@correo.com"
              autoComplete="email"
              className="input-base"
            />
          </div>

          <div>
            <label className="label-base">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="input-base"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-danger bg-danger/5 border border-danger/15 rounded-xl px-3 py-2.5">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="btn-primary flex items-center justify-center gap-2 py-2.5 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {cargando ? "Verificando..." : "Continuar"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-[11px] text-muted leading-relaxed">
            ¿Problemas para ingresar? Contacta al administrador del sistema.
          </p>
          <button
            onClick={() => navegar("/dashboard")}
            className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 font-medium transition-colors"
          >
            <MdArrowBack size={13} />
            Volver al panel
          </button>
        </div>
      </div>
    </div>
  )
}
