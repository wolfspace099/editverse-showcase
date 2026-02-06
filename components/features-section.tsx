"use client"

import { Rotate3d, ArrowLeftRight, Database, Combine, UploadIcon, Plus } from "lucide-react"
import { FaTools } from "react-icons/fa"

const features = [
  {
    icon: FaTools,
    title: "Unlimited free assets",
    description: "Get access to easy editing assets, as: effects, animations, text, textures and more. All for free",
  },
  {
    icon: ArrowLeftRight,
    title: "Community collaboration",
    description: "With a community of editors in our discord, you can ask anything, anywhere.",
  },
  {
    icon: UploadIcon,
    title: "Improve you skill",
    description: "We offer unlimited premium courses, all for free, specially designed to be followed by beginners to advanced.",
  },
  {
    icon: Plus,
    title: "Get clients",
    description: "Connect with clients through our platform for security and no hassle of advertising.",
  },
]

export function FeatureSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-6 flex flex-col gap-12 md:gap-16">
        <div className="flex flex-col gap-4 md:gap-5 max-w-xl mx-auto text-center">
          <p className="text-sm md:text-base font-semibold text-muted-foreground">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why choose Editverse?</h2>
          <p className="text-base text-muted-foreground">
            Transform the way your editing goes:
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="flex flex-col gap-5 items-center text-center">
                <div className="flex justify-center items-center w-10 h-10 shrink-0 rounded-md bg-background border shadow-sm">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
