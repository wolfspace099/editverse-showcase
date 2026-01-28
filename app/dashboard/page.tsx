"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
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

  return (
    <Header />
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
