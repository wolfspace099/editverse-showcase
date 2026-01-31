"use client"

import { useEffect, useMemo, useState } from "react"

interface PathProps {
  position: number
}

interface PathData {
  id: number
  d: string
  width: number
  dashLength: number
  dashGap: number
  duration: number
  delay: number
}

function generatePaths(position: number): PathData[] {
  return Array.from({ length: 24 }, (_, i) => {
    const randomDashLength = 60 + Math.random() * 80
    const randomGap = 150 + Math.random() * 100
    const randomDuration = 8 + Math.random() * 12
    const randomDelay = Math.random() * 10

    return {
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
        380 - i * 5 * position
      } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
        152 - i * 5 * position
      } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.8 + i * 0.02,
      dashLength: randomDashLength,
      dashGap: randomGap,
      duration: randomDuration,
      delay: randomDelay,
    }
  })
}

function FloatingPaths({ position }: PathProps) {
  const [paths, setPaths] = useState<PathData[]>([])

  useEffect(() => {
    setPaths(generatePaths(position))
  }, [position])

  if (!paths.length) return null // SSR-safe

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        {paths.map((path) => (
          <g key={path.id}>
            <path d={path.d} stroke="none" fill="none" />
            <path
              d={path.d}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={path.width}
              fill="none"
              style={{
                strokeDasharray: `${path.dashLength} ${path.dashGap}`,
                opacity: 0.6 + path.id * 0.02,
                animation: `travelPath-${path.id} ${path.duration}s linear infinite`,
                animationDelay: `${path.delay}s`,
              }}
            />
          </g>
        ))}
      </svg>

      <style jsx>{`
        ${paths
          .map(
            (path) => `
          @keyframes travelPath-${path.id} {
            0% {
              stroke-dashoffset: ${path.dashLength + path.dashGap};
            }
            100% {
              stroke-dashoffset: -${path.dashLength + path.dashGap};
            }
          }
        `,
          )
          .join("")}
      `}</style>
    </div>
  )
}

function FlippedFloatingPaths({ position }: PathProps) {
  const [paths, setPaths] = useState<PathData[]>([])

  useEffect(() => {
    setPaths(
      generatePaths(position).map((path) => ({
        ...path,
        d: path.d.replace(/M-/, `M${696 + 380 - path.id * 5 * position}`),
      })),
    )
  }, [position])

  if (!paths.length) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        {paths.map((path) => (
          <g key={`flipped-${path.id}`}>
            <path d={path.d} stroke="none" fill="none" />
            <path
              d={path.d}
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={path.width}
              fill="none"
              style={{
                strokeDasharray: `${path.dashLength} ${path.dashGap}`,
                opacity: 0.6 + path.id * 0.02,
                animation: `travelPathFlipped-${path.id} ${path.duration}s linear infinite`,
                animationDelay: `${path.delay}s`,
              }}
            />
          </g>
        ))}
      </svg>

      <style jsx>{`
        ${paths
          .map(
            (path) => `
          @keyframes travelPathFlipped-${path.id} {
            0% {
              stroke-dashoffset: ${path.dashLength + path.dashGap};
            }
            100% {
              stroke-dashoffset: -${path.dashLength + path.dashGap};
            }
          }
        `,
          )
          .join("")}
      `}</style>
    </div>
  )
}

export function BackgroundPaths() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
      <FlippedFloatingPaths position={1} />
      <FlippedFloatingPaths position={-1} />
    </div>
  )
}
