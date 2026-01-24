"use client"

import { useEffect, useRef } from "react"

interface Vector2D {
  x: number
  y: number
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 }
  target: Vector2D = { x: 0, y: 0 }
  particleSize = 5
  startColor = { r: 0, g: 0, b: 0 }
  targetColor = { r: 255, g: 255, b: 255 }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgb(${this.targetColor.r}, ${this.targetColor.g}, ${this.targetColor.b})`
    ctx.beginPath()
    ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

interface ParticleTextEffectProps {
  words?: string[]
}

const DEFAULT_WORDS = ["LeLo", "SAAS", "PLATFORM", "LELO"]

export function ParticleTextEffect({ words = DEFAULT_WORDS }: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])

  const pixelSteps = 12 // fewer particles
  const fontSize = 50 // smaller text

  const generateParticles = (word: string, canvas: HTMLCanvasElement) => {
    const offscreenCanvas = document.createElement("canvas")
    offscreenCanvas.width = canvas.width
    offscreenCanvas.height = canvas.height
    const ctx = offscreenCanvas.getContext("2d")!

    ctx.fillStyle = "white"
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(word, canvas.width / 2, canvas.height / 2)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    const particles: Particle[] = []

    for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
      const alpha = pixels[i + 3]
      if (alpha > 0) {
        const x = (i / 4) % canvas.width
        const y = Math.floor(i / 4 / canvas.width)
        const particle = new Particle()
        particle.pos = { x, y }
        particles.push(particle)
      }
    }

    particlesRef.current = particles

    // Draw all particles once
    const canvasCtx = canvas.getContext("2d")!
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
    canvasCtx.fillStyle = "black"
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

    particles.forEach(p => p.draw(canvasCtx))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resizeCanvas()
    generateParticles(words[0], canvas)

    window.addEventListener("resize", () => {
      resizeCanvas()
      generateParticles(words[0], canvas)
    })
  }, [])

  return (
    <div className="w-full h-full absolute inset-0">
      <canvas ref={canvasRef} className="w-full h-full" style={{ background: "black", zIndex: 10 }} />
    </div>
  )
}
