import { Button } from "./ui/button"
import { ArrowRight, Play } from "lucide-react"
import { ParticleTextEffect } from "./particle-text-effect"
import { InfiniteSlider } from "./ui/infinite-slider"
import { ProgressiveBlur } from "./ui/progressive-blur"

export function HeroSection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden min-h-screen flex flex-col justify-between">
      <div className="flex-1 flex items-start justify-center pt-20">
        <ParticleTextEffect words={["WORKING WITH EDITORS, NOT AGAINST THEM"]} />
      </div>

      <div className="container mx-auto text-center relative z-10 pb-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
            Join our community of talented video editors. Learn from the best, access premium resources, and grow your career with us.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 group px-8">
              Apply to Join
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 bg-transparent group">
              <Play className="mr-2 h-4 w-4" />
              View Our Work
            </Button>
          </div>

          <div className="mt-16 mb-8">
            <p className="text-sm text-white/40 mb-8">Trusted by creators</p>
            <div className="relative max-w-4xl mx-auto">
              <InfiniteSlider durationOnHover={60} duration={30} gap={64}>
                <img
                  className="h-6 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/nvidia.svg"
                  alt="Partner logo"
                />
                <img
                  className="h-5 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/github.svg"
                  alt="Partner logo"
                />
                <img
                  className="h-6 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/openai.svg"
                  alt="Partner logo"
                />
                <img
                  className="h-5 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/laravel.svg"
                  alt="Partner logo"
                />
                <img
                  className="h-6 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/lemonsqueezy.svg"
                  alt="Partner logo"
                />
                <img
                  className="h-7 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/lilly.svg"
                  alt="Partner logo"
                />
                <img
                  className="h-5 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/column.svg"
                  alt="Partner logo"
                />
                <img
                  className="h-6 w-auto invert opacity-40 hover:opacity-70 transition-opacity"
                  src="/images/design-mode/nike.svg"
                  alt="Partner logo"
                />
              </InfiniteSlider>

              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-24"
                direction="left"
                blurIntensity={1}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-24"
                direction="right"
                blurIntensity={1}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}