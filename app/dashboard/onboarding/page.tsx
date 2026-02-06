"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createApplication } from "@/lib/supabaseApi"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

type OnboardingStep = "name" | "why" | "age" | "experience" | "portfolio" | "submitting" | "success"

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
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [step, setStep] = useState<OnboardingStep>("name")
  const [userEmail, setUserEmail] = useState<string>("")
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    why_join: "",
    age: "",
    experience_level: "Beginner",
    portfolio_url: ""
  })
  const [error, setError] = useState("")

  const steps: OnboardingStep[] = ["name", "why", "age", "experience", "portfolio"]

  // Get user email on mount
  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUserEmail()
  }, [])

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

  const handleNext = () => {
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1])
    } else {
      handleSubmit()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
        setStep("name")
        return
      }

      // Clear draft on success
      localStorage.removeItem('editverse_onboarding_draft')
      setStep("success")
      setTimeout(() => onComplete(), 2000)
    } catch (err) {
      setError("Failed to submit application. Please try again.")
      setStep("name")
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Name step */}
        {step === "name" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3 text-center">
              <h1 className="text-[2rem] font-medium tracking-tight text-foreground">
                What's your name?
              </h1>
              <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                This helps us personalize your experience.
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                placeholder="Your name"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="h-12 text-center text-base bg-background border-border text-foreground 
                  placeholder:text-muted-foreground focus-visible:ring-ring rounded-lg"
                autoFocus
                onKeyDown={e => e.key === "Enter" && canContinue() && handleNext()}
              />
              
              <Button
                onClick={handleNext}
                disabled={!canContinue()}
                className="w-full h-12 text-[0.9375rem] bg-foreground text-background 
                  hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground 
                  disabled:cursor-not-allowed rounded-lg font-medium"
              >
                Continue
              </Button>
            </div>

            {error && (
              <p className="text-sm text-center text-destructive">{error}</p>
            )}
          </div>
        )}

        {/* Why step */}
        {step === "why" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3 text-center">
              <h1 className="text-[2rem] font-medium tracking-tight text-foreground">
                Why do you edit?
              </h1>
              <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                Share your passion for video editing.
              </p>
            </div>
            
            <div className="space-y-4">
              <textarea
                placeholder="I edit because..."
                value={formData.why_join}
                onChange={e => setFormData({ ...formData, why_join: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 text-base text-center rounded-lg bg-background border border-border 
                  text-foreground placeholder:text-muted-foreground 
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  resize-none leading-relaxed"
                autoFocus
              />
              
              <Button
                onClick={handleNext}
                disabled={!canContinue()}
                className="w-full h-12 text-[0.9375rem] bg-foreground text-background 
                  hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground 
                  disabled:cursor-not-allowed rounded-lg font-medium"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Age step */}
        {step === "age" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3 text-center">
              <h1 className="text-[2rem] font-medium tracking-tight text-foreground">
                When is your birthday?
              </h1>
              <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                This helps us verify your account.
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="DD/MM/YYYY"
                value={formData.age || ""}
                onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                className="h-12 text-center text-base bg-background border-border text-foreground 
                  placeholder:text-muted-foreground focus-visible:ring-ring rounded-lg"
                autoFocus
                onKeyDown={e => e.key === "Enter" && canContinue() && handleNext()}
              />
              
              <Button
                onClick={handleNext}
                disabled={!canContinue()}
                className="w-full h-12 text-[0.9375rem] bg-foreground text-background 
                  hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground 
                  disabled:cursor-not-allowed rounded-lg font-medium"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Experience step */}
        {step === "experience" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3 text-center">
              <h1 className="text-[2rem] font-medium tracking-tight text-foreground">
                What's your experience level?
              </h1>
              <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                All skill levels are welcome.
              </p>
            </div>
            
            <div className="space-y-3">
              {([
                { level: "Beginner", desc: "Just starting your editing journey" },
                { level: "Intermediate", desc: "Comfortable with basic techniques and workflows" },
                { level: "Advanced", desc: "Proficient with complex editing and effects" },
                { level: "Professional", desc: "Industry-level expertise and portfolio" }
              ] as const).map(({ level, desc }) => (
                <button
                  key={level}
                  onClick={() => {
                    setFormData({ ...formData, experience_level: level })
                    setTimeout(handleNext, 200)
                  }}
                  className={`w-full px-4 py-3 rounded-lg border text-left transition-all ${
                    formData.experience_level === level 
                      ? 'border-foreground bg-foreground text-background' 
                      : 'border-border hover:border-foreground/50 text-foreground'
                  }`}
                >
                  <div className="font-medium text-base">{level}</div>
                  <div className={`text-sm mt-0.5 ${
                    formData.experience_level === level 
                      ? 'text-background/80' 
                      : 'text-muted-foreground'
                  }`}>
                    {desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio step */}
        {step === "portfolio" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3 text-center">
              <h1 className="text-[2rem] font-medium tracking-tight text-foreground">
                Share your work
              </h1>
              <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                Add a link to your portfolio (optional).
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                placeholder="https://yourportfolio.com"
                value={formData.portfolio_url}
                onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })}
                className="h-12 text-center text-base bg-background border-border text-foreground 
                  placeholder:text-muted-foreground focus-visible:ring-ring rounded-lg"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleNext()}
              />
              
              <Button
                onClick={handleNext}
                className="w-full h-12 text-[0.9375rem] bg-foreground text-background 
                  hover:bg-foreground/90 rounded-lg font-medium"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Submitting state */}
        {step === "submitting" && (
          <div className="text-center py-12 animate-in fade-in duration-500">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="h-8 w-8 border-2 border-muted border-t-foreground rounded-full animate-spin" />
            </div>
            <p className="text-base text-muted-foreground">Submitting application...</p>
          </div>
        )}

        {/* Success state */}
        {step === "success" && (
          <div className="text-center py-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-xl font-medium text-foreground mb-2">Application submitted</h2>
            <p className="text-base text-muted-foreground">Welcome to Editverse!</p>
          </div>
        )}

        {/* Footer text - shown on all question steps */}
        {step !== "submitting" && step !== "success" && (
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Email verified as {userEmail || "loading..."}
            </p>
            <button 
              onClick={handleLogout}
              className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}

      </div>
    </div>
  )
}