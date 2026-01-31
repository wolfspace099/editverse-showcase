"use client"

import { useEffect, useState } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import OverviewContent from "@/components/dashboard/overview-content"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabaseClient"

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Page state
  const [page, setPage] = useState<string>("overview")

  // Detect page & course from query param
  useEffect(() => {
    const courseParam = searchParams?.get("course")
    if (courseParam) {
      // Redirect to unified courses player
      router.replace(`/dashboard/courses/${courseParam}`)
      return
    }
    
    const pageParam = searchParams?.get("page") || "overview"
    setPage(pageParam)
  }, [searchParams, router])

  // Check authentication
  useEffect(() => {
    let mounted = true

    async function resolveUser() {
      const fakeUserRaw =
        typeof window !== "undefined"
          ? localStorage.getItem("fake_user")
          : null

      if (fakeUserRaw) {
        try {
          const fakeUser = JSON.parse(fakeUserRaw)
          if (fakeUser?.id && mounted) {
            setUser(fakeUser)
            setLoading(false)
            return
          }
        } catch {
          localStorage.removeItem("fake_user")
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (!session?.user) {
        router.replace("/login")
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    resolveUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white flex flex-col`}>
      <Header currentView={page} />

      <main className="flex-1 pt-28 lg:pt-36">
        {page === "overview" && <OverviewContent userId={user.id} />}
        {page !== "overview" && (
          <div className="flex items-center justify-center h-full pt-20">
            <p className="text-white/40">This page is under construction.</p>
          </div>
        )}
      </main>
    </div>
  )
}
