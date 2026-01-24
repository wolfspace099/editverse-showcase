"use client"

import { useState, useEffect, useRef } from "react"
import { LeLoLogo } from "./lelo-logo"
import { Button } from "@/components/ui/button"
import { DiscordLoginPopup } from "./login"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { UserCheck, LogOut, Settings, Home, LayoutDashboard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const supabase = getSupabaseClient()
  
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [popupOpen, setPopupOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 50)
      setIsVisible(!(currentScrollY > lastScrollY && currentScrollY > 100))
      setLastScrollY(currentScrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // auth listener
  useEffect(() => {
    supabase.auth.getSession().then(res => setUser(res.data?.session?.user ?? null))
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => authListener.subscription.unsubscribe()
  }, [supabase])

  // click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
  }

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out
          ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
        `}
      >
        <div
          className={`
            flex items-center justify-between px-6 py-3 backdrop-blur-lg rounded-b-2xl border-b border-border/30
            transition-all duration-300
            ${isScrolled
              ? "bg-background/90 border-border/40 shadow-2xl"
              : "bg-background/95 border-border/30 shadow-lg"
            }
          `}
        >
          {/* Logo */}
          <div className="flex items-center gap-6 transform transition-transform duration-200 hover:scale-105">
            <LeLoLogo />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <a href="#process" className="text-white/60 hover:text-white px-3 py-2 text-sm">Our Process</a>
            <a href="#team" className="text-white/60 hover:text-white px-3 py-2 text-sm">Our Team</a>
            <a href="#testimonials" className="text-white/60 hover:text-white px-3 py-2 text-sm">Testimonials</a>
            <a href="#faq" className="text-white/60 hover:text-white px-3 py-2 text-sm">FAQ</a>
          </nav>

          {/* Account / Login / Join Now */}
          <div className="relative flex items-center gap-3" ref={menuRef}>
            {user ? (
              <>
                {/* Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <img
                      src={user.user_metadata?.avatar_url || ""}
                      alt={user.user_metadata?.full_name || "Discord User"}
                      className="w-10 h-10 rounded-full border border-white/40 cursor-pointer transition-transform hover:scale-105"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-black/95 border border-white/20 rounded-xl shadow-lg py-1">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Account</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => window.location.href = "/"}>
                        <Home className="h-4 w-4 mr-2" /> Home
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/dashboard"}>
                        <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/apply"}>
                        <UserCheck className="h-4 w-4 mr-2" /> Apply
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Settings</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                        <Settings className="h-4 w-4 mr-2" /> Account Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Log out
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Join Now button */}
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90 transition-all duration-200 rounded-lg text-sm font-medium"
                  onClick={() => window.location.href = "/join"}
                >
                  Join Now
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200 rounded-lg text-sm"
                onClick={() => setPopupOpen(true)}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {popupOpen && <DiscordLoginPopup onClose={() => setPopupOpen(false)} />}
    </>
  )
}
