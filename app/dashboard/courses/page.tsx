"use client"

import { useEffect, useState } from "react"
import { GeistSans } from "geist/font/sans"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import CoursesContent from "@/components/dashboard/courses-content"
import { getSupabaseClient } from "@/lib/supabaseClient"

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export default function CoursesPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function resolveUser() {
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

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return

        if (!session?.user) {
          router.replace("/login")
          return
        }

        setUser(session.user)
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [supabase, router])

  if (loading) {
    return (
      <div
        className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}
      >
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white flex flex-col`}>
      <Header currentView="courses" />

      <main className="flex-1 pt-28 lg:pt-36 pb-20">
        <CoursesContent userId={user.id} />
      </main>
    </div>
  )
}
