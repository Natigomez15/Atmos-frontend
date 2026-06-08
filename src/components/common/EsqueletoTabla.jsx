export default function EsqueletoTabla({ filas = 5, columnas = 4 }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          {Array.from({ length: columnas }).map((_, j) => (
            <th key={j} className="px-4 py-3">
              <div className="h-3 bg-gray-50 rounded animate-pulse w-3/4" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: filas }).map((_, i) => (
          <tr key={i} className="border-t border-gray-50">
            {Array.from({ length: columnas }).map((__, j) => (
              <td key={j} className="px-4 py-4">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
