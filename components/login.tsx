"use client"

import { FC, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, HelpCircle, X } from "lucide-react"
import { LeLoLogo } from "./lelo-logo"
import { FaDiscord } from "react-icons/fa"
import { getSupabaseClient } from "@/lib/supabaseClient"

interface DiscordLoginPopupProps {
  onClose?: () => void
}

type Step =
  | "login"
  | "name"
  | "age"
  | "experience"
  | "reason"
  | "pending"

export const DiscordLoginPopup: FC<DiscordLoginPopupProps> = ({ onClose }) => {
  const supabase = getSupabaseClient()
  const [step, setStep] = useState<Step>("login")
  const [loading, setLoading] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [animateDirection, setAnimateDirection] = useState<"left" | "right">("right")

  // Move to next onboarding step with animation
  const next = (nextStep: Step) => {
    setAnimateDirection("right")
    setLoading(true)
    setTimeout(() => {
      setStep(nextStep)
      setLoading(false)
    }, 300)
  }

  const skipOnboarding = () => setConfirmSkip(true)
  const confirmSkipYes = () => { setConfirmSkip(false); onClose?.() }
  const confirmSkipNo = () => setConfirmSkip(false)

  // Supabase Discord OAuth login
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

  // Render content per onboarding step
  const renderStepContent = () => {
    const fieldSpacing = "mt-6"
    const slideClasses = `transition-transform duration-300 ease-out ${animateDirection === "right" ? "translate-x-0" : "translate-x-0"}`

    switch (step) {
      case "login":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <div className="w-16 h-16 mb-4">
                <LeLoLogo />
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
                {loading ? (
                  <span className="loader-dots relative w-6 h-4 flex items-center justify-between">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></span>
                  </span>
                ) : (
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

            <style jsx>{`
              .loader-dots span { display: inline-block; }
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

      case "name":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <HelpCircle className="w-5 h-5 text-white/60 cursor-pointer" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-black border border-white/10 rounded-lg p-3 text-xs text-white/80 shadow-xl">
                      We use your name to personalize your dashboard and welcome messages.
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">What’s your name?</CardTitle>
              </div>
              <p className="text-sm text-white/60 mt-2">
                Please provide your real name so we can greet you personally.
              </p>
            </CardHeader>

            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Input placeholder="Your name" autoFocus />
            </CardContent>

            <CardFooter className="px-0 pt-6 flex justify-between">
              <button
                onClick={skipOnboarding}
                className="text-sm text-white/50 hover:text-white"
              >
                Skip
              </button>
              <Button
                onClick={() => next("age")}
                className="bg-white text-black hover:bg-white/90"
              >
                Next
              </Button>
            </CardFooter>
          </div>
        )

      case "age":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <HelpCircle className="w-5 h-5 text-white/60 cursor-pointer" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-black border border-white/10 rounded-lg p-3 text-xs text-white/80 shadow-xl">
                      Your age helps us tailor the content and resources to your level.
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">How old are you?</CardTitle>
              </div>
              <p className="text-sm text-white/60 mt-2">
                Knowing your age helps us provide a better onboarding experience.
              </p>
            </CardHeader>

            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Input type="number" placeholder="Your age" autoFocus />
            </CardContent>

            <CardFooter className="px-0 pt-6 flex justify-between">
              <button
                onClick={skipOnboarding}
                className="text-sm text-white/50 hover:text-white"
              >
                Skip
              </button>
              <Button
                onClick={() => next("experience")}
                className="bg-white text-black hover:bg-white/90"
              >
                Next
              </Button>
            </CardFooter>
          </div>
        )

      case "experience":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <HelpCircle className="w-5 h-5 text-white/60 cursor-pointer" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-black border border-white/10 rounded-lg p-3 text-xs text-white/80 shadow-xl">
                      Share your current projects or skills so we know your background.
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">Your experience</CardTitle>
              </div>
              <p className="text-sm text-white/60 mt-2">
                This helps us understand your skill level and what content might suit you best.
              </p>
            </CardHeader>

            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Textarea placeholder="What are you currently working on or learning?" autoFocus />
            </CardContent>

            <CardFooter className="px-0 pt-6 flex justify-between">
              <button
                onClick={skipOnboarding}
                className="text-sm text-white/50 hover:text-white"
              >
                Skip
              </button>
              <Button
                onClick={() => next("reason")}
                className="bg-white text-black hover:bg-white/90"
              >
                Next
              </Button>
            </CardFooter>
          </div>
        )

      case "reason":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0 flex items-center gap-2">
              <div className="relative group">
                <HelpCircle className="w-5 h-5 text-white/60 cursor-pointer" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="bg-black border border-white/10 rounded-lg p-3 text-xs text-white/80 shadow-xl">
                    We use this to review access requests manually.
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Why do you want to join?</CardTitle>
            </CardHeader>

            <p className="text-sm text-white/60 mt-2">
              Share your motivation so we can provide the best experience for you.
            </p>

            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Textarea placeholder="What do you hope to get out of this?" autoFocus />
            </CardContent>

            <CardFooter className="px-0 pt-6 flex justify-between">
              <button
                onClick={skipOnboarding}
                className="text-sm text-white/50 hover:text-white"
              >
                Skip
              </button>
              <Button
                onClick={() => next("pending")}
                className="bg-white text-black hover:bg-white/90"
              >
                Submit
              </Button>
            </CardFooter>
          </div>
        )

      case "pending":
        return (
          <div className={slideClasses + " flex flex-col items-center justify-center text-center text-white h-full"}>
            <CheckCircle2 className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold">Application submitted</h3>
            <p className="text-sm text-white/70 mt-2">
              You have limited access while we review your request.
            </p>
          </div>
        )
    }
  }

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

            <div className="flex flex-col justify-center px-12 transition-all duration-300 ease-out relative">
              {renderStepContent()}
            </div>

            <div className="relative hidden md:block">
              <img
                src="/images/login-visual.jpg"
                alt="Visual"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Skip confirmation modal */}
            {confirmSkip && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                <Card className="w-full max-w-md p-6 rounded-2xl">
                  <CardTitle className="text-lg text-white">Are you sure?</CardTitle>
                  <CardContent className="text-white/80 mt-2 text-sm">
                    If you skip, you won’t have access to courses or assets. You can reapply later in settings.
                  </CardContent>
                  <CardFooter className="mt-4 flex justify-end gap-4">
                    <Button onClick={confirmSkipNo} className="bg-black text-white border border-white hover:bg-black/90">
                      Cancel
                    </Button>
                    <Button onClick={confirmSkipYes} className="bg-white text-black hover:bg-white/90">
                      Skip
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Login modal (replaces main popup) */}
{showLoginModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
    <Card className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/10 bg-black overflow-hidden">
      
      <button
        onClick={() => setShowLoginModal(false)}
        className="absolute top-4 right-4 text-white/60 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <CardHeader className="px-0">
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-16 h-16 mb-4">
            <LeLoLogo />
          </div>
        </div>
        <CardTitle className="text-2xl text-white">Sign in</CardTitle>
        <p className="text-sm text-white/60 mt-2">
          Access your account by signing in with Discord. And get back to learning!
        </p>
      </CardHeader>

      <CardFooter className="px-0 pt-6 flex flex-col gap-4">
        <Button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="w-full bg-black text-white border border-white hover:bg-black/90 rounded-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="loader-dots relative w-6 h-4 flex items-center justify-between">
              <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></span>
              <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></span>
            </span>
          ) : (
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
            onClick={() => {
              setStep("login");
              setShowLoginModal(false);
            }}
          >
            Sign up
          </span>
        </p>
      </CardFooter>

      <style jsx>{`
        .loader-dots span { display: inline-block; }
        .animate-bounce { animation: bounce 0.6s infinite ease-in-out; }
        .delay-0 { animation-delay: 0s; }
        .delay-150 { animation-delay: 0.15s; }
        .delay-300 { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
      
    </Card>
  </div>
)}

    </>
  )
}
