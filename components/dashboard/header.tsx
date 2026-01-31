"use client"

import { useState, useEffect, useRef } from "react"
import { LeLoLogo } from "../lelo-logo"
import { Button } from "@/components/ui/button"
import { DiscordLoginPopup } from "../login"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { Bell, LifeBuoy, Search, FileText, Home, LogOut } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const bottomNavLinks = [
  "Overview",
  "Courses",
  "Skill level",
  "Progress",
  "Integrations",
  "Support",
  "Settings",
]

type User = {
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export function Header() {
  const supabase = getSupabaseClient()

  const [isTop, setIsTop] = useState(true)
  const [popupOpen, setPopupOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifTab, setNotifTab] = useState<"Inbox" | "Archived">("Inbox")
  const [activeBottomTab, setActiveBottomTab] = useState("Overview")

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const underlineRef = useRef<HTMLSpanElement>(null)

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsTop(window.scrollY < 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Supabase auth
  useEffect(() => {
    supabase.auth.getSession().then(res => {
      setUser((res.data?.session?.user as User) ?? null)
    })
    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser((session?.user as User) ?? null)
      })
    return () => authListener.subscription.unsubscribe()
  }, [supabase])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") setSearchOpen(true)
      if (e.key === "Escape") setSearchOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  // Click outside profile/notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Reset underline whenever active tab or window size changes
  useEffect(() => {
    const updateUnderline = () => {
      const activeRef = navRefs.current[activeBottomTab]
      if (activeRef && underlineRef.current) {
        underlineRef.current.style.left = `${activeRef.offsetLeft}px`
        underlineRef.current.style.width = `${activeRef.offsetWidth}px`
      }
    }
    updateUnderline()
    window.addEventListener("resize", updateUnderline)
    return () => window.removeEventListener("resize", updateUnderline)
  }, [activeBottomTab])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfileOpen(false)
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
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-start justify-center pt-24">
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
                    <suggestion.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
        {/* Main header container */}
        <div
          className={`flex items-center justify-between px-4 backdrop-blur-lg transition-all duration-300 ${
            isTop ? "h-14" : "h-12"
          }`}
        >
          {/* Logo left/top */}
          <div className="flex items-center gap-6">
            <LeLoLogo />

            {/* BOTTOM NAVBAR inline when scrolled */}
            {!isTop && (
              <div className="flex gap-6 relative">
                {bottomNavLinks.map(link => (
                  <button
                    key={link}
                    ref={el => {
                      if (el) navRefs.current[link] = el
                    }}
                    onClick={() => setActiveBottomTab(link)}
                    className={`relative text-sm transition ${
                      activeBottomTab === link
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link}
                  </button>
                ))}
                <span
                  ref={underlineRef}
                  className="absolute bottom-[-4px] h-[2px] bg-foreground transition-all duration-300"
                  style={{ left: 0, width: 0 }}
                />
              </div>
            )}
          </div>

          {/* Right side (search + icons) - only visible at top */}
          {isTop && (
            <div className="flex items-center gap-4">
              <div
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 h-8 w-64 rounded-full border border-border bg-muted/40 text-sm text-muted-foreground hover:text-white hover:bg-muted/60 cursor-pointer transition"
              >
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <span className="flex-1 text-left text-white">Search</span>
                <span className="text-xs text-gray-400">F</span>
              </div>

              <div className="h-5 border-l border-border/50" />

              <button
                onClick={() => setNotifOpen(v => !v)}
                className="h-8 w-8 rounded-full border border-border bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition"
              >
                <Bell className="h-3.5 w-3.5 text-gray-400" />
              </button>

              <div className="h-5 border-l border-border/50" />

              <IconButton>
                <LifeBuoy className="h-3.5 w-3.5 text-gray-400" />
              </IconButton>

              <div className="h-5 border-l border-border/50" />

              <div className="relative" ref={profileRef}>
                {user && (
                  <div
                    className="h-8 w-8 rounded-full border border-border bg-muted/40 flex items-center justify-center cursor-pointer hover:bg-muted/60 transition"
                    onClick={() => setProfileOpen(v => !v)}
                  >
                    <img
                      src={user.user_metadata?.avatar_url || ""}
                      alt="User avatar"
                      className="h-6 w-6 rounded-full"
                    />
                  </div>
                )}

                {profileOpen && user && (
                  <div className="absolute right-0 mt-2 w-72 rounded-md border bg-card shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <ProfileItem label="Dashboard" href="/dashboard" />
                      <ProfileItem label="Account settings" href="/settings" />
                      <ProfileItem label="Browse courses" href="/courses" rightIcon={Search} />
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

        {/* Bottom navbar normal, below header at top */}
        {isTop && (
          <div className="relative">
            <div className="flex gap-6 mt-3 px-4">
              {bottomNavLinks.map(link => (
                <button
                  key={link}
                  ref={el => {
                    if (el) navRefs.current[link] = el
                  }}
                  onClick={() => setActiveBottomTab(link)}
                  className={`relative text-sm transition ${
                    activeBottomTab === link
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link}
                </button>
              ))}
            </div>
            {/* Separator bar with underline */}
            <div className="relative h-[2px] bg-border mt-2">
              <span
                ref={underlineRef}
                className="absolute bottom-0 h-[2px] bg-foreground transition-all duration-300"
                style={{ left: 0, width: 0 }}
              />
            </div>
          </div>
        )}

        {/* Notifications dropdown */}
        {notifOpen && (
          <div
            ref={notifRef}
            className="absolute top-14 right-4 w-80 rounded-md border border-border bg-card shadow-lg overflow-hidden z-50"
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

      {popupOpen && <DiscordLoginPopup onClose={() => setPopupOpen(false)} />}
    </>
  )
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-8 w-8 rounded-full border border-border bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition">
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
