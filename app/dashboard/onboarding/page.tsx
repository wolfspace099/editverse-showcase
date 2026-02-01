"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check } from "lucide-react"
import { createApplication } from "@/lib/supabaseApi"
import { LeLoLogo } from "@/components/lelo-logo"

type OnboardingStep = "name" | "why" | "age" | "experience" | "portfolio" | "review" | "submitting" | "success"

type FormData = {
  full_name: string
  why_join: string
  age: number | ""
  experience_level: "Beginner" | "Intermediate" | "Advanced" | "Professional"
  portfolio_url: string
}

export default function OnboardingCard({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>("name")
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    why_join: "",
    age: "",
    experience_level: "Beginner",
    portfolio_url: ""
  })
  const [error, setError] = useState("")

  const steps: OnboardingStep[] = ["name", "why", "age", "experience", "portfolio", "review"]

  const handleNext = () => {
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) setStep(steps[idx + 1])
  }

  const handleSubmit = async () => {
    if (!userId) {
      setError("User session not found. Please refresh and try again.")
      return
    }

    setStep("submitting")
    setError("")
    try {
      const { error: submitError } = await createApplication({
        user_id: userId,
        full_name: formData.full_name,
        age: typeof formData.age === "number" ? formData.age : undefined,
        experience_level: formData.experience_level,
        why_join: formData.why_join,
        portfolio_url: formData.portfolio_url || undefined
      })

      if (submitError) {
        setError(submitError.message)
        setStep("review")
        return
      }

      setStep("success")
      setTimeout(() => onComplete(), 2000)
    } catch (err) {
      setError("Failed to submit application. Please try again.")
      setStep("review")
    }
  }

  const canContinue = () => {
    switch (step) {
      case "name":
        return formData.full_name.trim().length > 0
      case "why":
        return formData.why_join.trim().length > 10
      case "age":
        return typeof formData.age === "number" && formData.age > 0
      default:
        return true
    }
  }

  const currentStepIndex = steps.indexOf(step)
  const totalSteps = steps.length

  return (
    <div className="min-h-screen bg-black flex">
      
      {/* Left side - Form */}
      <div className="w-full lg:w-[45%] flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10">
          <div className="max-w-lg mx-auto">
            <LeLoLogo size={32} />
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 px-8 py-16 overflow-y-auto">
          <div className="max-w-lg mx-auto">
            
            {/* Progress bars - Frame style */}
            {step !== "submitting" && step !== "success" && (
              <div className="flex gap-2 mb-12">
                {steps.map((s, idx) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      idx <= currentStepIndex ? 'bg-white' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Name step */}
            {step === "name" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">What's your name?</h1>
                  <p className="text-base text-gray-400 leading-relaxed">This is how we'll address you in Editverse.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Full name</label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white focus:ring-1 focus:ring-white rounded-lg"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && canContinue() && handleNext()}
                  />
                </div>
              </div>
            )}

            {/* Why step */}
            {step === "why" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">Why do you edit?</h1>
                  <p className="text-base text-gray-400 leading-relaxed">Share your passion and motivation for video editing.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Your motivation</label>
                  <textarea
                    placeholder="I edit because..."
                    value={formData.why_join}
                    onChange={e => setFormData({ ...formData, why_join: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 text-base rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white focus:ring-1 focus:ring-white resize-none"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">Minimum 10 characters</p>
                </div>
              </div>
            )}

            {/* Age step */}
            {step === "age" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">How old are you?</h1>
                  <p className="text-base text-gray-400 leading-relaxed">This helps us personalize your experience.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Age</label>
                  <Input
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age || ""}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white focus:ring-1 focus:ring-white rounded-lg"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && canContinue() && handleNext()}
                  />
                </div>
              </div>
            )}

            {/* Experience step */}
            {step === "experience" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">What's your experience level?</h1>
                  <p className="text-base text-gray-400 leading-relaxed">All skill levels are welcome in our community.</p>
                </div>
                <div className="space-y-3">
                  {(["Beginner", "Intermediate", "Advanced", "Professional"] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setFormData({ ...formData, experience_level: level })
                        setTimeout(handleNext, 200)
                      }}
                      className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                        formData.experience_level === level 
                          ? 'border-white bg-white/10' 
                          : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-base">{level}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            {level === "Beginner" && "Just starting your editing journey"}
                            {level === "Intermediate" && "Comfortable with basic techniques"}
                            {level === "Advanced" && "Proficient with advanced workflows"}
                            {level === "Professional" && "Industry-level expertise"}
                          </div>
                        </div>
                        {formData.experience_level === level && (
                          <Check className="w-5 h-5 text-white flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio step */}
            {step === "portfolio" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">Share your work</h1>
                  <p className="text-base text-gray-400 leading-relaxed">Add a link to your portfolio or previous projects. This is optional.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Portfolio URL</label>
                  <Input
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolio_url}
                    onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })}
                    className="h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white focus:ring-1 focus:ring-white rounded-lg"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleNext()}
                  />
                  <p className="text-xs text-gray-500">YouTube, Vimeo, or your personal website</p>
                </div>
              </div>
            )}

            {/* Review step */}
            {step === "review" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">Review your application</h1>
                  <p className="text-base text-gray-400 leading-relaxed">Make sure everything looks correct before submitting.</p>
                </div>
                <div className="space-y-4">
                  <ReviewRow label="Name" value={formData.full_name} />
                  <ReviewRow label="Motivation" value={formData.why_join} />
                  <ReviewRow label="Age" value={String(formData.age)} />
                  <ReviewRow label="Experience" value={formData.experience_level} />
                  {formData.portfolio_url && <ReviewRow label="Portfolio" value={formData.portfolio_url} />}
                </div>
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submitting state */}
            {step === "submitting" && (
              <div className="text-center py-16 animate-in fade-in duration-500">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mb-6" />
                <p className="text-gray-400">Submitting your application...</p>
              </div>
            )}

            {/* Success state */}
            {step === "success" && (
              <div className="text-center py-16 animate-in fade-in zoom-in duration-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white mb-6">
                  <Check className="h-6 w-6 text-black" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Application submitted</h2>
                <p className="text-gray-400">Welcome to Editverse!</p>
              </div>
            )}

          </div>
        </div>

        {/* Footer with continue button */}
        {step !== "submitting" && step !== "success" && (
          <div className="px-8 py-8 border-t border-white/10">
            <div className="max-w-lg mx-auto">
              {step !== "review" ? (
                <Button
                  onClick={handleNext}
                  disabled={!canContinue()}
                  className="w-full h-14 text-base bg-white text-black hover:bg-gray-200 disabled:bg-white/10 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors rounded-lg font-medium"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="w-full h-14 text-base bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-medium"
                >
                  Submit Application
                  <Check className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right side - Dashboard preview */}
      <div className="hidden lg:flex lg:w-[55%] bg-zinc-950 relative overflow-hidden items-center justify-center p-16">
        <div className="w-full h-full max-w-5xl max-h-[800px] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <img 
            src="/images/dashboard-showcase.png" 
            alt="Editverse Dashboard Preview"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-white/10 last:border-0">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <span className="text-sm text-white text-right max-w-xs truncate">{value}</span>
    </div>
  )
}