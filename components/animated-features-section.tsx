"use client"

import type React from "react"
import { motion } from "framer-motion"
import { AnimatedGradient } from "@/components/ui/animated-gradient-with-svg"
import { GraduationCap, Users, Video, Download, Star, Zap } from "lucide-react"

interface BentoCardProps {
  title: string
  value: string | number
  subtitle?: string
  colors: string[]
  delay: number
  icon?: React.ReactNode
}

const BentoCard: React.FC<BentoCardProps> = ({ title, value, subtitle, colors, delay, icon }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className="relative overflow-hidden h-full bg-black rounded-lg border border-border/20 group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{
        filter: "url(#noise)",
      }}
    >
      <AnimatedGradient colors={colors} speed={0.05} blur="medium" />

      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
            mixBlendMode: "overlay",
          }}
        />
      </div>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="w-full h-full animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 1px, transparent 1px),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "48px 48px, 64px 64px",
            backgroundPosition: "0 0, 24px 24px",
          }}
        />
      </div>

      <div className="absolute inset-0 opacity-80 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-[shine_4s_ease-in-out_infinite] w-[200%]" />
      </div>

      <motion.div
        className="relative z-10 p-3 sm:p-5 md:p-8 text-foreground backdrop-blur-sm h-full flex flex-col justify-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {icon && (
          <motion.div className="mb-4 text-white" variants={item}>
            {icon}
          </motion.div>
        )}
        <motion.h3 className="text-sm sm:text-base md:text-lg text-foreground/80 mb-2" variants={item}>
          {title}
        </motion.h3>
        <motion.p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground" variants={item}>
          {value}
        </motion.p>
        {subtitle && (
          <motion.p className="text-sm text-foreground/60" variants={item}>
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}

export function AnimatedFeaturesSection() {
  return (
    <section id="process" className="py-20 px-4 bg-black">
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence baseFrequency="0.4" numOctaves="2" result="noise" seed="2" type="fractalNoise" />
            <feColorMatrix in="noise" type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0.02 0.04 0.06" />
            </feComponentTransfer>
            <feComposite operator="over" in2="SourceGraphic" />
          </filter>
        </defs>
      </svg>

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full border border-white/10 text-white/60 text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Process
          </motion.span>
          <h2
            className="text-2xl md:text-4xl font-bold text-white mb-4 text-balance"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            How we help editors <span className="text-white/70">succeed.</span>
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            From application to mastery, we provide everything you need to grow as a video editor
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
          <div className="md:col-span-2 min-h-[200px]">
            <BentoCard
              icon={<GraduationCap className="w-7 h-7" />}
              title="Step 1"
              value="Learn & Grow"
              subtitle="Access our comprehensive video courses and tutorials organized into chapters. Track your progress and master new skills at your own pace."
              colors={["#0a0a0a", "#111111", "#0f0f0f"]}
              delay={0.2}
            />
          </div>
          <div className="min-h-[200px]">
            <BentoCard
              icon={<Users className="w-7 h-7" />}
              title="Step 2"
              value="Join Community"
              subtitle="Connect with fellow editors on Discord"
              colors={["#0c0c0c", "#121212", "#101010"]}
              delay={0.4}
            />
          </div>
          <div className="min-h-[200px]">
            <BentoCard
              icon={<Video className="w-7 h-7" />}
              title="Step 3"
              value="Build Portfolio"
              subtitle="Create your editor profile"
              colors={["#0a0a0a", "#0f0f0f", "#0d0d0d"]}
              delay={0.6}
            />
          </div>
          <div className="md:col-span-2 min-h-[200px]">
            <BentoCard
              icon={<Download className="w-7 h-7" />}
              title="Step 4"
              value="Premium Resources"
              subtitle="Download professional presets, templates, and assets to enhance your editing workflow and deliver stunning results."
              colors={["#0c0c0c", "#111111", "#0e0e0e"]}
              delay={0.8}
            />
          </div>
          <div className="md:col-span-2 min-h-[200px]">
            <BentoCard
              icon={<Star className="w-7 h-7" />}
              title="Step 5"
              value="Get Recognized"
              subtitle="Receive reviews from clients, build your reputation, and get featured on our team page to attract more opportunities."
              colors={["#0a0a0a", "#101010", "#0c0c0c"]}
              delay={1}
            />
          </div>
          <div className="min-h-[200px]">
            <BentoCard
              icon={<Zap className="w-7 h-7" />}
              title="Step 6"
              value="Level Up"
              subtitle="Advance through ranks"
              colors={["#0c0c0c", "#0f0f0f", "#0d0d0d"]}
              delay={1.2}
            />
          </div>
        </div>
      </div>
    </section>
  )
}