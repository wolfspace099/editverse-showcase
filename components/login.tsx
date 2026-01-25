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

  // Onboarding form state
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [experience, setExperience] = useState("")
  const [reason, setReason] = useState("")

  // Check session and application on mount
  useEffect(() => {
    const checkUserApplication = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: application, error } = await supabase
          .from("applications")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (application) {
          // Application exists → skip onboarding
          onClose?.()
        } else {
          // No application → show onboarding
          setStep("name")
          setShowLoginModal(false)
        }
      }
    }

    checkUserApplication()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: application } = await supabase
          .from("applications")
          .select("*")
          .eq("user_id", session.user.id)
          .single()
        if (application) {
          onClose?.()
        } else {
          setStep("name")
          setShowLoginModal(false)
        }
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [onClose, supabase])

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

  // Submit application
  const submitApplication = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error("Not signed in")

      await supabase.from("applications").insert({
        user_id: session.user.id,
        name,
        age,
        experience,
        reason,
        status: "pending",
      })

      setStep("pending")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
            </CardFooter>
          </div>
        )

      case "name":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <CardTitle className="text-2xl text-white">What’s your name?</CardTitle>
            </CardHeader>
            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Input placeholder="Your name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
            </CardContent>
            <CardFooter className="px-0 pt-6 flex justify-between">
              <button onClick={skipOnboarding} className="text-sm text-white/50 hover:text-white">Skip</button>
              <Button onClick={() => next("age")} className="bg-white text-black hover:bg-white/90">Next</Button>
            </CardFooter>
          </div>
        )

      case "age":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <CardTitle className="text-2xl text-white">How old are you?</CardTitle>
            </CardHeader>
            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Input type="number" placeholder="Your age" value={age} onChange={(e) => setAge(e.target.value)} autoFocus />
            </CardContent>
            <CardFooter className="px-0 pt-6 flex justify-between">
              <button onClick={skipOnboarding} className="text-sm text-white/50 hover:text-white">Skip</button>
              <Button onClick={() => next("experience")} className="bg-white text-black hover:bg-white/90">Next</Button>
            </CardFooter>
          </div>
        )

      case "experience":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <CardTitle className="text-2xl text-white">Your experience</CardTitle>
            </CardHeader>
            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Textarea placeholder="What are you currently working on or learning?" value={experience} onChange={(e) => setExperience(e.target.value)} autoFocus />
            </CardContent>
            <CardFooter className="px-0 pt-6 flex justify-between">
              <button onClick={skipOnboarding} className="text-sm text-white/50 hover:text-white">Skip</button>
              <Button onClick={() => next("reason")} className="bg-white text-black hover:bg-white/90">Next</Button>
            </CardFooter>
          </div>
        )

      case "reason":
        return (
          <div className={slideClasses}>
            <CardHeader className="px-0">
              <CardTitle className="text-2xl text-white">Why do you want to join?</CardTitle>
            </CardHeader>
            <CardContent className={`px-0 ${fieldSpacing}`}>
              <Textarea placeholder="What do you hope to get out of this?" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
            </CardContent>
            <CardFooter className="px-0 pt-6 flex justify-between">
              <button onClick={skipOnboarding} className="text-sm text-white/50 hover:text-white">Skip</button>
              <Button onClick={submitApplication} className="bg-white text-black hover:bg-white/90">Submit</Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg" onClick={onClose}>
          <Card className="relative w-full max-w-4xl min-h-[480px] grid grid-cols-2 rounded-2xl shadow-2xl border border-white/10 bg-black overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col justify-center px-12 transition-all duration-300 ease-out relative">
              {renderStepContent()}
            </div>

            <div className="relative hidden md:block">
              <img src="/images/login-visual.jpg" alt="Visual" className="absolute inset-0 w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/40" />
            </div>

            {confirmSkip && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                <Card className="w-full max-w-md p-6 rounded-2xl">
                  <CardTitle className="text-lg text-white">Are you sure?</CardTitle>
                  <CardContent className="text-white/80 mt-2 text-sm">
                    If you skip, you won’t have access to courses or assets. You can reapply later in settings.
                  </CardContent>
                  <CardFooter className="mt-4 flex justify-end gap-4">
                    <Button onClick={confirmSkipNo} className="bg-black text-white border border-white hover:bg-black/90">Cancel</Button>
                    <Button onClick={confirmSkipYes} className="bg-white text-black hover:bg-white/90">Skip</Button>
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
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="px-0 flex flex-col items-center">
              <div className="w-20 h-20 mb-4">
                <LeLoLogo />
              </div>
              <CardTitle className="text-2xl text-white text-center">Sign in</CardTitle>
              <p className="text-sm text-white/60 mt-2 text-center">Access your account by signing in with Discord.</p>
            </CardHeader>

            <CardFooter className="px-0 pt-6 flex flex-col gap-4">
              <Button onClick={handleDiscordLogin} disabled={loading} className="w-full bg-black text-white border border-white hover:bg-black/90 rounded-lg flex items-center justify-center gap-2">
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
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  )
}
