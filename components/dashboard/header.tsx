"use client"

import { useState, useEffect, useRef } from "react"
import { LeLoLogo } from "../lelo-logo"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { Bell, LifeBuoy, Search, FileText, Home, LogOut, Menu, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

const bottomNavLinks = [
  { label: "Overview", view: "overview" },
  { label: "Courses", view: "courses" },
  { label: "Skill level", view: "skill-level" },
  { label: "Progress", view: "progress" },
  { label: "Integrations", view: "integrations" },
  { label: "Support", view: "support" },
  { label: "Settings", view: "settings" },
]

type User = {
  id?: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface HeaderProps {
  currentView?: string
  onViewChange?: (view: string) => void
}

export function Header({ currentView = "overview", onViewChange }: HeaderProps) {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [isTop, setIsTop] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifTab, setNotifTab] = useState<"Inbox" | "Archived">("Inbox")
  const [activeTab, setActiveTab] = useState(currentView)

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const underlineRef = useRef<HTMLSpanElement>(null)

  // Sync active tab with currentView prop and query param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const pageParam = searchParams.get('page')
    
    if (pageParam) {
      setActiveTab(pageParam)
    } else if (currentView) {
      setActiveTab(currentView)
    } else {
      setActiveTab("overview")
    }
  }, [currentView])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsTop(window.scrollY < 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Load user (check both fake and real auth)
  useEffect(() => {
    loadUser()
  }, [supabase])

  async function loadUser() {
    // Check for fake user first
    const fakeUser = localStorage.getItem('fake_user')
    if (fakeUser) {
      try {
        const parsed = JSON.parse(fakeUser)
        setUser(parsed)
        return
      } catch (e) {
        localStorage.removeItem('fake_user')
      }
    }

    // Check real Supabase auth
    supabase.auth.getSession().then(res => {
      setUser((res.data?.session?.user as User) ?? null)
    })
    
    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser((session?.user as User) ?? null)
      })
    
    return () => authListener.subscription.unsubscribe()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setSearchOpen(true)
        }
      }
      if (e.key === "Escape") {
        setSearchOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-mobile-menu-trigger]')) {
          setMobileMenuOpen(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Update underline position with smooth animation
  useEffect(() => {
    const updateUnderline = () => {
      const activeRef = navRefs.current[activeTab]
      if (activeRef && underlineRef.current) {
        const left = activeRef.offsetLeft
        const width = activeRef.offsetWidth
        
        underlineRef.current.style.left = `${left}px`
        underlineRef.current.style.width = `${width}px`
      }
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(updateUnderline, 50)
    
    window.addEventListener("resize", updateUnderline)
    return () => window.removeEventListener("resize", updateUnderline)
  }, [activeTab, isTop])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    // Clear fake user
    localStorage.removeItem('fake_user')
    
    // Clear real auth
    await supabase.auth.signOut()
    
    setProfileOpen(false)
    setMobileMenuOpen(false)
    router.push('/')
  }

  const handleNavClick = (view: string) => {
    setActiveTab(view)
    setMobileMenuOpen(false)

    if (onViewChange) {
      onViewChange(view)
    }

    if (view === 'overview') {
      router.push('/dashboard?page=overview')
      return
    }

    if (view === 'courses') {
      router.push('/dashboard/courses')
      return
    }

    router.push(`/dashboard?page=${view}`)
  }

  const searchSuggestions = [
    { icon: FileText, label: "CapCut short-form workflows" },
    { icon: FileText, label: "After Effects expressions" },
    { icon: FileText, label: "AI editing tools" },
    { icon: FileText, label: "Premiere Pro tips" },
  ]

  const notifications = [
    { title: "Course updated: Premiere Pro", time: "2h ago" },
    { title: "New comment on your workflow", time: "5h ago" },
    { title: "AI course recommendation", time: "1d ago" },
  ]

  return (
    <>
      {/* SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-start justify-center pt-24 px-4">
          <Card className="w-full max-w-xl relative rounded-lg">
            <button
              className="absolute top-3 right-3 bg-muted/60 px-2.5 py-1 rounded border border-border text-[11px] text-muted-foreground hover:bg-muted/80 transition"
              onClick={() => setSearchOpen(false)}
            >
              ESC
            </button>
            <CardContent className="p-4 space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search courses, lessons, features"
                  className="rounded-full pl-10 h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-md border border-border bg-muted/40 hover:bg-muted/60 transition text-sm text-muted-foreground w-full"
                  >
                    <suggestion.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
        {/* Main header container */}
        <div
          className={`flex items-center justify-between px-4 lg:px-8 backdrop-blur-lg transition-all duration-300 ${
            isTop ? "h-14 lg:h-14" : "h-12 lg:h-12"
          }`}
        >
          {/* Logo + Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Hamburger menu button */}
            <button
              data-mobile-menu-trigger
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 rounded-md border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-white" />
              ) : (
                <Menu className="h-4 w-4 text-white" />
              )}
            </button>

            <LeLoLogo />

            {/* BOTTOM NAVBAR inline when scrolled - hidden on mobile */}
            {!isTop && (
              <div className="hidden lg:flex gap-6 relative">
                {bottomNavLinks.map(link => (
                  <button
                    key={link.label}
                    ref={el => {
                      if (el) navRefs.current[link.view] = el
                    }}
                    onClick={() => handleNavClick(link.view)}
                    className={`relative text-sm transition whitespace-nowrap ${
                      activeTab === link.view
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <span
                  ref={underlineRef}
                  className="absolute bottom-[-4px] h-[2px] bg-foreground transition-all duration-300 ease-out"
                  style={{ left: 0, width: 0 }}
                />
              </div>
            )}
          </div>

          {/* Right side icons */}
          {isTop && (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search */}
              <div
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 h-8 w-32 md:w-64 rounded-full border border-border bg-muted/40 text-sm text-muted-foreground hover:text-white hover:bg-muted/60 cursor-pointer transition"
              >
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <span className="hidden md:block flex-1 text-left text-white">Search</span>
                <span className="hidden md:block text-xs text-gray-400">F</span>
              </div>

              <button
                onClick={() => setSearchOpen(true)}
                className="sm:hidden h-8 w-8 rounded-full border border-border bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition"
              >
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </button>

              <div className="hidden sm:block h-5 border-l border-border/50" />

              <button
                onClick={() => setNotifOpen(v => !v)}
                className="h-8 w-8 rounded-full border border-border bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition"
              >
                <Bell className="h-3.5 w-3.5 text-gray-400" />
              </button>

              <div className="hidden sm:block h-5 border-l border-border/50" />

              <IconButton className="hidden sm:flex">
                <LifeBuoy className="h-3.5 w-3.5 text-gray-400" />
              </IconButton>

              <div className="hidden sm:block h-5 border-l border-border/50" />

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                {user && (
                  <div
                    className="h-8 w-8 rounded-full border border-border bg-muted/40 flex items-center justify-center cursor-pointer hover:bg-muted/60 transition"
                    onClick={() => setProfileOpen(v => !v)}
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="User avatar"
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                        {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                )}

                {profileOpen && user && (
                  <div className="absolute right-0 mt-2 w-72 rounded-md border bg-card shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <ProfileItem label="Dashboard" onClick={() => handleNavClick('overview')} />
                      <ProfileItem label="Account settings" onClick={() => handleNavClick('settings')} />
                      <ProfileItem label="Browse courses" onClick={() => handleNavClick('courses')} rightIcon={Search} />
                    </div>
                    <div className="border-t p-1">
                      <ProfileItem label="Home page" href="/" rightIcon={Home} />
                      <ProfileItem label="Log out" onClick={handleLogout} rightIcon={LogOut} />
                    </div>
                    <div className="p-3 border-t">
                      <Button className="w-full h-8 text-sm">Upgrade to Pro</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom navbar normal - hidden on mobile */}
        {isTop && (
          <div className="relative hidden lg:block">
            <div className="flex gap-6 mt-3 px-8">
              {bottomNavLinks.map(link => (
                <button
                  key={link.label}
                  ref={el => {
                    if (el) navRefs.current[link.view] = el
                  }}
                  onClick={() => handleNavClick(link.view)}
                  className={`relative text-sm transition whitespace-nowrap ${
                    activeTab === link.view
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="relative h-[2px] bg-border mt-2">
              <span
                ref={underlineRef}
                className="absolute bottom-0 h-[2px] bg-foreground transition-all duration-300 ease-out"
                style={{ left: 0, width: 0 }}
              />
            </div>
          </div>
        )}

        {/* MOBILE NAVIGATION DRAWER */}
        <div
          ref={mobileMenuRef}
          className={`fixed top-0 left-0 h-full w-64 bg-black border-r border-white/10 z-50 transform transition-transform duration-300 lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-white/10">
            <LeLoLogo />
          </div>

          <nav className="p-4">
            <div className="space-y-1">
              {bottomNavLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.view)}
                  className={`w-full text-left block px-4 py-2.5 rounded-md text-sm transition ${
                    activeTab === link.view
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {user && (
              <>
                <div className="my-4 border-t border-white/10" />
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      router.push('/')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-md text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
                  >
                    Home page
                    <Home className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-md text-sm text-white/60 hover:bg-white/5 hover:text-white transition"
                  >
                    Log out
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Notifications dropdown */}
        {notifOpen && (
          <div
            ref={notifRef}
            className="absolute top-14 right-4 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card shadow-lg overflow-hidden z-50"
          >
            <div className="flex border-b border-border/50">
              {(["Inbox", "Archived"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setNotifTab(tab)}
                  className={`flex-1 text-center py-2 text-sm ${
                    notifTab === tab
                      ? "border-b-2 border-white text-white"
                      : "text-gray-400 hover:text-white"
                  } transition`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-56 overflow-y-auto p-2 space-y-1">
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-md hover:bg-gray-800 transition flex flex-col"
                >
                  <span className="text-white text-sm">{notif.title}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{notif.time}</span>
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-border/50">
              <Button className="w-full h-8 text-sm">
                {notifTab === "Inbox" ? "Archive" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </header>
    </>
  )
}

function IconButton({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <button className={`h-8 w-8 rounded-full border border-border bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition ${className}`}>
      {children}
    </button>
  )
}

function ProfileItem({
  label,
  href,
  onClick,
  rightIcon: Icon,
}: {
  label: string
  href?: string
  onClick?: () => void
  rightIcon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-muted/60 hover:text-white transition flex items-center justify-between"
      onClick={() => {
        if (href) window.location.href = href
        if (onClick) onClick()
      }}
    >
      {label}
      {Icon && <Icon className="h-3.5 w-3.5" />}
    </button>
  )
}