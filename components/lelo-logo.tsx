"use client"

interface LeLoLogoProps {
  className?: string
  size?: number
}

export function LeLoLogo({ className = "", size = 48 }: LeLoLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Editverse logo"
      style={{ height: size, width: "auto" }}
      className={className}
    />
  )
}
