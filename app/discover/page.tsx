"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Home,
  BookOpen,
  Layers,
  Bell,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
  User,
  MessageSquare,
} from "lucide-react"

export default function EditverseHomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [coursesOpen, setCoursesOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="fixed top-0 left-0 p-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-16"
          } transition-all duration-200 border-r border-muted h-[calc(100vh-4rem)] sticky top-16 bg-background flex flex-col`}
        >
          {/* User Section */}
          <div className="p-3">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setProfileMenuOpen((v) => !v)}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  C
                </div>
                {sidebarOpen && <span className="text-sm">Cat</span>}
              </div>
              {sidebarOpen && (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {profileMenuOpen && sidebarOpen && (
              <div className="mt-2 rounded-md border bg-card shadow-sm">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Manage profile
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Switch profile
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            <SidebarItem
              icon={Home}
              label="Overview"
              sidebarOpen={sidebarOpen}
              active
            />

            {/* Courses Dropdown */}
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setCoursesOpen((v) => !v)}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4" />
                {sidebarOpen && <span className="text-sm">Courses</span>}
              </div>
              {sidebarOpen &&
                (coursesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </Button>

            {coursesOpen && (
              <div className="ml-8 space-y-1">
                <SidebarSubItem label="All courses" />
                <SidebarSubItem label="In progress" />
                <SidebarSubItem label="Completed" />
              </div>
            )}

            <SidebarItem
              icon={Layers}
              label="Skill paths"
              sidebarOpen={sidebarOpen}
              indicator
            />

            <SidebarItem
              icon={Bell}
              label="Notifications"
              sidebarOpen={sidebarOpen}
              badge="3"
            />

            <SidebarItem
              icon={Users}
              label="Community"
              sidebarOpen={sidebarOpen}
            />

            {/* Integrations */}
            <div className="pt-4">
              {sidebarOpen && (
                <p className="px-3 text-xs text-muted-foreground mb-1">
                  Integrations
                </p>
              )}
              <SidebarItem
                icon={MessageSquare}
                label="Discord"
                sidebarOpen={sidebarOpen}
                highlight
              />
            </div>
          </nav>

          {/* Bottom Banner */}
          <div className="p-3">
            {sidebarOpen && (
              <Card className="border-muted">
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-1">
                    New course released
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Advanced After Effects systems are now available.
                  </p>
                  <Button size="sm" className="w-full">
                    View course
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </aside>

        {/* Main Content Placeholder */}
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </main>
      </div>
    </div>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  sidebarOpen,
  active,
  badge,
  indicator,
  highlight,
}: {
  icon: any
  label: string
  sidebarOpen: boolean
  active?: boolean
  badge?: string
  indicator?: boolean
  highlight?: boolean
}) {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-between ${
        active ? "bg-muted" : ""
      } ${highlight ? "border border-primary/40" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {sidebarOpen && <span className="text-sm">{label}</span>}
      </div>

      {sidebarOpen && (
        <>
          {badge && (
            <span className="text-xs bg-primary text-primary-foreground rounded px-2">
              {badge}
            </span>
          )}
          {indicator && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </>
      )}
    </Button>
  )
}

function SidebarSubItem({ label }: { label: string }) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-sm text-muted-foreground"
    >
      {label}
    </Button>
  )
}
