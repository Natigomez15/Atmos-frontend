import { createContext, useContext, useState, useCallback } from "react"
import { MdCheckCircle, MdError, MdWarning, MdInfo } from "react-icons/md"

const ToastContext = createContext(null)

const ICONOS = {
  success: <MdCheckCircle size={18} style={{ color: "var(--tw-color-success, #10B981)" }} />,
  error:   <MdError       size={18} style={{ color: "var(--tw-color-danger, #EF4444)" }} />,
  warning: <MdWarning     size={18} style={{ color: "var(--tw-color-warning, #F59E0B)" }} />,
  info:    <MdInfo        size={18} style={{ color: "var(--tw-color-secondary, #2ABFBF)" }} />,
}

const COLORES_ICONO = {
  success: "#10B981",
  error:   "#EF4444",
  warning: "#F59E0B",
  info:    "#2ABFBF",
}

function IconoToast({ tipo }) {
  const Icono = { success: MdCheckCircle, error: MdError, warning: MdWarning, info: MdInfo }[tipo] ?? MdInfo
  return <Icono size={18} color={COLORES_ICONO[tipo] ?? COLORES_ICONO.info} />
}

export function ProveedorToast({ children }) {
  const [toasts, setToasts] = useState([])

  const mostrarToast = useCallback((mensaje, tipo = "success") => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      {/* Contenedor de toasts — esquina inferior derecha */}
      <div
        style={{
          position:      "fixed",
          bottom:        "1.5rem",
          right:         "1.5rem",
          zIndex:        9999,
          display:       "flex",
          flexDirection: "column",
          gap:           "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background:   "#ffffff",
              border:       "1px solid #f1f5f9",
              borderRadius: "14px",
              padding:      "12px 16px",
              display:      "flex",
              alignItems:   "center",
              gap:          "10px",
              minWidth:     "280px",
              maxWidth:     "360px",
              boxShadow:    "0 4px 12px rgba(0,0,0,0.08)",
              animation:    "slideIn 0.2s ease",
              pointerEvents: "auto",
            }}
          >
            <IconoToast tipo={toast.tipo} />
            <span style={{ fontSize: "13px", color: "#1e293b", flex: 1 }}>
              {toast.mensaje}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function usarToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("usarToast debe usarse dentro de ProveedorToast")
  return ctx
}
