import { useNavigate } from "react-router-dom"
import { MdBlock } from "react-icons/md"
import PageWrapper from "../components/layout/PageWrapper"
import AccionProtegida from "../components/common/AccionProtegida"
import { useAuth } from "../context/AuthContext"

export default function UsersPage() {
  const { esAdmin } = useAuth()
  const navegar = useNavigate()

  if (!esAdmin) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <MdBlock size={48} className="text-danger" />
          <p className="font-semibold text-dark">Acceso restringido</p>
          <p className="text-sm text-muted text-center">
            Esta sección es solo para administradores
          </p>
          <button className="btn-secondary" onClick={() => navegar("/dashboard")}>
            Volver al dashboard
          </button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <AccionProtegida requiereRol="admin">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-lg font-bold text-dark">Usuarios</h1>
            <p className="text-sm text-muted mt-0.5">Gestión de usuarios del sistema</p>
          </div>
          <div className="card flex items-center justify-center h-48">
            <p className="text-muted text-sm">Gestión de usuarios, próximamente</p>
          </div>
        </div>
      </AccionProtegida>
    </PageWrapper>
  )
}
