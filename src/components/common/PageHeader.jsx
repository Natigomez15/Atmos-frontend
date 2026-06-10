export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-dark">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
