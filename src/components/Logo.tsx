export function Logo({ className }: { className?: string }) {
  return (
    <span className={`font-heading text-lg leading-none font-semibold tracking-tight whitespace-nowrap ${className ?? ''}`}>
      Management Dashboard
    </span>
  )
}
