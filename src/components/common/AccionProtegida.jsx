import { useAuth } from "../../context/AuthContext"

export default function AccionProtegida({
  children,
  requiereRol = null,
  alternativa = null,
}) {
  const { estaLogueado, esAdmin, esMantenimiento } = useAuth()

  if (requiereRol === "admin" && !esAdmin) {
    return alternativa
  }

  if (requiereRol === "mantenimiento" && !esAdmin && !esMantenimiento) {
    return alternativa
  }

  if (requiereRol === "cualquiera" && !estaLogueado) {
    return alternativa
  }

  return children
}
