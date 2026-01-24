"use client"

import { FC, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LeLoLogo } from "./lelo-logo"
import { X } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabaseClient"

interface DiscordLoginPopupProps {
  onClose?: () => void
}

export const DiscordLoginPopup: FC<DiscordLoginPopupProps> = ({ onClose }) => {
  const supabase = getSupabaseClient()
  
  const [loading, setLoading] = useState(false)

  const handleDiscordLogin = async () => {
    setLoading(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: window.location.origin },
      })
      // OAuth redirect will happen automatically
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden bg-black relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader className="flex flex-col items-center gap-2 pt-6">
          <div className="w-16 h-16">
            <LeLoLogo />
          </div>
          <CardTitle className="text-lg text-white">Login with Discord</CardTitle>
        </CardHeader>

        <CardContent className="text-center text-white/80">
          <p className="text-sm">
            Click the button below to login with your Discord account.
          </p>
        </CardContent>

        <CardFooter className="px-6 pb-6">
          <Button
            onClick={handleDiscordLogin}
            disabled={loading}
            className="w-full bg-black text-white border border-white hover:bg-black/90 transition-all rounded-lg font-medium py-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="loader-dots relative w-6 h-4 flex items-center justify-between">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></span>
              </span>
            ) : (
              "Login with Discord"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Loader animation styles */}
      <style jsx>{`
        .loader-dots span {
          display: inline-block;
        }
        .animate-bounce {
          animation: bounce 0.6s infinite ease-in-out;
        }
        .delay-0 {
          animation-delay: 0s;
        }
        .delay-150 {
          animation-delay: 0.15s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
