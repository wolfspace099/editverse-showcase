"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

/* ── Cache config ── */
const WAVEFORM_CACHE_PREFIX = "ev-waveform-"
const AUDIO_CACHE_PREFIX = "ev-audio-"
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/* ── Waveform helpers ── */
const BARS = 80

function hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0
    }
    return Math.abs(hash).toString(36)
}

type CachedWaveform = {
    peaks: number[]
    duration: number
    timestamp: number
}

function getCachedWaveform(url: string): CachedWaveform | null {
    try {
        const raw = localStorage.getItem(WAVEFORM_CACHE_PREFIX + hashUrl(url))
        if (!raw) return null
        const parsed = JSON.parse(raw) as CachedWaveform
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem(WAVEFORM_CACHE_PREFIX + hashUrl(url))
            return null
        }
        return parsed
    } catch {
        return null
    }
}

function setCachedWaveform(url: string, peaks: number[], duration: number) {
    try {
        localStorage.setItem(
            WAVEFORM_CACHE_PREFIX + hashUrl(url),
            JSON.stringify({ peaks, duration, timestamp: Date.now() })
        )
    } catch {
        // Storage full — silently fail
    }
}

/* ── IndexedDB for audio blobs ── */
const DB_NAME = "ev-audio-cache"
const STORE_NAME = "blobs"
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME)
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function getCachedAudio(url: string): Promise<ArrayBuffer | null> {
    try {
        const db = await openDB()
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly")
            const store = tx.objectStore(STORE_NAME)
            const req = store.get(AUDIO_CACHE_PREFIX + hashUrl(url))
            req.onsuccess = () => {
                const entry = req.result as { buffer: ArrayBuffer; timestamp: number } | undefined
                if (!entry) return resolve(null)
                if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
                    // Expired — clean up
                    const delTx = db.transaction(STORE_NAME, "readwrite")
                    delTx.objectStore(STORE_NAME).delete(AUDIO_CACHE_PREFIX + hashUrl(url))
                    return resolve(null)
                }
                resolve(entry.buffer)
            }
            req.onerror = () => resolve(null)
        })
    } catch {
        return null
    }
}

async function setCachedAudio(url: string, buffer: ArrayBuffer) {
    try {
        const db = await openDB()
        const tx = db.transaction(STORE_NAME, "readwrite")
        tx.objectStore(STORE_NAME).put(
            { buffer, timestamp: Date.now() },
            AUDIO_CACHE_PREFIX + hashUrl(url)
        )
    } catch {
        // Silently fail
    }
}

/* ── Peak extraction ── */
function extractPeaks(audioBuffer: AudioBuffer, bars: number): number[] {
    const channel = audioBuffer.getChannelData(0)
    const blockSize = Math.floor(channel.length / bars)
    const peaks: number[] = []
    for (let i = 0; i < bars; i++) {
        let sum = 0
        const start = i * blockSize
        const end = Math.min(start + blockSize, channel.length)
        for (let j = start; j < end; j++) {
            sum += Math.abs(channel[j])
        }
        peaks.push(sum / (end - start))
    }
    // Normalize
    const max = Math.max(...peaks, 0.001)
    return peaks.map((p) => p / max)
}

/* ── Time formatting ── */
function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
}

/* ═══════════════════════════════════════════════════════
   AudioPlayer Component
   ═══════════════════════════════════════════════════════ */

