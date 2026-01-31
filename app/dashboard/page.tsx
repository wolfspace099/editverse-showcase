"use client"

import { useState } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  MoreVertical,
  Activity,
  ChevronDown,
  Grid3x3,
  List
} from "lucide-react"

export default function OverviewPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
      <Header />

      <main className="pt-48 pb-20">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="mb-10">
            <div className="flex items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search Courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 h-11 bg-transparent border border-white/10 rounded-md text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 transition-colors hover:border-white/20"
                />
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/5 rounded-md border border-white/10 transition-colors">
                  <MoreVertical className="h-4 w-4 text-white/60" />
                </button>

                <div className="flex items-center border border-white/10 rounded-md">
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

                <Button 
                  size="sm"
                  className="h-11 bg-white text-black hover:bg-white/90 text-sm font-medium rounded-md px-5"
                >
                  Add New...
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left column */}
            <div className="col-span-12 lg:col-span-3 space-y-10">

              {/* Usage */}
              <div>
                <h3 className="mb-3 text-sm font-semibold tracking-tight">
                  Usage
                </h3>

                <div className="border border-white/10 rounded-lg bg-black">
                  <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/50">Last 30 days</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-3 text-xs border border-white/10 hover:bg-white/5 rounded-md"
                    >
                      Upgrade
                    </Button>
                  </div>
                  
                  <div className="p-5 space-y-5">
                    <UsageItem
                      label="Editing course progress"
                      current="2.3K"
                      total="10K"
                      percent={23}
                    />
                    <UsageItem
                      label="Edited lessons"
                      current="1.3K"
                      total="5K"
                      percent={26}
                    />
                    <UsageItem
                      label="Rendered previews"
                      current="418"
                      total="1K"
                      percent={41}
                    />
                    <UsageItem
                      label="Exported projects"
                      current="53"
                      total="100"
                      percent={53}
                      expandable
                    />
                  </div>
                </div>
              </div>

              {/* Assets */}
              <div>
                <h3 className="mb-3 text-sm font-semibold tracking-tight">
                  Assets
                </h3>

                <div className="border border-white/10 rounded-lg bg-black p-6">
                  <h3 className="mb-3 text-sm font-semibold tracking-tight">
                  Get premium assets, all for free
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">
                    Access your shared editing assets, templates, presets and media packs inside Assetverse.
                  </p>

                  <Button
                    asChild
                    className="bg-white text-black hover:bg-white/90 h-10 text-sm rounded-md px-5"
                  >
                    <a href="/assetverse">
                      Open Assetverse
                    </a>
                  </Button>
                </div>
              </div>

            </div>

            {/* Main column */}
            <div className="col-span-12 lg:col-span-9">
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold tracking-tight">
                  Courses
                </h3>
              </div>

              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "grid grid-cols-1 gap-5"
                }
              >
                <CourseCard
                  title="Video Editing Foundations"
                  description="Cut, trim and structure footage with a clean professional workflow."
                  image="/images/course-preview-1.jpg"
                  progress={68}
                />

                <CourseCard
                  title="Advanced Timeline & Layer Editing"
                  description="Master complex timelines, blending modes and layered edits."
                  image="/images/course-preview-2.jpg"
                  progress={32}
                />

                <CourseCard
                  title="Motion Graphics For Editors"
                  description="Create titles, lower thirds and animated overlays directly in your edits."
                  image="/images/course-preview-3.jpg"
                  progress={84}
                />

                <CourseCard
                  title="Color Correction & Grading"
                  description="Professional color workflows for cinematic editing projects."
                  image="/images/course-preview-4.jpg"
                  progress={14}
                />

                <CourseCard
                  title="Audio Cleanup For Video Editors"
                  description="Fix noise, balance dialogue and enhance sound directly in your edits."
                  image="/images/course-preview-5.jpg"
                  progress={21}
                />

                <CourseCard
                  title="Fast Editing With Keyboard Shortcuts"
                  description="Speed up your entire editing workflow using pro shortcut setups."
                  image="/images/course-preview-6.jpg"
                  progress={57}
                />

                <CourseCard
                  title="Multi-Cam Editing Techniques"
                  description="Edit interviews and live events using professional multi-camera workflows."
                  image="/images/course-preview-7.jpg"
                  progress={9}
                />
              </div>

              <div className="mt-10 flex justify-center">
                <Button
                  variant="ghost"
                  className="border border-white/10 hover:bg-white/5 text-white/70 text-sm h-11 rounded-md px-6"
                >
                  Browse more
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function UsageItem({ 
  label, 
  current, 
  total, 
  percent,
  expandable 
}: { 
  label: string
  current: string
  total: string
  percent: number
  expandable?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">
          {label}
        </span>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/90">{current}</span>
          <span className="text-white/30">/</span>
          <span className="text-white/40">{total}</span>
          {expandable && (
            <ChevronDown className="h-3.5 w-3.5 text-white/40 ml-1" />
          )}
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-white/70 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function CourseCard({
  title,
  description,
  image,
  progress
}: {
  title: string
  description: string
  image: string
  progress: number
}) {
  return (
    <div className="group border border-white/10 rounded-xl bg-black hover:border-white/20 transition-colors overflow-hidden">
      <div className="aspect-[16/9] w-full bg-white/5">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5">
        <p className="text-xs text-white/50 mb-1">
          Editing course
        </p>

        <h3 className="text-base font-medium mb-1">
          {title}
        </h3>

        <p className="text-sm text-white/40 leading-relaxed mb-5">
          {description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
