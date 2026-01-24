"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How do I join Editverse as an editor?",
    answer:
      "Simply click 'Apply to Join' and fill out the application form. You'll need to log in with your Discord account, share some information about your editing experience, and submit a few examples of your work. Our team reviews applications regularly, and you'll receive a response through our Discord bot.",
  },
  {
    question: "Do I need professional experience to apply?",
    answer:
      "Not at all! We welcome editors of all skill levels. Whether you're just starting out or you're an experienced professional, Editverse has resources for everyone. Our courses are designed to take you from beginner to advanced, and our community is supportive of learners at every stage.",
  },
  {
    question: "What software do I need to use?",
    answer:
      "We primarily support Adobe Premiere Pro, After Effects, DaVinci Resolve, and Final Cut Pro. Our tutorials and presets are available for these platforms. However, many of our editing principles and community discussions apply to any editing software.",
  },
  {
    question: "How does the portfolio system work?",
    answer:
      "Once you're accepted, you can access your editor dashboard to create and customize your portfolio. Add your best work, social media links, and a bio using Discord markdown formatting. Your portfolio will be displayed on our 'Our Team' page, where clients can discover and review your work.",
  },
  {
    question: "Are the courses and resources really free?",
    answer:
      "Yes! Once you're accepted into Editverse, you get full access to all our video tutorials, courses organized into chapters, downloadable presets, and community resources. We believe in investing in our editors because when you succeed, we all succeed.",
  },
  {
    question: "How do the reviews and ratings work?",
    answer:
      "Clients who work with our editors can leave reviews with star ratings. These reviews are first submitted to our moderation team through Discord for approval. Once approved, they appear on your portfolio along with an overall rating, helping you build credibility and attract more clients.",
  },
  {
    question: "What are the public tools you offer?",
    answer:
      "We offer free tools for the editing community including a high-quality Minecraft items library, a skin viewer, and a render maker. These tools are available to everyone, not just Editverse members, as part of our commitment to supporting the creator community.",
  },
  {
    question: "How do I get promoted or advance in the team?",
    answer:
      "Advancement is based on your activity, course completion, client feedback, and community involvement. As you complete courses, receive positive reviews, and contribute to the community, you'll unlock new opportunities and recognition within Editverse.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full border border-white/10 text-white/60 text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            FAQ
          </motion.span>
          <motion.h2
            className="text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            className="text-xl text-white/50 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Everything you need to know about joining Editverse. Have more questions? Reach out on Discord!
          </motion.p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="border border-white/5 rounded-lg bg-[#0c0c0c]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/[0.02] transition-colors rounded-lg"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-base font-medium text-white pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-white/40 transition-transform flex-shrink-0 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4">
                  <p className="text-white/50 leading-relaxed text-sm">{faq.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          
          
        </motion.div>
      </div>
    </section>
  )
}
