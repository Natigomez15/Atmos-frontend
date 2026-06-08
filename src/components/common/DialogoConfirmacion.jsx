import { MdWarning, MdHelp } from "react-icons/md"

export default function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  etiquetaConfirmar = "Confirmar",
  etiquetaCancelar  = "Cancelar",
  peligroso         = false,
  alConfirmar,
  alCancelar,
}) {
  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={alCancelar}
    >
      <div
        className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Icono centrado */}
        <div className="flex justify-center mb-3">
          {peligroso
            ? <MdWarning size={32} className="text-warning" />
            : <MdHelp    size={32} className="text-secondary" />
          }
        </div>

        {/* Título y mensaje */}
        <p className="text-base font-semibold text-dark text-center">{titulo}</p>
        <p className="text-sm text-muted text-center mt-1">{mensaje}</p>

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={alCancelar}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium
                       text-muted hover:bg-gray-100 transition-colors"
          >
            {etiquetaCancelar}
          </button>
          <button
            onClick={alConfirmar}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              peligroso
                ? "bg-danger text-white hover:bg-danger/90"
                : "btn-primary"
            }`}
          >
            {etiquetaConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
