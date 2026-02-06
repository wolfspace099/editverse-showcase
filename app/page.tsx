import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FeatureSection } from "@/components/features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { AnimatedCTASection } from "@/components/animated-cta-section"
import { HeroSection } from "@/components/hero-section"
import { SignUpSection } from "@/components/sign-up"

export default function Page() {
  return (
    <>
      <main className="pt-20">
        <Header />
        <HeroSection />
        <FeatureSection />
        <SignUpSection />
        <TestimonialsSection />
        <FAQSection />
        <AnimatedCTASection />
        <Footer />
      </main>   
    </>
  )
}
  