type AudioPlayerProps = {
    src: string
    title?: string
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const animRef = useRef<number>(0)

    const [peaks, setPeaks] = useState<number[] | null>(null)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [volume, setVolume] = useState(1)
    const [muted, setMuted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [hoverBar, setHoverBar] = useState<number | null>(null)

    /* ── Load audio & generate waveform ── */
    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(false)

            // 1. Check waveform cache
            const cached = getCachedWaveform(src)
            if (cached) {
                setPeaks(cached.peaks)
                setDuration(cached.duration)
                setLoading(false)
                return
            }

            // 2. Fetch audio (from IndexedDB cache or network)
            try {
                let buffer = await getCachedAudio(src)
                if (!buffer) {
                    const res = await fetch(src)
                    if (!res.ok) throw new Error("Fetch failed")
                    buffer = await res.arrayBuffer()
                    // Cache the audio blob
                    setCachedAudio(src, buffer.slice(0))
                }

                if (cancelled) return

                // 3. Decode & extract peaks
                const ctx = new AudioContext()
                const audioBuffer = await ctx.decodeAudioData(buffer.slice(0))
                await ctx.close()

                if (cancelled) return

                const newPeaks = extractPeaks(audioBuffer, BARS)
                setPeaks(newPeaks)
                setDuration(audioBuffer.duration)
                setCachedWaveform(src, newPeaks, audioBuffer.duration)
            } catch {
                if (!cancelled) setError(true)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [src])

    /* ── Create audio element ── */
    useEffect(() => {
        const audio = new Audio()
        audio.crossOrigin = "anonymous"
        audio.preload = "metadata"
        audio.src = src
        audioRef.current = audio

        const onEnded = () => setPlaying(false)
        const onTimeUpdate = () => setCurrentTime(audio.currentTime)
        const onDurationChange = () => {
            if (isFinite(audio.duration)) setDuration(audio.duration)
        }

        audio.addEventListener("ended", onEnded)
        audio.addEventListener("timeupdate", onTimeUpdate)
        audio.addEventListener("durationchange", onDurationChange)

        return () => {
            audio.pause()
            audio.removeEventListener("ended", onEnded)
            audio.removeEventListener("timeupdate", onTimeUpdate)
            audio.removeEventListener("durationchange", onDurationChange)
            audio.src = ""
            audioRef.current = null
        }
    }, [src])

    /* ── Sync volume ── */
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume
        }
    }, [volume, muted])

    /* ── Draw waveform ── */
    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas || !peaks) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const w = rect.width
        const h = rect.height
        const barWidth = w / BARS
        const gap = Math.max(1, barWidth * 0.2)
        const barW = barWidth - gap
        const progressRatio = duration > 0 ? currentTime / duration : 0
        const progressBar = Math.floor(progressRatio * BARS)

        ctx.clearRect(0, 0, w, h)

        for (let i = 0; i < peaks.length; i++) {
            const barH = Math.max(2, peaks[i] * (h * 0.85))
            const x = i * barWidth + gap / 2
            const y = (h - barH) / 2

            if (i < progressBar) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
            } else if (i === progressBar) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.75)"
            } else if (hoverBar !== null && i === hoverBar) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
            } else {
                ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
            }

            ctx.beginPath()
            const radius = Math.min(barW / 2, 2)
            ctx.roundRect(x, y, barW, barH, radius)
            ctx.fill()
        }
    }, [peaks, currentTime, duration, hoverBar])

    useEffect(() => {
        drawWaveform()
    }, [drawWaveform])

    /* ── Animate during playback ── */
    useEffect(() => {
        if (!playing) return

        function tick() {
            drawWaveform()
            animRef.current = requestAnimationFrame(tick)
        }
        animRef.current = requestAnimationFrame(tick)

        return () => cancelAnimationFrame(animRef.current)
    }, [playing, drawWaveform])

    /* ── Handlers ── */
    function togglePlay() {
        const audio = audioRef.current
        if (!audio) return

        if (playing) {
            audio.pause()
            setPlaying(false)
        } else {
            audio.play().catch(() => { })
            setPlaying(true)
        }
    }

    function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current
        const audio = audioRef.current
        if (!canvas || !audio || !duration) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const ratio = Math.max(0, Math.min(1, x / rect.width))
        audio.currentTime = ratio * duration
        setCurrentTime(audio.currentTime)
    }

    function handleCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const bar = Math.floor((x / rect.width) * BARS)
        setHoverBar(Math.max(0, Math.min(BARS - 1, bar)))
    }

    function handleCanvasLeave() {
        setHoverBar(null)
    }

    /* ── Render ── */
    return (
        <div className="aspect-video rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm overflow-hidden relative">
            {/* Waveform area — fills everything above the controls */}
            <div className="absolute inset-0 bottom-[36px] flex items-center justify-center px-3">
                {loading ? (
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white/20 border-r-white" />
                        <span className="text-[10px] text-white/40">Generating waveform…</span>
                    </div>
                ) : error ? (
                    <span className="text-xs text-white/40">Unable to load audio</span>
                ) : (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full cursor-pointer"
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasMove}
                        onMouseLeave={handleCanvasLeave}
                    />
                )}
            </div>

            {/* Controls bar — fixed at bottom, 36px tall */}
            <div className="absolute bottom-0 left-0 right-0 h-[36px] flex items-center gap-2 px-2.5 border-t border-white/8 bg-black/60 backdrop-blur-sm">
                {/* Play / Pause */}
                <button
                    onClick={togglePlay}
                    disabled={loading || error}
                    className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label={playing ? "Pause" : "Play"}
                >
                    {playing ? (
                        <Pause className="h-3 w-3 text-white" />
                    ) : (
                        <Play className="h-3 w-3 text-white ml-px" />
                    )}
                </button>

                {/* Time */}
                <span className="text-[10px] text-white/50 tabular-nums flex-shrink-0">
                    {formatTime(currentTime)}<span className="text-white/30"> / </span>{formatTime(duration)}
                </span>

                {/* Spacer */}
                <div className="flex-1 min-w-0" />

                {/* Volume */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => setMuted((m) => !m)}
                        className="text-white/40 hover:text-white transition-colors"
                        aria-label={muted ? "Unmute" : "Mute"}
                    >
                        {muted || volume === 0 ? (
                            <VolumeX className="h-3 w-3" />
                        ) : (
                            <Volume2 className="h-3 w-3" />
                        )}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        onChange={(e) => {
                            setVolume(parseFloat(e.target.value))
                            setMuted(false)
                        }}
                        className="w-12 h-0.5 appearance-none bg-white/15 rounded-full cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        aria-label="Volume"
                    />
                </div>
            </div>
        </div>
    )
}
