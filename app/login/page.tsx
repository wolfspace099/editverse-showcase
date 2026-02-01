"use client"

import { Suspense, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FaDiscord } from "react-icons/fa"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useRouter, useSearchParams } from "next/navigation"
import { GeistSans } from "geist/font/sans"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(false)
  const authError =
    searchParams?.get("error_description") ||
    searchParams?.get("error") ||
    ""

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
      }
    }
    checkUser()
  }, [supabase, router])

  const handleDiscordLogin = async () => {
    setLoading(true)

    try {
      await supabase.auth.signOut()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "identify email",
          skipBrowserRedirect: false,
        }
      })

      if (error) {
        console.error("OAuth error:", error)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("Login error:", err)
      setLoading(false)
    }
  }

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center p-6`}>
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center">
            <FaDiscord className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Login with Discord</h1>
          <p className="text-sm text-white/50">
            Join the editing team in minutes
          </p>
        </div>

        {authError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center">
            {authError === "no_code" && "Authentication failed"}
            {authError === "no_session" && "Could not create session"}
            {authError !== "no_code" && authError !== "no_session" && authError}
          </div>
        )}

        <Button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="w-full bg-white text-black hover:bg-white/90 h-12 text-base font-medium"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-black/20 border-t-black" />
              <span>Connecting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FaDiscord className="h-5 w-5" />
              <span>Login with Discord</span>
            </div>
          )}
        </Button>

        <div className="flex items-center justify-center gap-6 text-xs text-white/40">
          <button
            onClick={() => router.push("/")}
            className="hover:text-white/60 transition"
          >
            Home
          </button>
          <span>•</span>
          <a
            href="https://discord.gg/your-invite"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/60 transition"
          >
            Join Discord
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
