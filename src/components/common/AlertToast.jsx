import { useEffect, useState } from "react"
import { MdError, MdWarning, MdInfo, MdClose } from "react-icons/md"

const CONFIG_SEVERIDAD = {
  high:   { Icono: MdError,   claseIcono: "text-danger",  claseBorde: "border-l-danger",  claseColor: "bg-danger/5" },
  medium: { Icono: MdWarning, claseIcono: "text-warning", claseBorde: "border-l-warning", claseColor: "bg-warning/5" },
  low:    { Icono: MdInfo,    claseIcono: "text-success",  claseBorde: "border-l-success", claseColor: "bg-success/5" },
}

const ETIQUETAS_TIPO = {
  node_offline:      "Nodo sin señal",
  power_anomaly:     "Consumo anómalo",
  temperature_stuck: "Temperatura estancada",
  aire_sin_datos: "Aire sin datos",
  control_ir_inactivo: "Señal IR detenida",
}

function ToastIndividual({ toast, alCerrar }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // entra con animación
    const t1 = setTimeout(() => setVisible(true), 10)
    // auto-dismiss 5s
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(() => alCerrar(toast.id), 300)
    }, 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [toast.id, alCerrar])

  const config = CONFIG_SEVERIDAD[toast.severity] ?? CONFIG_SEVERIDAD.medium
  const { Icono } = config

  return (
    <div
      className={`
        flex items-start gap-3 border-l-4 rounded-xl shadow-lg px-4 py-3 w-80
        bg-white border border-gray-100
        ${config.claseBorde} ${config.claseColor}
        transition-all duration-300
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      <Icono size={18} className={`${config.claseIcono} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-dark">
          {ETIQUETAS_TIPO[toast.alert_type] ?? "Nueva alerta"}
        </p>
        {toast.room_name && (
          <p className="text-xs text-muted truncate">{toast.room_name}</p>
        )}
        {toast.message && (
          <p className="text-xs text-dark mt-0.5 line-clamp-2">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => alCerrar(toast.id), 300)
        }}
        className="text-muted hover:text-dark transition-colors flex-shrink-0"
      >
        <MdClose size={16} />
      </button>
    </div>
  )
}

export default function AlertToastContainer({ toasts, alCerrar }) {
  if (!toasts.length) return null

  return (
    <div className="fixed z-50 flex flex-col gap-2 pointer-events-none
                    bottom-4 left-4 right-4
                    sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:w-80">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastIndividual toast={toast} alCerrar={alCerrar} />
        </div>
      ))}
    </div>
  )
}
