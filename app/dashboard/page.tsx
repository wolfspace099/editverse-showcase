"use client"

import { Suspense, useEffect, useState } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import OverviewContent from "@/components/dashboard/overview-content"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabaseClient"
import type { User } from "@supabase/supabase-js"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasApplication, setHasApplication] = useState<boolean | null>(null)
  const [applicationStatus, setApplicationStatus] = useState<"pending" | "approved" | "rejected" | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [dismissedAccessNotice, setDismissedAccessNotice] = useState(false)
  const [dismissedPendingNotice, setDismissedPendingNotice] = useState(false)
  const [dismissedRejectedNotice, setDismissedRejectedNotice] = useState(false)

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
          .select("id, status, rejection_reason")
          .eq("user_id", session.user.id)
          .single()

        if (appError && appError.code !== "PGRST116") {
          console.error("Application check error:", appError)
        }

        setHasApplication(!!appData)
        setApplicationStatus((appData?.status as "pending" | "approved" | "rejected" | undefined) ?? null)
        setRejectionReason(appData?.rejection_reason ?? null)
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
        {hasApplication === false && !dismissedAccessNotice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div
              className="relative w-full max-w-xs p-5 space-y-4 text-center rounded-2xl"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)" }}
            >

              {/* Close button */}
              <button
                onClick={() => setDismissedAccessNotice(true)}
                className="absolute top-3 right-3 h-7 w-7 rounded-full text-white/60 hover:text-white transition-colors flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="Dismiss notice"
              >
                <X className="h-3.5 w-3.5" />
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

        {applicationStatus === "rejected" && !dismissedRejectedNotice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div
              className="relative w-full max-w-md p-5 space-y-4 text-center rounded-2xl"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <button
                onClick={() => setDismissedRejectedNotice(true)}
                className="absolute top-3 right-3 h-7 w-7 rounded-full text-white/60 hover:text-white transition-colors flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="Dismiss notice"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <h2 className="text-xl font-bold text-white">Application Rejected</h2>
              <p className="text-white/80 text-sm">
                Your application was reviewed and was not approved at this time.
              </p>
              {rejectionReason && (
                <div className="text-left border border-white/10 rounded-lg p-3 bg-white/5">
                  <p className="text-xs uppercase tracking-wide text-white/50 mb-1">Reason</p>
                  <p className="text-sm text-white/90">{rejectionReason}</p>
                </div>
              )}
              <p className="text-xs text-white/50">
                Contact an admin if you want to reapply.
              </p>
            </div>
          </div>
        )}

        {applicationStatus === "pending" && !dismissedPendingNotice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div
              className="relative w-full max-w-md p-5 space-y-4 text-center rounded-2xl"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <button
                onClick={() => setDismissedPendingNotice(true)}
                className="absolute top-3 right-3 h-7 w-7 rounded-full text-white/60 hover:text-white transition-colors flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="Dismiss notice"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <h2 className="text-xl font-bold text-white">Application In Review</h2>
              <p className="text-white/80 text-sm">
                Your application has been submitted and is waiting for admin approval.
              </p>
              <p className="text-xs text-white/50">
                You can explore the dashboard, but course lessons stay locked until approval.
              </p>
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
