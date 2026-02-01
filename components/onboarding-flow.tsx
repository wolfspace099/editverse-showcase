"use client"

import { useState } from "react"
import { GeistSans } from "geist/font/sans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LeLoLogo } from "@/components/lelo-logo"
import { Check, Sparkles } from "lucide-react"
import { createApplication } from "@/lib/supabaseApi"

type OnboardingStep = 1 | 2 | 3 | "submitting" | "success"

type FormData = {
  full_name: string
  age: string
  experience_level: "Beginner" | "Intermediate" | "Advanced" | "Professional"
  why_join: string
  portfolio_url: string
}

export default function OnboardingFlow({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>(1)
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    age: "",
    experience_level: "Beginner",
    why_join: "",
    portfolio_url: ""
  })
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setStep("submitting")
    setError("")

    const ageValue = Number(formData.age)
    const normalizedAge = Number.isFinite(ageValue) && ageValue > 0 ? ageValue : undefined

    try {
      const { error: submitError } = await createApplication({
        user_id: userId,
        full_name: formData.full_name,
        age: normalizedAge,
        experience_level: formData.experience_level,
        why_join: formData.why_join,
        portfolio_url: formData.portfolio_url || undefined
      })

      if (submitError) {
        setError(submitError.message)
        setStep(3)
        return
      }

      setStep("success")
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (err) {
      setError("Failed to submit application. Please try again.")
      setStep(3)
    }
  }

  const canContinueStep = () => {
    const ageValue = Number(formData.age)

    switch (step) {
      case 1:
        return formData.full_name.trim().length > 0 && formData.age.trim().length > 0 && Number.isFinite(ageValue) && ageValue > 0
      case 2:
        return formData.why_join.trim().length > 20
      case 3:
        return true
      default:
        return true
    }
  }

  if (step === "submitting") {
    return (
      <div className={`${GeistSans.className} fixed inset-0 bg-black text-white z-50 flex items-center justify-center`}>
        <div className="text-center space-y-6">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
          <p className="text-white/50">Submitting your application...</p>
        </div>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className={`${GeistSans.className} fixed inset-0 bg-black text-white z-50 flex items-center justify-center`}>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Application submitted</h2>
            <p className="text-sm text-white/50">We'll review and get back to you soon</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${GeistSans.className} fixed inset-0 bg-black text-white z-50 overflow-auto`}>
      <div className="min-h-screen grid lg:grid-cols-[480px_1fr]">
        {/* Left side - Form */}
        <div className="bg-white/[0.02] border-r border-white/10 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <LeLoLogo size={32} />
              <span className="text-lg font-semibold">Editor Team</span>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Apply for the team</h1>
              <p className="text-sm text-white/50">
                Video Editor • Remote • Flexible hours
              </p>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full name<span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your name"
                      className="bg-white/5 border-white/10 h-11"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Age<span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Your age"
                      className="bg-white/5 border-white/10 h-11"
                      type="number"
                      inputMode="numeric"
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Experience level<span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Beginner", "Intermediate", "Advanced", "Professional"] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setFormData({ ...formData, experience_level: level })}
                          className={`px-3 py-2.5 rounded-lg border text-sm transition ${
                            formData.experience_level === level
                              ? "border-white bg-white/10 text-white"
                              : "border-white/10 hover:border-white/30 text-white/70"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!canContinueStep()}
                  className="w-full bg-white text-black hover:bg-white/90 h-11 disabled:opacity-30"
                >
                  Continue
                </Button>

                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                </div>
              </div>
            )}

            {/* Step 2: Motivation */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Why do you want to join?<span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.why_join}
                      onChange={(e) => setFormData({ ...formData, why_join: e.target.value })}
                      placeholder="Tell us what motivates you as an editor..."
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
                      autoFocus
                    />
                    <p className="text-xs text-white/30 mt-2">
                      {formData.why_join.length} / 20 characters minimum
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 border-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canContinueStep()}
                    className="flex-1 bg-white text-black hover:bg-white/90 disabled:opacity-30"
                  >
                    Continue
                  </Button>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  <div className="h-2 w-2 rounded-full bg-white" />
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                </div>
              </div>
            )}

            {/* Step 3: Portfolio & Submit */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Portfolio URL
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 h-11 bg-white/5 border border-white/10 border-r-0 rounded-l-lg flex items-center text-sm text-white/40">
                        https://
                      </span>
                      <Input
                        value={formData.portfolio_url}
                        onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                        placeholder="your-portfolio.link"
                        className="bg-white/5 border-white/10 h-11 rounded-l-none flex-1"
                        type="text"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-2">Optional - Share your best work</p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1 border-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-white text-black hover:bg-white/90"
                  >
                    Submit Application
                  </Button>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  <div className="h-2 w-2 rounded-full bg-white" />
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Visual content */}
        <div className="relative hidden lg:flex bg-gradient-to-br from-white/5 via-black to-black">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-20 left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="relative w-full flex items-center justify-center p-16">
            <div className="max-w-xl space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <Sparkles className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/70">Join our creative team</span>
                </div>
                
                <h2 className="text-4xl font-bold leading-tight">
                  We believe in empowering editors to create their best work
                </h2>
                
                <p className="text-lg text-white/60">
                  Join a team of passionate video editors. Access premium courses, exclusive assets, 
                  and collaborate with creators worldwide. We'd love to have you on board.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-2xl font-bold mb-1">500+</div>
                  <div className="text-sm text-white/50">Active Members</div>
                </div>
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-2xl font-bold mb-1">50+</div>
                  <div className="text-sm text-white/50">Premium Courses</div>
                </div>
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-2xl font-bold mb-1">100%</div>
                  <div className="text-sm text-white/50">Remote Work</div>
                </div>
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="text-2xl font-bold mb-1">24/7</div>
                  <div className="text-sm text-white/50">Community Support</div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-sm text-white/40 italic">
                  "This team helped me grow from a beginner to landing my first client. The resources and community are incredible."
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div>
                    <div className="text-sm font-medium">Alex Chen</div>
                    <div className="text-xs text-white/40">Professional Editor</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
