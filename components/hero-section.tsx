"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg z-0" />

      {/* Wave pattern */}
      <div className="absolute inset-0 pattern-1 opacity-60 z-10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 container px-6 flex flex-col items-center gap-12 lg:gap-16 mx-auto">
        <div className="flex gap-12 lg:gap-16">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
            <h1
              id="hero-heading"
              className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent text-3xl lg:text-5xl font-bold flex-1"
            >
              Work with Editors, not against them
            </h1>

            <div className="flex-1 w-full flex flex-col gap-8">
              <p className="text-foreground text-base lg:text-lg">
                Start editing, follow courses, get unlimited free assets, get clients, and collaborate easily with our community – all in one platform. Designed to be easy, accessable and free. With no strings attached.
              </p>

              <div className="flex flex-col lg:flex-row gap-3">
                <Button>Get started</Button>
                <Button variant="ghost">
                  Explore more
                  <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-xl border bg-background shadow-xl">
          <AspectRatio ratio={16 / 7.9}>
            <Image
              src="/images/dashboard-showcase.png"
              alt="Flowly dashboard interface showing order statistics and revenue metrics"
              fill
              priority
              className="object-cover"
            />
          </AspectRatio>
        </div>
      </div>
    </section>
  )
}
