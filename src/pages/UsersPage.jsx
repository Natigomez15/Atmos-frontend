import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import PageWrapper from "../components/layout/PageWrapper"
import { MdLock } from "react-icons/md"

export default function UsersPage() {
  const { usuario } = useAuth()
  const navegar = useNavigate()

  if (!usuario) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <MdLock size={40} className="text-muted" />
          <p className="font-semibold text-dark">Acceso restringido</p>
          <p className="text-sm text-muted text-center">
            Debes iniciar sesión para acceder a la gestión de usuarios.
          </p>
          <button className="btn-primary" onClick={() => navegar("/login")}>
            Iniciar sesión
          </button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Usuarios</h1>
          <p className="text-sm text-muted mt-0.5">Gestión de usuarios del sistema</p>
        </div>
        <div className="card flex items-center justify-center h-48">
          <p className="text-muted text-sm">Gestión de usuarios — próximamente</p>
        </div>
      </div>
    </PageWrapper>
  )
}
