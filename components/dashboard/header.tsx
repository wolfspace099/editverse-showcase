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

export function Header() {
  const supabase = getSupabaseClient()

  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const [popupOpen, setPopupOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifTab, setNotifTab] = useState<"Inbox" | "Archived">("Inbox")
  const [activeBottomTab, setActiveBottomTab] = useState("Overview")

  const profileRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    supabase.auth.getSession().then(res =>
      setUser(res.data?.session?.user ?? null)
    )
    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
    return () => authListener.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") setSearchOpen(true)
      if (e.key === "Escape") setSearchOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfileOpen(false)
  }

  const searchSuggestions = [
    {
      icon: FileText,
      label: "CapCut short-form workflows",
      subtext: "Speed up your short-form editing",
    },
    {
      icon: FileText,
      label: "After Effects expressions",
      subtext: "Automate motion graphics",
    },
    {
      icon: FileText,
      label: "AI editing tools",
      subtext: "Cutting-edge AI for editing",
    },
    {
      icon: FileText,
      label: "Premiere Pro tips",
      subtext: "Boost your editing efficiency",
    },
  ]

  const notifications = [
    { title: "Course updated: Premiere Pro", time: "2h ago" },
    { title: "New comment on your workflow", time: "5h ago" },
    { title: "AI course recommendation", time: "1d ago" },
  ]

  return (
    <>
      {searchOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-start justify-center pt-32">
          <Card className="w-full max-w-2xl relative rounded-lg">
            <button
              className="absolute top-4 right-4 bg-muted/60 px-3 py-1 rounded border border-border text-xs text-muted-foreground hover:bg-muted/80 transition"
              onClick={() => setSearchOpen(false)}
            >
              ESC
            </button>

            <CardContent className="p-6 space-y-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search courses, lessons, features"
                  className="rounded-full pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {searchSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted/60 transition text-sm text-muted-foreground w-full"
                  >
                    <suggestion.icon className="h-5 w-5 text-muted-foreground" />
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NAVBAR */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 h-14 backdrop-blur-lg transition-all ${
            isScrolled ? "bg-background/90" : "bg-background/95"
          }`}
        >
          <LeLoLogo />

          <div className="flex items-center gap-3">
            <div
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 h-9 w-80 rounded-full border border-border bg-muted/40 text-sm text-muted-foreground hover:text-white hover:bg-muted/60 cursor-pointer transition"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <span className="flex-1 text-left text-white">Search</span>
              <span className="text-xs text-gray-400">F</span>
            </div>

            <div className="h-6 border-l border-border/50" />

            <button
              onClick={() => setNotifOpen(v => !v)}
              className="h-9 w-9 rounded-full border border-border bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition"
            >
              <Bell className="h-4 w-4 text-gray-400" />
            </button>

            <div className="h-6 border-l border-border/50" />

            <IconButton>
              <LifeBuoy className="h-4 w-4 text-gray-400" />
            </IconButton>

            <div className="h-6 border-l border-border/50" />

            {/* PROFILE */}
            <div className="relative" ref={profileRef}>
              {user && (
                <div
                  className="h-9 w-9 rounded-full border border-border bg-muted/40 flex items-center justify-center cursor-pointer hover:bg-muted/60 transition"
                  onClick={() => setProfileOpen(v => !v)}
                >
                  <img
                    src={user.user_metadata?.avatar_url || ""}
                    alt="User avatar"
                    className="h-7 w-7 rounded-full"
                  />
                </div>
              )}

              {profileOpen && user && (
                <div className="absolute right-0 mt-2 w-72 rounded-md border bg-card shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <div className="p-1">
                    <ProfileItem label="Dashboard" href="/dashboard" />
                    <ProfileItem label="Account settings" href="/settings" />
                    <ProfileItem
                      label="Browse courses"
                      href="/courses"
                      rightIcon={Search}
                    />
                  </div>

                  <div className="border-t p-1">
                    <ProfileItem
                      label="Home page"
                      href="/"
                      rightIcon={Home}
                    />
                    <ProfileItem
                      label="Log out"
                      onClick={handleLogout}
                      rightIcon={LogOut}
                    />
                  </div>

                  <div className="p-3 border-t">
                    <Button className="w-full">Upgrade to Pro</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS DROPDOWN */}
        {notifOpen && (
          <div
            ref={notifRef}
            className="absolute top-14 right-6 w-80 rounded-md border border-border bg-card shadow-lg overflow-hidden z-50"
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

            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-md hover:bg-gray-800 transition flex flex-col"
                >
                  <span className="text-white text-sm">{notif.title}</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {notif.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-border/50">
              <Button className="w-full text-sm">
                {notifTab === "Inbox" ? "Archive" : "Delete"}
              </Button>
            </div>
          </div>
        )}

{/* BOTTOM NAVBAR */}
<div className="relative flex h-16 px-6 bg-background items-center gap-10 border-b border-border">
  {bottomNavLinks.map(link => (
    <button
      key={link}
      onClick={() => setActiveBottomTab(link)}
      className="relative text-sm text-muted-foreground hover:text-foreground transition"
    >
      {link}
    </button>
  ))}

  {/* Active tab underline overlay */}
  <span
    className="absolute bottom-0 h-[2px] bg-foreground transition-all duration-300"
    style={{
      left: `${bottomNavLinks.indexOf(activeBottomTab) * 100 / bottomNavLinks.length}%`,
      width: `${100 / bottomNavLinks.length}%`,
    }}
  />
</div>




      </header>

      {popupOpen && <DiscordLoginPopup onClose={() => setPopupOpen(false)} />}
    </>
  )
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-9 w-9 rounded-full border border-border bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition">
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
      {Icon && <Icon className="h-4 w-4" />}
    </button>
  )
}
