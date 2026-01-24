export function LeLoLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Editverse logo"
      className={`h-12 w-auto ${className}`}
    />
  )
}
