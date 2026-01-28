"use client"

import { FC, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { LeLoLogo } from "./lelo-logo"
import { FaDiscord } from "react-icons/fa"
import { getSupabaseClient } from "@/lib/supabaseClient"

interface DiscordLoginPopupProps {
  onClose?: () => void
}

export const DiscordLoginPopup: FC<DiscordLoginPopupProps> = ({ onClose }) => {
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleDiscordLogin = async () => {
    setLoading(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: window.location.origin },
      })
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
    <>
      {/* Main onboarding popup */}
      {!showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg"
          onClick={onClose}
        >
          <Card
            className="relative w-full max-w-4xl min-h-[480px] grid grid-cols-2 rounded-2xl shadow-2xl border border-white/10 bg-black overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col justify-center px-12">
              <CardHeader className="px-0">
                <div className="w-32 h-24 mb-4">
                  <LeLoLogo size={96} />
                </div>
                <CardTitle className="text-2xl text-white">Welcome</CardTitle>
                <p className="text-sm text-white/60 mt-2">
                  Log in to start your onboarding and request access to our assets and courses.
                </p>
              </CardHeader>

              <CardFooter className="px-0 pt-6 flex flex-col gap-4">
                <Button
                  onClick={handleDiscordLogin}
                  disabled={loading}
                  className="w-full bg-black text-white border border-white hover:bg-black/90 rounded-lg flex items-center justify-center gap-2"
                >
                  {loading ? <Loader /> : (
                    <>
                      <FaDiscord className="w-5 h-5" />
                      Continue with Discord
                    </>
                  )}
                </Button>

                <p className="text-xs text-white/60 text-center">
                  Already have an account?{" "}
                  <span
                    className="text-white underline cursor-pointer"
                    onClick={() => setShowLoginModal(true)}
                  >
                    Sign in
                  </span>
                </p>
              </CardFooter>
            </div>

            <div className="relative hidden md:block">
              <img
                src="/images/login-visual.jpg"
                alt="Visual"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          </Card>
        </div>
      )}

      {/* Login modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
          <Card className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/10 bg-black">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="px-0">
              <div className="w-32 h-16 mb-4">
                <LeLoLogo size={70} />
              </div>
              <CardTitle className="text-2xl text-white">Sign in</CardTitle>
              <p className="text-sm text-white/60 mt-2">
                Access your account to continue.
              </p>
            </CardHeader>

            <CardFooter className="px-0 pt-6 flex flex-col gap-4">
              <Button
                onClick={handleDiscordLogin}
                disabled={loading}
                className="w-full bg-black text-white border border-white hover:bg-black/90 rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader /> : (
                  <>
                    <FaDiscord className="w-5 h-5" />
                    Continue with Discord
                  </>
                )}
              </Button>

              <p className="text-xs text-white/60 text-center">
                Don't have an account yet?{" "}
                <span
                  className="text-white underline cursor-pointer"
                  onClick={() => setShowLoginModal(false)}
                >
                  Sign up
                </span>
              </p>
            </CardFooter>
          </Card>
        </div>
      )}

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
    </>
  )
}
