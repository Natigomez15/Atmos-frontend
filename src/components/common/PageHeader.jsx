export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="meta-label mb-1">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="body-muted mt-1">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">{actions}</div>
      )}
    </div>
  )
}
