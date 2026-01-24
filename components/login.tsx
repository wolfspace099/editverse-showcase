"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FC } from "react"
import { createClient } from "@supabase/supabase-js"
import { LeLoLogo } from "./lelo-logo"
import { X } from "lucide-react"

interface DiscordLoginPopupProps {
  onClose?: () => void
}

// Supabase client using env variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const DiscordLoginPopup: FC<DiscordLoginPopupProps> = ({ onClose }) => {
  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin },
    })
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
          {/* Logo */}
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
            className="w-full bg-black text-white border border-white hover:bg-black/90 transition-all rounded-lg font-medium py-2"
          >
            Login with Discord
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
