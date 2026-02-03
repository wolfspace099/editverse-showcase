"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check, ArrowLeft, Sparkles } from "lucide-react"
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

export default function OnboardingCard({ 
  userId, 
  onComplete 
}: { 
  userId: string | null | undefined
  onComplete: () => void 
}) {
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

  // Load saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('editverse_onboarding_draft')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFormData(parsed)
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])

  // Save draft whenever form data changes
  useEffect(() => {
    if (formData.full_name || formData.why_join) {
      localStorage.setItem('editverse_onboarding_draft', JSON.stringify(formData))
    }
  }, [formData])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentStepIndex > 0 && step !== 'review' && step !== 'submitting') {
        handleBack()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step])

  const handleNext = () => {
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) setStep(steps[idx + 1])
  }

  const handleBack = () => {
    const idx = steps.indexOf(step)
    if (idx > 0) setStep(steps[idx - 1])
  }

  const handleStepJump = (targetStep: OnboardingStep) => {
    setStep(targetStep)
  }

  const handleSubmit = async () => {
    // Enhanced user validation
    if (!userId) {
      setError("Authentication required. Please sign in and try again.")
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

      // Clear draft on success
      localStorage.removeItem('editverse_onboarding_draft')
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
        return formData.full_name.trim().length >= 2
      case "why":
        return formData.why_join.trim().length >= 10
      case "age":
        return typeof formData.age === "number" && formData.age >= 13 && formData.age <= 120
      default:
        return true
    }
  }

  const currentStepIndex = steps.indexOf(step)
  const totalSteps = steps.length
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-white flex">
      
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 pointer-events-none" />
        
        {/* Header */}
        <div className="relative px-6 sm:px-8 lg:px-12 py-6 border-b border-gray-200/80">
          <div className="max-w-md mx-auto">
            <LeLoLogo size={28} />
          </div>
        </div>

        {/* Form content */}
        <div className="relative flex-1 px-6 sm:px-8 lg:px-12 py-12 overflow-y-auto">
          <div className="max-w-md mx-auto">
            
            {/* Progress indicator - Vercel style */}
            {step !== "submitting" && step !== "success" && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-500 tracking-wide">
                    STEP {currentStepIndex + 1} OF {totalSteps}
                  </p>
                  <p className="text-xs font-medium text-gray-400">
                    {Math.round(progressPercentage)}%
                  </p>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Name step */}
            {step === "name" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                    What's your name?
                  </h1>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Help us personalize your experience in Editverse.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <Input
                    id="name"
                    placeholder="Alex Johnson"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-11 text-[15px] bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 
                      focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 rounded-lg transition-all"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && canContinue() && handleNext()}
                  />
                  {formData.full_name.length > 0 && formData.full_name.length < 2 && (
                    <p className="text-xs text-amber-600">Name must be at least 2 characters</p>
                  )}
                </div>
              </div>
            )}

            {/* Why step */}
            {step === "why" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                    Why do you edit?
                  </h1>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Share your passion and motivation for video editing.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <label htmlFor="why" className="text-sm font-medium text-gray-700">
                    Your motivation
                  </label>
                  <textarea
                    id="why"
                    placeholder="I edit because it allows me to tell stories and express creativity..."
                    value={formData.why_join}
                    onChange={e => setFormData({ ...formData, why_join: e.target.value })}
                    rows={5}
                    className="w-full px-3.5 py-3 text-[15px] rounded-lg bg-white border border-gray-300 
                      text-gray-900 placeholder:text-gray-400 
                      focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 
                      resize-none transition-all leading-relaxed"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    {formData.why_join.length}/500 • Minimum 10 characters
                  </p>
                </div>
              </div>
            )}

            {/* Age step */}
            {step === "age" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                    How old are you?
                  </h1>
                  <p className="text-base text-gray-600 leading-relaxed">
                    This helps us tailor content and recommendations.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <label htmlFor="age" className="text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age || ""}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="h-11 text-[15px] bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 
                      focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 rounded-lg transition-all"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && canContinue() && handleNext()}
                  />
                  {formData.age !== "" && (formData.age < 13 || formData.age > 120) && (
                    <p className="text-xs text-amber-600">Please enter a valid age (13-120)</p>
                  )}
                </div>
              </div>
            )}

            {/* Experience step */}
            {step === "experience" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                    What's your experience level?
                  </h1>
                  <p className="text-base text-gray-600 leading-relaxed">
                    All skill levels are welcome in our community.
                  </p>
                </div>
                <div className="space-y-2.5">
                  {(["Beginner", "Intermediate", "Advanced", "Professional"] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setFormData({ ...formData, experience_level: level })
                        setTimeout(handleNext, 150)
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all group ${
                        formData.experience_level === level 
                          ? 'border-gray-900 bg-gray-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-[15px]">{level}</div>
                          <div className="text-sm text-gray-600 mt-0.5">
                            {level === "Beginner" && "Just starting your editing journey"}
                            {level === "Intermediate" && "Comfortable with basic techniques"}
                            {level === "Advanced" && "Proficient with advanced workflows"}
                            {level === "Professional" && "Industry-level expertise"}
                          </div>
                        </div>
                        {formData.experience_level === level && (
                          <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio step */}
            {step === "portfolio" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                      Share your work
                    </h1>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                      Optional
                    </span>
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Add a link to your portfolio or previous projects.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <label htmlFor="portfolio" className="text-sm font-medium text-gray-700">
                    Portfolio URL
                  </label>
                  <Input
                    id="portfolio"
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolio_url}
                    onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })}
                    className="h-11 text-[15px] bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 
                      focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 rounded-lg transition-all"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleNext()}
                  />
                  <p className="text-xs text-gray-500">YouTube, Vimeo, or your personal website</p>
                </div>
              </div>
            )}

            {/* Review step */}
            {step === "review" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                    Review your application
                  </h1>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Make sure everything looks correct before submitting.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-200 overflow-hidden">
                  <ReviewRow label="Name" value={formData.full_name} onEdit={() => handleStepJump("name")} />
                  <ReviewRow label="Motivation" value={formData.why_join} onEdit={() => handleStepJump("why")} />
                  <ReviewRow label="Age" value={String(formData.age)} onEdit={() => handleStepJump("age")} />
                  <ReviewRow label="Experience" value={formData.experience_level} onEdit={() => handleStepJump("experience")} />
                  {formData.portfolio_url && (
                    <ReviewRow label="Portfolio" value={formData.portfolio_url} onEdit={() => handleStepJump("portfolio")} />
                  )}
                </div>
                {error && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-900 font-medium">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submitting state */}
            {step === "submitting" && (
              <div className="text-center py-20 animate-in fade-in duration-500">
                <div className="inline-flex items-center justify-center mb-6">
                  <div className="h-10 w-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Submitting application</h2>
                <p className="text-sm text-gray-600">This will only take a moment...</p>
              </div>
            )}

            {/* Success state */}
            {step === "success" && (
              <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 mb-6 shadow-lg">
                  <Check className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Application submitted</h2>
                <p className="text-base text-gray-600">Welcome to Editverse!</p>
              </div>
            )}

          </div>
        </div>

        {/* Footer with navigation */}
        {step !== "submitting" && step !== "success" && (
          <div className="relative px-6 sm:px-8 lg:px-12 py-5 border-t border-gray-200/80 bg-white/80 backdrop-blur-sm">
            <div className="max-w-md mx-auto flex gap-3">
              {currentStepIndex > 0 && step !== "review" && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="h-11 px-5 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 
                    transition-all rounded-lg font-medium text-[15px]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                onClick={step === "review" ? handleSubmit : handleNext}
                disabled={!canContinue() && step !== "review" && step !== "portfolio"}
                className="flex-1 h-11 text-[15px] bg-gray-900 text-white hover:bg-gray-800 
                  disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed 
                  transition-all rounded-lg font-medium shadow-sm hover:shadow"
              >
                {step === "review" ? "Submit Application" : "Continue"}
                {step === "review" ? (
                  <Check className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-center mt-3 text-xs text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-700 font-mono">ESC</kbd> to go back
            </p>
          </div>
        )}
      </div>

      {/* Right side - Dashboard preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-100 via-gray-50 to-white relative overflow-hidden items-center justify-center p-12">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.04)_0%,transparent_50%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gray-200/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-gray-200/30 to-transparent rounded-full blur-3xl" />
        
        <div className="relative w-full max-w-2xl">
          <div className="relative rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xl shadow-gray-900/10 bg-white">
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-200/80 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-600 font-medium">
                  editverse.app/dashboard
                </div>
              </div>
            </div>
            
            {/* Preview image */}
            <div className="aspect-[16/10] bg-gray-50">
              <img 
                src="/images/dashboard-showcase.png" 
                alt="Editverse Dashboard Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Caption */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Join thousands of creators in Editverse
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

function ReviewRow({ 
  label, 
  value, 
  onEdit 
}: { 
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group text-left"
    >
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-900 max-w-xs truncate font-medium">{value}</span>
        <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors font-medium">
          Edit
        </span>
      </div>
    </button>
  )
}