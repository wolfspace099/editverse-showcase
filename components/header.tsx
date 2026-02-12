"use client"

import { useState, useEffect, useRef } from "react"
import { LeLoLogo } from "./lelo-logo"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { UserCheck, LogOut, Settings, Home, ChevronDown, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header({ children }: { children?: React.ReactNode }) {
  const supabase = getSupabaseClient()
  
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [popupOpen, setPopupOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
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
        setPopupOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .fancy-dropdown {
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.98) 0%,
            rgba(20, 20, 30, 0.98) 100%
          );
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fancy-menu-item {
          position: relative;
          padding: 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .fancy-menu-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.05);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .fancy-menu-item:hover::before {
          opacity: 1;
        }

        .fancy-menu-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-button {
          position: relative;
          overflow: hidden;
        }

        .nav-button::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, white, transparent);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
        }

        .nav-button:hover::after {
          width: 100%;
        }

        .team-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .team-button:hover {
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
          transform: translateY(-2px);
        }

        .menu-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.4);
          padding: 12px 16px 8px 16px;
          margin-top: 8px;
        }

        .menu-separator {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          margin: 8px 0;
        }

        .avatar-ring {
          position: relative;
        }

        .avatar-ring::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .avatar-ring:hover::before {
          opacity: 1;
        }
      `}</style>

      <header
        className={`
          fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out
          ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
        `}
      >
        <div
          className={`
            flex items-center justify-center gap-8 px-6 py-3 backdrop-blur-lg rounded-b-2xl border-b border-border/30
            transition-all duration-300
            ${isScrolled
              ? "bg-background/90 border-border/40 shadow-2xl"
              : "bg-background/95 border-border/30 shadow-lg"
            }
          `}
        >
          {/* Logo */}
          <div className="flex items-center transform transition-transform duration-200 hover:scale-105">
            <LeLoLogo size={64} />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {/* Courses Button */}
            <Button
              variant="ghost"
              size="sm"
              className="nav-button text-white/60 hover:text-white px-3 py-2 text-sm rounded-full hover:bg-white/10 transition-all"
              onClick={() => window.location.href = "/dashboard/courses"}
            >
              Courses
            </Button>

            {/* Our team Button */}
            <Button
              variant="ghost"
              size="sm"
              className="nav-button text-white/60 hover:text-white px-3 py-2 text-sm rounded-full hover:bg-white/10 transition-all"
              onClick={() => window.location.href = "/assetverse"}
            >
              Assets
            </Button>

            {/* Our team Button */}
            <Button
              variant="ghost"
              size="sm"
              className="nav-button text-white/60 hover:text-white px-3 py-2 text-sm rounded-full hover:bg-white/10 transition-all"
              onClick={() => window.location.href = "/team"}
            >
              Our team
            </Button>

            {/* Pricing Button */}
            <Button
              variant="ghost"
              size="sm"
              className="nav-button text-white/60 hover:text-white px-3 py-2 text-sm rounded-full hover:bg-white/10 transition-all"
              onClick={() => window.location.href = "/pricing"}
            >
              Pricing
            </Button>
          </nav>

          {/* Right side */}
          <div className="relative flex items-center gap-3" ref={menuRef}>
            {user ? (
              <>
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90 transition-all duration-200 rounded-lg text-sm font-medium"
                  onClick={() => window.location.href = "/dashboard"}
                >
                  Dashboard
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="avatar-ring">
                      <img
                        src={user.user_metadata?.avatar_url || ""}
                        alt={user.user_metadata?.full_name || "Discord User"}
                        className="w-10 h-10 rounded-full border-2 border-white/40 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-white/60"
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="fancy-dropdown w-64 p-2">
                    <div className="menu-label">Account</div>
                    <div 
                      className="fancy-menu-item"
                      onClick={() => window.location.href = "/"}
                    >
                      <Home className="h-4 w-4 item-icon inline-block" />
                      <span>Home</span>
                    </div>
                    <div 
                      className="fancy-menu-item"
                      onClick={() => window.location.href = "/apply"}
                    >
                      <UserCheck className="h-4 w-4 item-icon inline-block" />
                      <span>Apply</span>
                    </div>
                    <div className="menu-separator" />
                    <div className="menu-label">Settings</div>
                    <div 
                      className="fancy-menu-item"
                      onClick={() => window.location.href = "/settings"}
                    >
                      <Settings className="h-4 w-4 item-icon inline-block" />
                      <span>Account Settings</span>
                    </div>
                    <div 
                      className="fancy-menu-item"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 item-icon inline-block" />
                      <span>Log out</span>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-white text-black hover:bg-white/90 transition-all duration-200 rounded-lg text-sm font-medium"
                onClick={() => window.location.href = "/login"}
              >
                Join Now
              </Button>
            )}
          </div>
        </div>

        {/* Children (Search bar and controls) */}
        {children}
      </header>
    </>
  )
}