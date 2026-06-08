import { useNavigate } from "react-router-dom"
import { MdChevronRight } from "react-icons/md"

export default function Migas({ migas = [] }) {
  const navegar = useNavigate()

  return (
    <div className="flex items-center gap-1 text-xs text-muted mb-4 flex-wrap">
      {migas.map((miga, indice) => {
        const esUltima = indice === migas.length - 1
        return (
          <span key={indice} className="flex items-center gap-1">
            {esUltima
              ? <span className="text-dark font-medium">{miga.label}</span>
              : (
                <button
                  onClick={() => miga.ruta && navegar(miga.ruta)}
                  className="text-secondary hover:text-dark transition-colors cursor-pointer"
                >
                  {miga.label}
                </button>
              )
            }
            {!esUltima && <MdChevronRight size={14} className="text-muted flex-shrink-0" />}
          </span>
        )
      })}
    </div>
  )
}
