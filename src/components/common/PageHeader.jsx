export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-xs uppercase tracking-wide text-primary font-semibold">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl lg:text-3xl font-bold text-dark mt-1">
          {title}
        </h1>
        {description && (
          <p className="text-sm lg:text-base text-muted mt-1">
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
