import { useNavigate } from "react-router-dom"
import { MdSearchOff } from "react-icons/md"

export default function PaginaNoEncontrada() {
  const navegar = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <MdSearchOff size={64} className="text-muted opacity-50" />
      <p className="text-6xl font-bold text-gray-200 mt-4">404</p>
      <p className="text-lg font-medium text-dark mt-2">Página no encontrada</p>
      <p className="text-sm text-muted mt-1">
        La página que buscas no existe o fue movida.
      </p>

      <div className="flex gap-3 mt-8 flex-wrap justify-center">
        <button
          onClick={() => navegar("/dashboard")}
          className="btn-primary"
        >
          Ir al dashboard
        </button>
        <button
          onClick={() => navegar(-1)}
          className="btn-secondary"
        >
          Volver atrás
        </button>
      </div>
    </div>
  )
}
