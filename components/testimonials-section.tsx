"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Alex Chen",
    role: "YouTube Editor",
    avatar: "AC",
    rating: 5,
    text: "Editverse completely transformed my editing career. The courses are top-notch and the community support is incredible. I went from a beginner to working with 1M+ subscriber channels.",
    platform: "YouTube"
  },
  {
    name: "Sarah Mitchell",
    role: "Content Creator",
    avatar: "SM",
    rating: 5,
    text: "The resources and presets alone are worth it. But what really sets Editverse apart is their genuine care for editors. They truly work WITH you, not against you.",
    platform: "TikTok"
  },
  {
    name: "Marcus Johnson",
    role: "Freelance Editor",
    avatar: "MJ",
    rating: 5,
    text: "I was skeptical at first, but the portfolio system helped me land 3 major clients in my first month. The Discord community is always there to help and give feedback.",
    platform: "Instagram"
  },
  {
    name: "Emily Rodriguez",
    role: "Gaming Editor",
    avatar: "ER",
    rating: 5,
    text: "The Minecraft tools are a game-changer for gaming content. The team understands what editors actually need, not what they think we need.",
    platform: "Twitch"
  },
  {
    name: "David Kim",
    role: "Motion Designer",
    avatar: "DK",
    rating: 5,
    text: "From tutorials to real client work, EditCraft provided a clear path. The progress tracking keeps me motivated and the presets save hours of work.",
    platform: "YouTube"
  },
  {
    name: "Jessica Taylor",
    role: "Social Media Editor",
    avatar: "JT",
    rating: 5,
    text: "Best decision I made for my editing career. The team is responsive, the courses are well-structured, and the community feels like family.",
    platform: "Instagram"
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full border border-white/10 text-white/60 text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Testimonials
          </motion.span>
          <motion.h2
            className="text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            What Our Editors Say
          </motion.h2>
          <motion.p
            className="text-xl text-white/50 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            Real feedback from real editors who have grown with Editverse
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="relative bg-[#0c0c0c] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-white/5" />

              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-medium text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-medium text-white">{testimonial.name}</h4>
                  <p className="text-sm text-white/40">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 text-white fill-white"
                  />
                ))}
              </div>

              <p className="text-white/60 mb-4 leading-relaxed text-sm">
                {testimonial.text}
              </p>

              <div className="pt-4 border-t border-white/5">
                <span className="text-xs text-white/30">
                  Creating for {testimonial.platform}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
