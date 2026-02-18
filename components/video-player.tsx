"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import videojs from "video.js"
import type Player from "video.js/dist/types/player"
import "video.js/dist/video-js.css"

type VideoPlayerProps = {
    src: string
    poster?: string
    onReady?: (player: Player) => void
}

export default function VideoPlayer({ src, poster, onReady }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const playerRef = useRef<Player | null>(null)
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    const initPlayer = useCallback(() => {
        if (!videoRef.current || playerRef.current) return
        if (!document.body.contains(videoRef.current)) return

        const player = videojs(videoRef.current, {
            controls: true,
            autoplay: false,
            preload: "metadata",
            fluid: true,
            responsive: true,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            poster: poster || undefined,
            sources: [{ src }],
            bigPlayButton: true,
            html5: {
                vhs: {
                    overrideNative: true,
                },
                nativeAudioTracks: false,
                nativeVideoTracks: false,
            },
            controlBar: {
                pictureInPictureToggle: true,
                children: [
                    "playToggle",
                    "volumePanel",
                    "currentTimeDisplay",
                    "timeDivider",
                    "durationDisplay",
                    "progressControl",
                    "remainingTimeDisplay",
                    "playbackRateMenuButton",
                    "fullscreenToggle",
                ],
            },
        })

        player.ready(() => {
            setLoading(false)
            onReady?.(player)
        })

        player.on("error", () => {
            setError(true)
            setLoading(false)
        })

        player.on("loadeddata", () => {
            setLoading(false)
        })

        playerRef.current = player
    }, [poster, src, onReady])

    useEffect(() => {
        if (!mounted) return

        const timeoutId = setTimeout(() => {
            initPlayer()
        }, 0)

        return () => {
            clearTimeout(timeoutId)
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose()
                playerRef.current = null
            }
        }
    }, [mounted, initPlayer])

    useEffect(() => {
        const player = playerRef.current
        if (!player || player.isDisposed()) return

        setError(false)
        setLoading(true)
        player.src({ src })
        if (poster) player.poster(poster)
        player.load()
    }, [src, poster])

    if (error) {
        return (
            <div className="w-full h-full min-h-[180px] flex items-center justify-center bg-black rounded-lg">
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white/60 text-sm">Video unavailable</span>
                    <a 
                        href={src} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline text-xs"
                    >
                        Open in new tab
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full min-h-[180px] relative bg-black rounded-lg overflow-hidden">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10 pointer-events-none">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
                </div>
            )}
            <div data-vjs-player className="w-full h-full">
                <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered vjs-theme-fantasy w-full h-full"
                    playsInline
                />
            </div>
        </div>
    )
}
