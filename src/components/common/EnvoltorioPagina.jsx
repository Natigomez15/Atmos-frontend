import { useLocation } from "react-router-dom"
import AtmosIABubble from "../atmos-ia/AtmosIABubble"


export default function EnvoltorioPagina({
  children,
}) {
  const ubicacion = useLocation()

  const ocultarBurbuja =
    ubicacion.pathname === "/login" ||
    ubicacion.pathname === "/atmos-ia"

  return (
    <div className="pagina-entrada">
      {children}

      {!ocultarBurbuja && (
        <AtmosIABubble />
      )}
    </div>
  )
}