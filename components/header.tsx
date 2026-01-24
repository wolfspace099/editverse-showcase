"use client"

import { useState, useEffect } from "react"
import { LeLoLogo } from "./lelo-logo"
import { Button } from "./ui/button"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      setIsScrolled(currentScrollY > 50)

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return (
    <header
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
      `}
    >
      <div
        className={`
          flex items-center justify-center gap-6 px-6 py-3 rounded-2xl border transition-all duration-300
          ${
            isScrolled
              ? "bg-background/90 backdrop-blur-xl border-border/40 shadow-2xl"
              : "bg-background/95 backdrop-blur-lg border-border/30 shadow-lg"
          }
        `}
      >
        <div className="transform transition-transform duration-200 hover:scale-105">
          <LeLoLogo />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <a
            href="#process"
            className="text-white/60 hover:text-white transition-colors duration-200 px-4 py-2 text-sm"
          >
            Our Process
          </a>
          <a
            href="#team"
            className="text-white/60 hover:text-white transition-colors duration-200 px-4 py-2 text-sm"
          >
            Our Team
          </a>
          <a
            href="#testimonials"
            className="text-white/60 hover:text-white transition-colors duration-200 px-4 py-2 text-sm"
          >
            Testimonials
          </a>
          <a
            href="#faq"
            className="text-white/60 hover:text-white transition-colors duration-200 px-4 py-2 text-sm"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200 rounded-lg text-sm"
          >
            Login
          </Button>
          <Button
            size="sm"
            className="bg-white text-black hover:bg-white/90 transition-all duration-200 rounded-lg text-sm font-medium"
          >
            Join Now
          </Button>
        </div>
      </div>
    </header>
  )
}
