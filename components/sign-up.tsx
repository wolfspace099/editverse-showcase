"use client"

import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { PenLine, ListTodo, Workflow } from "lucide-react"

const steps = [
  {
    icon: PenLine,
    title: "Login",
    description: "Use your Discord account to login within 10 seconds.",
  },
  {
    icon: ListTodo,
    title: "Apply",
    description: "Fill in a short form to get to know you and get accepted.",
  },
  {
    icon: Workflow,
    title: "Start upgrading your editing",
    description: "Edit smarter with our tools, features, community and more.",
  },
]

export function SignUpSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg z-0" />

      {/* Animated pattern */}
      <div className="absolute inset-0 pattern-1 animate-wave opacity-50 z-10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col lg:flex-row gap-12 md:gap-16 items-center">
        <div className="flex flex-col gap-8 flex-1">
          <div className="flex flex-col gap-4 md:gap-5">
            <p className="text-sm md:text-base font-semibold text-foreground">Steps</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Getting started is easy!
            </h2>
            <p className="text-base text-foreground">
              In just 2 simple steps, you're ready to go:
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                  <div className="flex justify-center items-center w-10 h-10 shrink-0 rounded-md bg-background border shadow-sm">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-foreground">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="overflow-hidden rounded-xl border bg-background shadow-xl">
            <AspectRatio ratio={1 / 1.1}>
              <Image
                src="/images/dashboard-showcase2.png"
                alt="Flowly dashboard showing detailed order management interface"
                fill
                className="object-cover"
              />
            </AspectRatio>
          </div>
        </div>
      </div>
    </section>
  )
}
