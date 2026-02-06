"use client"

import React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const testimonials = [
  {
    quote: "Editverse helped us save 10+ hours per week by automating our repetitive tasks. We can't imagine going back!",
    author: "Kurt Bates",
    role: "Marketing Manager at BrightIdeas Inc.",
    image: "https://github.com/shadcn.png",
  },
  {
    quote: "This tool is a game-changer for our remote team. The workflow automations are insanely good.",
    author: "Alex Buckmaster",
    role: "Founder of Editverse",
    image: "https://github.com/shadcn.png",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-background" aria-labelledby="testimonial-title">
      <div className="container mx-auto px-6">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4 md:gap-5 max-w-xl text-center md:text-left">
            <p className="text-sm md:text-base font-semibold text-muted-foreground leading-[20px] md:leading-6">
              Testimonials
            </p>
            <h2 id="testimonial-title" className="text-3xl md:text-4xl font-bold">
              Trusted by the best editors
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {testimonials.map((testimonial, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <>
                    <div className="hidden md:block w-[1px] self-stretch bg-border" />
                    <Separator className="md:hidden bg-border" orientation="horizontal" />
                  </>
                )}
                <div className="flex flex-col gap-8">
                  <p className="text-foreground text-lg font-medium leading-7 md:text-left text-center">
                    {testimonial.quote}
                  </p>
                  <div className="flex md:flex-row flex-col items-center gap-5">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={testimonial.image || "/placeholder.svg"} alt={testimonial.author} />
                      <AvatarFallback>
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 md:text-left text-center">
                      <p className="text-foreground text-base font-semibold leading-6">{testimonial.author}</p>
                      <p className="text-muted-foreground text-base leading-6">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}