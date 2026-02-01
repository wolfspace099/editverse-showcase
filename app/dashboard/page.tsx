"use client"

import { Suspense, useEffect, useState } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import OverviewContent from "@/components/dashboard/overview-content"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabaseClient"
import type { User } from "@supabase/supabase-js"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasApplication, setHasApplication] = useState<boolean | null>(null)

  // Page state
  const [page, setPage] = useState<string>("overview")

  // Detect page & course from query param
  useEffect(() => {
    const courseParam = searchParams?.get("course")
    if (courseParam) {
      router.replace(`/dashboard/courses/${courseParam}`)
      return
    }
    
    const pageParam = searchParams?.get("page") || "overview"
    setPage(pageParam)
  }, [searchParams, router])

  // Check authentication & load application status
  useEffect(() => {
    let mounted = true

    async function checkAuthAndApplication() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error || !session?.user) {
          router.replace("/login")
          return
        }

        setUser(session.user)

        // Check if application exists
        const { data: appData, error: appError } = await supabase
          .from("applications")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (appError && appError.code !== "PGRST116") {
          console.error("Application check error:", appError)
        }

        setHasApplication(!!appData)
        setLoading(false)
      } catch (err) {
        console.error("Auth or application check error:", err)
        if (mounted) router.replace("/login")
      }
    }

    checkAuthAndApplication()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        router.replace("/login")
      } else {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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

      <main className="flex-1 pt-28 lg:pt-36 relative">
        {page === "overview" && <OverviewContent userId={user.id} />}

        {/* Application modal */}
        {hasApplication === false && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-black border border-white/10 rounded-2xl w-full max-w-xs p-5 space-y-4 text-center relative">

              {/* Close button */}
              <button
                onClick={() => setHasApplication(true)}
                className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold">Get access</h2>
              <p className="text-white/60 text-sm">
                Apply now for free and unlock premium features:
              </p>

              <ul className="space-y-2 text-left mt-3 px-2">
                {[
                  "Unlimited assets",
                  "Access to premium courses",
                  "Join exclusive editor community",
                  "Track your progress & achievements"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-white flex-shrink-0" />
                    <span className="text-white/90 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="bg-white text-black hover:bg-white/90 w-full mt-4"
                onClick={() => router.push("/dashboard/onboarding")}
              >
                Apply Now
              </Button>
            </div>
          </div>
        )}



        {page !== "overview" && (
          <div className="flex items-center justify-center h-full pt-20">
            <p className="text-white/40">This page is under construction.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
