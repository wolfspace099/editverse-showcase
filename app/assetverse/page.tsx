"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AudioPlayer from "@/components/audio-player"
import VideoPlayer from "@/components/video-player"
import {
  ChevronDown,
  Download,
  File,
  Film,
  Grid3x3,
  Image,
  List,
  Music,
  RefreshCw,
  Search,
  Type,
  X,
  FolderOpen,
  ZoomIn,
  Play,
  Pause
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

const API_BASE = "https://hamburger-api.powernplant101-c6b.workers.dev"
const CACHE_KEY = "assetverse-cache-v1"
const CACHE_TTL_MS = 60 * 60 * 1000
const DEFAULT_PREVIEW_TEXT = "The quick brown fox jumps over the lazy dog."

type FileItem = {
  id: number
  title: string
  credit: string
  filename: string
  ext: string
  url: string
  size: number
  subcategory?: string
  preview_url?: string
}

type CategoryPayload = {
  category: string
  files: FileItem[]
  total: number
  repository?: string
  source?: string
}

type CachePayload = {
  timestamp: number
  categories: string[]
  itemsByCategory: Record<string, FileItem[]>
  recentAssets?: CachedAsset[]
}

type CachedAsset = {
  id: number
  category: string
  title: string
  filename: string
  url: string
  cachedAt: number
}

const categoryLabels: Record<string, string> = {
  animations: "Animations",
  fonts: "Fonts",
  images: "Images",
  mcicons: "MC Icons",
  music: "Music",
  presets: "Presets",
  sfx: "SFX"
}

function isHiddenSubcategory(subcategory: string): boolean {
  const lower = subcategory.toLowerCase()
  if (HIDDEN_SUBCATEGORIES.has(lower)) return true
  const lastPart = lower.split("/").pop() || lower
  return HIDDEN_SUBCATEGORIES.has(lastPart)
}

const HIDDEN_CATEGORIES = new Set(["resources", "images"])
const HIDDEN_SUBCATEGORIES = new Set([
  "backgrounds",
  "icons"
])

function formatSubcategory(sub: string): string {
  const name = sub.split("/").pop() || sub
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const imageExts = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "apng"])
const videoExts = new Set(["mp4", "webm", "mov", "mkv", "avi", "ogv", "ogg", "m4v", "wmv", "flv"])
const audioExts = new Set(["mp3", "wav", "ogg", "flac", "m4a", "aac", "wma"])
const fontExts = new Set(["ttf", "otf", "woff", "woff2"])
const mediaTypeOverrides: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/mp4",
  aac: "audio/aac",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  ogv: "video/ogg",
  m4v: "video/mp4",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv"
}

function formatBytes(value: number) {
  if (!value) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const size = value / Math.pow(1024, index)
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function normalizeExt(item: FileItem) {
  return item.ext?.toLowerCase() || item.filename.split(".").pop()?.toLowerCase() || ""
}

function normalizeUrl(url: string) {
  if (!url) return url
  let normalized = url.trim()
  if (normalized.includes("github.com/") && normalized.includes("/blob/")) {
    normalized = normalized.replace("github.com/", "raw.githubusercontent.com/").replace("/blob/", "/")
  }
  try {
    const decoded = decodeURIComponent(normalized)
    const parts = decoded.split("/")
    const encodedParts = parts.map((part, index) => {
      if (index < 2) return part
      return encodeURIComponent(part)
    })
    return encodedParts.join("/")
  } catch {
    return url
  }
}

function resolveType(category: string, item: FileItem) {
  const ext = normalizeExt(item)
  if (category === "fonts" || fontExts.has(ext)) return "font"
  if (category === "presets") return "preset"
  if (category === "animations") return "animation"
  if (imageExts.has(ext)) return "image"
  if (videoExts.has(ext)) return "video"
  if (audioExts.has(ext)) return "audio"
  return "file"
}

function readCache(): CachePayload | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (!parsed.timestamp || !Array.isArray(parsed.categories)) return null
    return parsed
  } catch {
    return null
  }
}

function isCacheFresh(payload: CachePayload | null) {
  if (!payload) return false
  if (!payload.timestamp) return false
  if (!Array.isArray(payload.categories) || payload.categories.length === 0) return false
  return Date.now() - payload.timestamp < CACHE_TTL_MS
}

function writeCache(payload: CachePayload) {
  if (typeof window === "undefined") return
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
}

