import { createContext, useContext, useState, useCallback } from "react"
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from "react-icons/md"

const ToastContext = createContext(null)

const TIPOS = {
  success: { Icono: MdCheckCircle, color: "#10B981", borde: "#d1fae5", barra: "bg-success" },
  error:   { Icono: MdError,       color: "#EF4444", borde: "#fee2e2", barra: "bg-danger" },
  warning: { Icono: MdWarning,     color: "#F59E0B", borde: "#fef3c7", barra: "bg-warning" },
  info:    { Icono: MdInfo,        color: "#2ABFBF", borde: "#ccfbf1", barra: "bg-secondary" },
}

function Toast({ toast, onClose }) {
  const config = TIPOS[toast.tipo] ?? TIPOS.info
  const { Icono } = config

  return (
    <div
      style={{
        background:    "#ffffff",
        border:        `1px solid ${config.borde}`,
        borderRadius:  "14px",
        display:       "flex",
        alignItems:    "flex-start",
        gap:           "10px",
        minWidth:      "300px",
        maxWidth:      "380px",
        boxShadow:     "0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)",
        animation:     "slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        overflow:      "hidden",
        position:      "relative",
        padding:       "12px 14px",
      }}
    >
      {/* Left color bar */}
      <div
        style={{
          position:     "absolute",
          left:         0,
          top:          0,
          bottom:       0,
          width:        "3px",
          background:   config.color,
          borderRadius: "14px 0 0 14px",
        }}
      />
      <Icono size={16} color={config.color} style={{ marginTop: "1px", flexShrink: 0 }} />
      <span style={{ fontSize: "13px", color: "#1e293b", flex: 1, lineHeight: "1.45", fontWeight: 450 }}>
        {toast.mensaje}
      </span>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", padding: "1px", flexShrink: 0, marginTop: "1px",
          borderRadius: "4px",
        }}
      >
        <MdClose size={14} />
      </button>
    </div>
  )
}

export function ProveedorToast({ children }) {
  const [toasts, setToasts] = useState([])

  const cerrar = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const mostrarToast = useCallback((mensaje, tipo = "success") => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensaje, tipo }])
    setTimeout(() => cerrar(id), 4000)
  }, [cerrar])

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
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
          <div key={toast.id} style={{ pointerEvents: "auto" }}>
            <Toast toast={toast} onClose={cerrar} />
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
