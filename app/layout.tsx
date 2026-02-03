import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Editverse - Working With Editors, Not Against Them",
  description: "Join the premier video editing agency that empowers creators. Learn, grow, and succeed with our community of talented editors."
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}