function useInView() {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: "240px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

return { setNode, inView }
}

function SubcategoryDropdown({
  subcategories,
  selectedSubcategory,
  onSelect,
  counts
}: {
  subcategories: string[]
  selectedSubcategory: string
  onSelect: (sub: string) => void
  counts: Record<string, number>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedLabel = selectedSubcategory
    ? formatSubcategory(selectedSubcategory)
    : "All"

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-all"
      >
        <FolderOpen className="h-3.5 w-3.5 text-white/50" />
        <span className="max-w-[100px] truncate">{selectedLabel}</span>
        <span className="text-xs text-white/40">({counts[selectedSubcategory] || 0})</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1">
            <button
              onClick={() => {
                onSelect("")
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                selectedSubcategory === ""
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>All Categories</span>
              <span className="text-xs text-white/40">{counts[""] || 0}</span>
            </button>

            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  onSelect(sub)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  selectedSubcategory === sub
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="truncate">{formatSubcategory(sub)}</span>
                <span className="text-xs text-white/40">{counts[sub] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CategorySearchBar({
  subcategories,
  selectedSubcategory,
  onSelectSubcategory,
  search,
  onSearchChange,
  counts
}: {
  subcategories: string[]
  selectedSubcategory: string
  onSelectSubcategory: (sub: string) => void
  search: string
  onSearchChange: (value: string) => void
  counts: Record<string, number>
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredSubcategories = useMemo(() => {
    if (!isDropdownOpen) return []
    if (!search) return subcategories
    return subcategories.filter((sub) =>
      formatSubcategory(sub).toLowerCase().includes(search.toLowerCase())
    )
  }, [isDropdownOpen, search, subcategories])

  const selectedLabel = selectedSubcategory
    ? formatSubcategory(selectedSubcategory)
    : "All Categories"

  const showDropdown = isDropdownOpen && (selectedSubcategory === "" || search.length > 0 || filteredSubcategories.length > 0)

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden focus-within:border-white/20 transition-colors">
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border-r border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <FolderOpen className="h-4 w-4 text-white/50" />
          <span className="text-sm text-white/80 max-w-[120px] truncate hidden sm:block">{selectedLabel}</span>
          <span className="text-xs text-white/40">({counts[selectedSubcategory] || 0})</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-white/50 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value)
              setIsDropdownOpen(true)
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={`Search ${selectedLabel.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2.5 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => {
                onSearchChange("")
                inputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <button
              onClick={() => {
                onSelectSubcategory("")
                setIsDropdownOpen(false)
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedSubcategory === ""
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-white/50" />
                <span>All Categories</span>
              </div>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">{counts[""] || 0} items</span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {filteredSubcategories.length === 0 ? (
              <div className="px-3 py-3 text-center text-sm text-white/40">
                No categories match your search
              </div>
            ) : (
              filteredSubcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    onSelectSubcategory(sub)
                    setIsDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSubcategory === sub
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="truncate">{formatSubcategory(sub)}</span>
                  <span className="text-xs text-white/40">{counts[sub] || 0}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {selectedSubcategory && !isDropdownOpen && (
        <button
          onClick={() => {
            onSelectSubcategory("")
            onSearchChange("")
          }}
          className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white/70 transition-colors hidden sm:block"
        >
          Clear filter
        </button>
      )}
    </div>
  )
}

function FontPreview({
  item,
  previewText,
  active
}: {
  item: FileItem
  previewText: string
  active: boolean
}) {
  const [fontFamily, setFontFamily] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!active || fontFamily || failed || loading) return

    const fontCacheKey = `font-cache-${item.id}`
    const cachedFont = localStorage.getItem(fontCacheKey)

    async function loadFont() {
      setLoading(true)
      const url = normalizeUrl(item.url)
      const fontName = `font-${item.id}`

      if (cachedFont) {
        try {
          const fontFace = new FontFace(fontName, cachedFont)
          const loaded = await fontFace.load()
          document.fonts.add(loaded)
          setFontFamily(fontName)
          return
        } catch {
          localStorage.removeItem(fontCacheKey)
        }
      }

      try {
        const fontFace = new FontFace(fontName, `url(${url})`)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)
        setFontFamily(fontName)
        return
      } catch {
        // Direct URL failed, try fetching
      }

      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error("Fetch failed")
        const buffer = await response.arrayBuffer()
        const blob = new Blob([buffer])
        const blobUrl = URL.createObjectURL(blob)

        const fontFace = new FontFace(fontName, blobUrl)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)
        setFontFamily(fontName)

        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          try {
            localStorage.setItem(fontCacheKey, base64)
          } catch {
            // Storage full
          }
        }
        reader.readAsDataURL(blob)

        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
      } catch {
        setFailed(true)
      }
    }

    loadFont().finally(() => setLoading(false))
  }, [active, failed, fontFamily, item.id, item.url, loading])

  if (!active) {
    return (
      <div className="aspect-video rounded-lg border border-white/10 bg-white/5 animate-pulse" />
    )
  }

  return (
    <div className="aspect-video rounded-lg border border-white/10 bg-white/5 flex items-center justify-center px-4 text-center overflow-hidden">
      {loading ? (
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-white/20 border-r-white" />
      ) : failed ? (
        <p className="text-sm text-white/50">Preview unavailable</p>
      ) : (
        <p className="text-lg text-white/80 break-all" style={{ fontFamily: fontFamily ?? "inherit" }}>
          {previewText}
        </p>
      )}
    </div>
  )
}

function FontPreviewModal({
  item,
  previewText
}: {
  item: FileItem
  previewText: string
}) {
  const [fontFamily, setFontFamily] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const fontCacheKey = `font-cache-${item.id}`
    const cachedFont = localStorage.getItem(fontCacheKey)
    const url = normalizeUrl(item.url)
    const fontName = `font-modal-${item.id}`

    async function loadFont() {
      if (cachedFont) {
        try {
          const fontFace = new FontFace(fontName, cachedFont)
          const loaded = await fontFace.load()
          document.fonts.add(loaded)
          setFontFamily(fontName)
          setLoading(false)
          return
        } catch {
          localStorage.removeItem(fontCacheKey)
        }
      }

      try {
        const fontFace = new FontFace(fontName, `url(${url})`)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)
        setFontFamily(fontName)
        setLoading(false)
        return
      } catch {}

      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error("Fetch failed")
        const buffer = await response.arrayBuffer()
        const blob = new Blob([buffer])
        const blobUrl = URL.createObjectURL(blob)

        const fontFace = new FontFace(fontName, blobUrl)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)
        setFontFamily(fontName)

        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          try {
            localStorage.setItem(fontCacheKey, base64)
          } catch {}
        }
        reader.readAsDataURL(blob)

        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
      } catch {
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }

    loadFont()
  }, [item.id, item.url])

  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[300px]">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-white/20 border-r-white" />
          <p className="text-sm text-white/50">Loading font...</p>
        </div>
      ) : failed ? (
        <p className="text-white/50">Preview unavailable</p>
      ) : (
        <p
          className="text-4xl md:text-6xl text-white/90 text-center break-all max-w-full"
          style={{ fontFamily: fontFamily ?? "inherit" }}
        >
          {previewText}
        </p>
      )}
    </div>
  )
}

function PreviewModal({
  asset,
  category,
  previewText,
  open,
  onOpenChange,
  onDownload
}: {
  asset: FileItem | null
  category: string
  previewText: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (item: FileItem) => void
}) {
  if (!asset) return null

  const type = resolveType(category, asset)
  const ext = normalizeExt(asset)
  const url = normalizeUrl(asset.url)
  const mediaType = mediaTypeOverrides[ext] || `${type}/${ext || "mp4"}`

  const renderPreview = () => {
    if (type === "image") {
      return (
        <div className="flex-1 flex items-center justify-center bg-black/50 min-h-[300px] max-h-[70vh] overflow-auto">
          <img
            src={url}
            alt={asset.title}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      )
    }

    if (type === "video" || type === "animation" || (category === "presets" && videoExts.has(ext))) {
      return (
        <div className="flex-1 flex items-center justify-center bg-black min-h-[300px]">
          <VideoPlayer key={`modal-${asset.id}`} src={url} />
        </div>
      )
    }

    if (type === "audio") {
      return (
        <div className="p-6">
          <AudioPlayer src={url} title={asset.title} />
        </div>
      )
    }

    if (type === "font") {
      return <FontPreviewModal item={asset} previewText={previewText} />
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-white/50">
        <File className="h-16 w-16 text-white/30" />
        <p className="text-lg">Preview not available</p>
        <p className="text-sm">Download to view this file</p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] bg-black/95 border-white/10 text-white overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg truncate">{asset.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/50">
                <span>{asset.filename}</span>
                <span className="text-white/30">•</span>
                <span>{formatBytes(asset.size)}</span>
                {asset.credit && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>Credit: {asset.credit}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              size="sm"
              className="bg-white text-black flex-shrink-0"
              onClick={() => {
                downloadFile(asset.url, asset.filename)
                onDownload(asset)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function downloadFile(url: string, filename: string) {
  const normalizedUrl = normalizeUrl(url)
  fetch(normalizedUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to download")
      return res.blob()
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      window.open(normalizedUrl, "_blank")
    })
}

function Preview({
  category,
  item,
  previewText,
  active
}: {
  category: string
  item: FileItem
  previewText: string
  active: boolean
}) {
  const type = resolveType(category, item)
  const ext = normalizeExt(item)
  const previewUrl = item.preview_url ? normalizeUrl(item.preview_url) : normalizeUrl(item.url)
  const mediaType = mediaTypeOverrides[ext] || `${type}/${ext || "mp4"}`

  if (!active) {
    return (
      <div className="aspect-video rounded-lg border border-white/10 bg-white/5 animate-pulse" />
    )
  }

  if (type === "image") {
    return (
      <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
        <img
          src={previewUrl}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  if (type === "video" || type === "animation" || (category === "presets" && videoExts.has(ext))) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black flex items-center justify-center">
        <VideoPlayer key={item.id} src={previewUrl} />
      </div>
    )
  }

  if (type === "audio") {
    return <AudioPlayer src={previewUrl} title={item.title} />
  }

  if (type === "font") {
    return <FontPreview item={item} previewText={previewText} active={active} />
  }

  if (type === "preset") {
    return (
      <div className="aspect-video rounded-lg border border-white/10 bg-white/5 flex flex-col items-center justify-center text-white/50 text-sm gap-2">
        <File className="h-8 w-8 text-white/30" />
        <span>Preset file ready for download</span>
      </div>
    )
  }

  return (
    <div className="aspect-video rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/50 text-sm">
      Preview ready for download
    </div>
  )
}

export default function AssetversePage() {
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, FileItem[]>>({})
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingCategory, setLoadingCategory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW_TEXT)
  const [visibleCount, setVisibleCount] = useState(24)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [recentAssets, setRecentAssets] = useState<CachedAsset[]>([])
  const [previewAsset, setPreviewAsset] = useState<FileItem | null>(null)

useEffect(() => {
    const cached = readCache()
    if (cached && isCacheFresh(cached)) {
      const freshCache = cached
      const visibleCats = freshCache.categories.filter((c) => !HIDDEN_CATEGORIES.has(c)).sort()
      setCategories(visibleCats)
      setItemsByCategory(freshCache.itemsByCategory || {})
      setLastUpdated(freshCache.timestamp)
      setRecentAssets(freshCache.recentAssets || [])
      if (visibleCats.length > 0) {
        setSelectedCategory(visibleCats[0])
      }
    }
    loadCategories(isCacheFresh(cached), cached)
  }, [])

  useEffect(() => {
    if (!selectedCategory) return
    setVisibleCount(24)
    setSelectedSubcategory("")
    loadCategory(selectedCategory)
  }, [selectedCategory])

  async function loadCategories(hasFreshCache: boolean, cached: CachePayload | null) {
    if (hasFreshCache && cached?.categories?.length) {
      setLoadingCategories(false)
      return
    }
    setLoadingCategories(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/categories`)
      if (!res.ok) throw new Error("Failed to load categories")
      const data = (await res.json()) as { categories: string[] }
const visible = data.categories.filter((c) => !HIDDEN_CATEGORIES.has(c)).sort()
      setCategories(visible)
      if (visible.length > 0) {
        setSelectedCategory((prev) => prev || visible[0])
      }
      const updated: CachePayload = {
        timestamp: Date.now(),
        categories: data.categories,
        itemsByCategory
      }
      writeCache(updated)
      setLastUpdated(updated.timestamp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load categories")
    } finally {
      setLoadingCategories(false)
    }
  }

  async function loadCategory(category: string, force?: boolean) {
    const cached = readCache()
    const hasCachedItems = cached?.itemsByCategory?.[category]?.length
    const hasFreshCache = isCacheFresh(cached)

    if (!force && hasCachedItems && hasFreshCache) {
      setItemsByCategory(cached.itemsByCategory)
      setLastUpdated(cached.timestamp)
      setRecentAssets(cached.recentAssets || [])
      return
    }

    setLoadingCategory(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/category/${category}`)
      if (!res.ok) throw new Error("Failed to load category")
      const data = (await res.json()) as CategoryPayload
      setItemsByCategory((prev) => {
        const next = { ...prev, [category]: data.files }
        const updated: CachePayload = {
          timestamp: Date.now(),
          categories: categories.length ? categories : cached?.categories || [],
          itemsByCategory: next,
          recentAssets: cached?.recentAssets || recentAssets
        }
        writeCache(updated)
        setLastUpdated(updated.timestamp)
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resources")
    } finally {
      setLoadingCategory(false)
    }
  }

const items = itemsByCategory[selectedCategory] || []

  const subcategories = useMemo(() => {
    const subs = new Set<string>()
    items.forEach((item) => {
      if (item.subcategory && !isHiddenSubcategory(item.subcategory)) {
        subs.add(item.subcategory)
      }
    })
    return Array.from(subs).sort()
  }, [items])

  const subcategoryCounts = useMemo(() => {
    const visibleItems = items.filter((item) => !item.subcategory || !isHiddenSubcategory(item.subcategory))
    const counts: Record<string, number> = { "": visibleItems.length }
    visibleItems.forEach((item) => {
      if (item.subcategory) {
        counts[item.subcategory] = (counts[item.subcategory] || 0) + 1
      }
    })
    return counts
  }, [items])

const filtered = useMemo(() => {
    let result = items.filter((item) => !item.subcategory || !isHiddenSubcategory(item.subcategory))
    // Subcategory filter
    if (selectedSubcategory) {
      result = result.filter((item) => item.subcategory === selectedSubcategory)
    }
    // Search filter
    const term = search.trim().toLowerCase()
    if (term) {
      result = result.filter((item) => {
        return (
          item.title?.toLowerCase().includes(term) ||
          item.filename?.toLowerCase().includes(term) ||
          item.ext?.toLowerCase().includes(term)
        )
      })
    }
    return result
  }, [items, search, selectedSubcategory])

  const visibleItems = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

const stats = useMemo(() => {
    const visibleTotal = items.filter((item) => !item.subcategory || !isHiddenSubcategory(item.subcategory)).length
    return {
      total: visibleTotal,
      previewed: visibleItems.length
    }
  }, [items, visibleItems.length])

  function cacheAsset(item: FileItem) {
    const payload = readCache()
    const existing = payload?.recentAssets || recentAssets
    const next = [
      {
        id: item.id,
        category: selectedCategory,
        title: item.title,
        filename: item.filename,
        url: normalizeUrl(item.url),
        cachedAt: Date.now()
      },
      ...existing.filter((entry) => entry.id !== item.id)
    ].slice(0, 30)
    setRecentAssets(next)
    writeCache({
      timestamp: Date.now(),
      categories: categories.length ? categories : payload?.categories || [],
      itemsByCategory: itemsByCategory,
      recentAssets: next
    })
  }

  return (
    <main className={`min-h-screen bg-black text-white ${GeistSans.className}`}>
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-[0.3em]">Acid Verse</p>
                <h1 className="text-3xl md:text-4xl font-semibold mt-2">Asset Library</h1>
                <p className="text-sm text-white/60 mt-2 max-w-2xl">
                  Browse curated resources by category. Previews load only when needed, and the full list stays cached for fast revisits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => loadCategory(selectedCategory, true)}
                  disabled={!selectedCategory || loadingCategory}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Category
                </Button>
                <div className="flex items-center border border-white/10 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-white/10" : "hover:bg-white/5"} transition-colors`}
                  >
                    <Grid3x3 className="h-4 w-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-white/10" : "hover:bg-white/5"} transition-colors border-l border-white/10`}
                  >
                    <List className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                <p className="text-xs text-white/40">Loaded assets</p>
                <p className="text-2xl font-semibold mt-2">{stats.total}</p>
              </div>
              <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                <p className="text-xs text-white/40">Showing</p>
                <p className="text-2xl font-semibold mt-2">{stats.previewed}</p>
              </div>
              <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                <p className="text-xs text-white/40">Cache updated</p>
                <p className="text-sm text-white/70 mt-3">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Not yet"}
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {loadingCategories ? (
                  <div className="text-sm text-white/50">Loading categories...</div>
                ) : (
                  categories.map((category) => (
                    <Button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      className={selectedCategory === category ? "bg-white text-black" : ""}
                    >
                      {categoryLabels[category] || category}
                    </Button>
                  ))
                )}
</div>

              {/* Unified search/filter bar for categories with subcategories */}
              {subcategories.length > 0 ? (
                <CategorySearchBar
                  subcategories={subcategories}
                  selectedSubcategory={selectedSubcategory}
                  onSelectSubcategory={(sub) => {
                    setSelectedSubcategory(sub)
                    setVisibleCount(24)
                  }}
                  search={search}
                  onSearchChange={setSearch}
                  counts={subcategoryCounts}
                />
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search files, extensions..."
                      className="pl-9 bg-black/40 border-white/10 text-white"
                    />
                  </div>
                  {selectedCategory === "fonts" && (
                    <Input
                      value={previewText}
                      onChange={(event) => setPreviewText(event.target.value)}
                      placeholder="Font preview text"
                      className="bg-black/40 border-white/10 text-white"
                    />
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="border border-red-500/40 bg-red-500/10 text-red-100 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {loadingCategory ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "grid grid-cols-1 gap-4"
                }
              >
{visibleItems.map((item) => (
                  <AssetCard
                    key={`${selectedCategory}-${item.id}`}
                    category={selectedCategory}
                    item={item}
                    previewText={previewText}
                    viewMode={viewMode}
                    onDownload={cacheAsset}
                    onPreview={setPreviewAsset}
                  />
                ))}
              </div>
            )}

            {!loadingCategory && hasMore && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + 24)}>
                  Load more
                </Button>
              </div>
            )}
</div>
        </div>
      </div>
      <PreviewModal
        asset={previewAsset}
        category={selectedCategory}
        previewText={previewText}
        open={!!previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
        onDownload={cacheAsset}
      />
      <Footer />
    </main>
  )
}

function AssetCard({
  category,
  item,
  previewText,
  viewMode,
  onDownload,
  onPreview
}: {
  category: string
  item: FileItem
  previewText: string
  viewMode: "grid" | "list"
  onDownload: (item: FileItem) => void
  onPreview: (item: FileItem) => void
}) {
  const { setNode, inView } = useInView()
  const type = resolveType(category, item)
  const url = normalizeUrl(item.url)

  const typeLabel = useMemo(() => {
    if (type === "audio") return "Audio"
    if (type === "video") return "Video"
    if (type === "font") return "Font"
    if (type === "image") return "Image"
    if (type === "preset") return "Preset"
    if (type === "animation") return "Animation"
    return "File"
  }, [type])

  const TypeIcon = useMemo(() => {
    if (type === "audio") return Music
    if (type === "video") return Film
    if (type === "font") return Type
    if (type === "image") return Image
    return File
  }, [type])

return (
    <div
      ref={(node) => setNode(node)}
      className={`border border-white/10 rounded-xl bg-black/60 hover:border-white/20 transition-colors overflow-hidden ${viewMode === "list" ? "flex flex-col md:flex-row" : ""}`}
    >
      <div
        className={`relative cursor-pointer group ${viewMode === "list" ? "md:w-72 p-4" : "p-4"}`}
        onClick={() => onPreview(item)}
        onContextMenu={(e) => {
          e.preventDefault()
          onPreview(item)
        }}
      >
        <Preview category={category} item={item} previewText={previewText} active={inView} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-black/70 rounded-full p-2">
            <ZoomIn className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
      <div className={`p-4 flex flex-col gap-3 ${viewMode === "list" ? "flex-1" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-white/50">{typeLabel}</p>
            <h3 className="text-base font-semibold mt-1">{item.title}</h3>
          </div>
          <TypeIcon className="h-4 w-4 text-white/40" />
        </div>
        <div className="text-xs text-white/50 space-y-1">
          <p>{item.filename}</p>
          <p>{formatBytes(item.size)}</p>
          {item.credit && <p>Credit: {item.credit}</p>}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button size="sm" className="bg-white text-black" onClick={() => {
            downloadFile(item.url, item.filename)
            onDownload(item)
          }}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
