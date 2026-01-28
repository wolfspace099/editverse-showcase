import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedFeaturesSection } from "@/components/animated-features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { AnimatedCTASection } from "@/components/animated-cta-section"
import { HeroSection } from "@/components/hero-section"

export default function Page() {
  return (
    <>
      <main className="pt-20">
        <Header />
        <HeroSection />
        <AnimatedFeaturesSection />
        <TestimonialsSection />
        <FAQSection />
        <AnimatedCTASection />
        <Footer />
      </main>   
    </>
  )
}
  