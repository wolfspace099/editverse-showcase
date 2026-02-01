"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LeLoLogo } from "@/components/lelo-logo"
import { FaDiscord } from "react-icons/fa"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { GeistSans } from "geist/font/sans"

export default function LoginPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)

  const handleDiscordLogin = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: "identify email"
        }
      })

      if (error) throw error

      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const Loader = () => (
    <span className="loader-dots relative w-6 h-4 flex items-center justify-between">
      <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-0" />
      <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150" />
      <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-300" />
    </span>
  )

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center p-4`}>
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">

        {/* Left side - Login form */}
        <div className="flex flex-col justify-center px-8 md:px-12 py-12">
          <div className="w-32 h-24 mb-6">
            <LeLoLogo size={96} />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {showSignIn ? "Welcome back" : "Welcome"}
          </h1>

          <p className="text-white/60 mb-8">
            {showSignIn
              ? "Sign in to access your account and continue learning."
              : "Log in to start your onboarding and request access to our assets and courses."}
          </p>

          <div className="space-y-4">

            <Button
              onClick={handleDiscordLogin}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-white/90 rounded-lg h-12 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader />
              ) : (
                <>
                  <FaDiscord className="w-5 h-5" />
                  Continue with Discord
                </>
              )}
            </Button>

            <p className="text-xs text-white/60 text-center">
              {showSignIn ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setShowSignIn(false)}
                    className="text-white underline hover:text-white/80 transition"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="text-white underline hover:text-white/80 transition"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            <div className="pt-4">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-white/60 hover:text-white transition"
              >
                ← Back to home
              </button>
            </div>

          </div>
        </div>

        {/* Right side - Visual */}
        <div className="relative hidden md:block min-h-[500px]">
          <img
            src="/images/login-visual.jpg"
            alt="Login visual"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/20" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">
                Master Video Editing
              </h2>
              <p className="text-white/80 text-lg">
                Access premium courses, assets, and join our community
              </p>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .animate-bounce { animation: bounce 0.6s infinite ease-in-out; }
        .delay-0 { animation-delay: 0s; }
        .delay-150 { animation-delay: 0.15s; }
        .delay-300 { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
