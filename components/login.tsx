"use client"

import { FC, useEffect, useState } from "react"
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
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    experience: "",
    reason: "",
  })

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

  // Check if the logged-in user has an application
  const checkApplication = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: application, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") console.error(error)
    return !!application
  }

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

  // After page load, check if logged-in user has application
  useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Check if the user has an application
      const { data: application, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(1)
        .single()

      if (!application) {
        setStep("name") // trigger onboarding
      } else {
        onClose?.() // skip onboarding
      }
    }
  })

  return () => listener.subscription.unsubscribe()
}, [])


  // Handle final submission
  const submitApplication = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("applications").insert([
      {
        user_id: user.id,
        name: formData.name,
        age: formData.age,
        experience: formData.experience,
        reason: formData.reason,
        status: "pending",
      },
    ])

    if (error) console.error(error)
    setStep("pending")
    setLoading(false)
  }

  // Render content per onboarding step
  const renderStepContent = () => {
    const fieldSpacing = "mt-6"
    const slideClasses = `transition-transform duration-300 ease-out ${animateDirection === "right" ? "translate-x-0" : "translate-x-0"}`

    switch (step) {
      case "login":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0 flex flex-col items-center">
              <div className="w-16 h-16 mb-4">
                <LeLoLogo />
              </div>
              <CardTitle className="text-2xl text-white">Welcome</CardTitle>
              <p className="text-sm text-white/60 mt-2 text-center">
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
      case "age":
      case "experience":
      case "reason": {
        const labels = {
          name: "What’s your name?",
          age: "How old are you?",
          experience: "Your experience",
          reason: "Why do you want to join?",
        }
        const placeholders = {
          name: "Your name",
          age: "Your age",
          experience: "What are you currently working on or learning?",
          reason: "What do you hope to get out of this?",
        }

        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <HelpCircle className="w-5 h-5 text-white/60 cursor-pointer" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-black border border-white/10 rounded-lg p-3 text-xs text-white/80 shadow-xl">
                      {labels[step]}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">{labels[step]}</CardTitle>
              </div>
              <p className="text-sm text-white/60 mt-2">
                {step === "name" && "Please provide your real name so we can greet you personally."}
                {step === "age" && "Knowing your age helps us provide a better onboarding experience."}
                {step === "experience" && "This helps us understand your skill level and what content might suit you best."}
                {step === "reason" && "Share your motivation so we can provide the best experience for you."}
              </p>
            </CardHeader>

            <CardContent className={`px-0 ${fieldSpacing}`}>
              {step === "name" || step === "age" ? (
                <Input
                  type={step === "age" ? "number" : "text"}
                  placeholder={placeholders[step]}
                  value={formData[step]}
                  onChange={(e) => setFormData({ ...formData, [step]: e.target.value })}
                  autoFocus
                />
              ) : (
                <Textarea
                  placeholder={placeholders[step]}
                  value={formData[step]}
                  onChange={(e) => setFormData({ ...formData, [step]: e.target.value })}
                  autoFocus
                />
              )}
            </CardContent>

            <CardFooter className="px-0 pt-6 flex justify-between">
              <button onClick={skipOnboarding} className="text-sm text-white/50 hover:text-white">
                Skip
              </button>
              <Button
                onClick={() => step === "reason" ? submitApplication() : next(step === "name" ? "age" : step === "age" ? "experience" : "reason")}
                className="bg-white text-black hover:bg-white/90"
              >
                {step === "reason" ? "Submit" : "Next"}
              </Button>
            </CardFooter>
          </div>
        )
      }

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

      {/* Login modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
          <Card className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/10 bg-black overflow-hidden">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="px-0 flex flex-col items-center">
              <div className="w-16 h-16 mb-4">
                <LeLoLogo />
              </div>
              <CardTitle className="text-2xl text-white">Sign in</CardTitle>
              <p className="text-sm text-white/60 mt-2 text-center">
                Access your account by signing in with Discord.
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
          </Card>
        </div>
      )}
    </>
  )
}
