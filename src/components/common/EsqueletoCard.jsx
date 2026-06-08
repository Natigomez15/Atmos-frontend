export default function EsqueletoCard({ cantidad = 3 }) {
  return (
    <>
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-6 bg-gray-100 rounded w-1/2 mt-3" />
          <div className="h-3 bg-gray-100 rounded w-2/3 mt-2" />
        </div>
      ))}
    </>
  )
}
