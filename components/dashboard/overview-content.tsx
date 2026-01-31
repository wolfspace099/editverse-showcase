"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  MoreVertical,
  ChevronDown,
  Grid3x3,
  List,
  Play
} from "lucide-react"
import Link from "next/link"
import { getAllCourses, getUserProgress, getUserStats } from "@/lib/supabaseApi"

type Course = {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  difficulty: string
  duration_minutes: number
  lessons_count: number
}

type UserProgress = {
  course_id: string
  progress_percentage: number
  courses: Course
}

type UserStats = {
  total_points: number
  courses_completed: number
  courses_in_progress: number
  current_level: number
  max_level: number
}

export default function OverviewContent({ userId }: { userId: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [courses, setCourses] = useState<Course[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  async function loadData() {
    setLoading(true)

    // Load featured courses
    const { data: coursesData } = await getAllCourses({})
    setCourses(coursesData?.slice(0, 7) || [])

    // Load user progress
    const { data: progressData } = await getUserProgress(userId)
    setUserProgress(progressData || [])

    // Load user stats
    const { data: statsData } = await getUserStats(userId)
    setUserStats(statsData)

    setLoading(false)
  }

  const inProgressCourses = userProgress.filter(p => 
    p.progress_percentage > 0 && p.progress_percentage < 100
  )

  const completedCourses = userProgress.filter(p => p.progress_percentage === 100)

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Search Bar */}
        <div className="mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              <button className="p-2 hover:bg-white/5 rounded-md border border-white/10 transition-colors hidden sm:block">
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
                className="h-11 bg-white text-black hover:bg-white/90 text-sm font-medium rounded-md px-5 hidden sm:block"
              >
                Add New...
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-6 lg:space-y-10">

            {/* User Level Circle */}
            <div>
              <h3 className="mb-3 text-sm font-semibold tracking-tight">
                Your Level
              </h3>

              <div className="border border-white/10 rounded-lg bg-black p-6">
                <div className="flex flex-col items-center">
                  {/* Level Circle */}
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="white"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - (userStats?.current_level || 1) / (userStats?.max_level || 5))}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold">
                          {userStats?.current_level || 1}
                        </div>
                        <div className="text-xs text-white/50">
                          / {userStats?.max_level || 5}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-white/70 text-center mb-2">
                    Level {userStats?.current_level || 1} Editor
                  </p>
                  <p className="text-xs text-white/50 text-center">
                    Complete more courses to level up
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div>
              <h3 className="mb-3 text-sm font-semibold tracking-tight">
                Progress
              </h3>

              <div className="border border-white/10 rounded-lg bg-black">
                <div className="p-4 lg:p-5 border-b border-white/10 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start justify-between gap-3">
                  <span className="text-xs text-white/50">Overall progress to obtain a higher skill level</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-3 text-xs border border-white/10 hover:bg-white/5 rounded-md w-full sm:w-auto"
                  >
                    Upgrade
                  </Button>
                </div>
                
                <div className="p-4 lg:p-5 space-y-5">
                  <UsageItem
                    label="Course points"
                    current={userStats?.total_points.toString() || "0"}
                    total="10"
                    percent={userStats ? Math.min((userStats.total_points / 10) * 100, 100) : 0}
                  />
                  <UsageItem
                    label="Courses completed"
                    current={completedCourses.length.toString()}
                    total="50"
                    percent={Math.min((completedCourses.length / 50) * 100, 100)}
                  />
                  <UsageItem
                    label="Courses in progress"
                    current={inProgressCourses.length.toString()}
                    total="100"
                    percent={Math.min((inProgressCourses.length / 100) * 100, 100)}
                  />
                  <UsageItem
                    label="Learning streak"
                    current="3"
                    total="25"
                    percent={12}
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

              <div className="border border-white/10 rounded-lg bg-black p-5 lg:p-6">
                <h3 className="mb-3 text-sm font-semibold tracking-tight">
                  Get premium assets, all for free
                </h3>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  Access your shared editing assets, templates, presets and media packs inside Assetverse.
                </p>

                <Button
                  asChild
                  className="bg-white text-black hover:bg-white/90 h-10 text-sm rounded-md px-5 w-full"
                >
                  <a href="/assetverse">
                    Open Assetverse
                  </a>
                </Button>
              </div>
            </div>

          </div>

          {/* Main column */}
          <div className="lg:col-span-9">
            <div className="mb-4 lg:mb-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight">
                {inProgressCourses.length > 0 ? 'Continue Learning' : 'Featured Courses'}
              </h3>
              {inProgressCourses.length > 0 && (
                <Link 
                  href="/dashboard/courses"
                  className="text-xs text-white/60 hover:text-white transition"
                >
                  View all
                </Link>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
              </div>
            ) : (
              <>
                {/* Continue Learning Section */}
                {inProgressCourses.length > 0 && (
                  <div className="mb-10">
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"
                          : "grid grid-cols-1 gap-4 lg:gap-5"
                      }
                    >
                      {inProgressCourses.slice(0, 3).map((progress) => (
                        <CourseCard
                          key={progress.course_id}
                          course={progress.courses}
                          progress={progress.progress_percentage}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>

                    <div className="mt-8 mb-6">
                      <h3 className="text-sm font-semibold tracking-tight">
                        Explore More Courses
                      </h3>
                    </div>
                  </div>
                )}

                {/* All Courses */}
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"
                      : "grid grid-cols-1 gap-4 lg:gap-5"
                  }
                >
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                <div className="mt-8 lg:mt-10 flex justify-center">
                  <Button
                    asChild
                    variant="ghost"
                    className="border border-white/10 hover:bg-white/5 text-white/70 text-sm h-11 rounded-md px-6"
                  >
                    <Link href="/dashboard/courses">
                      Browse all courses
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
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
          className="h-full bg-white/70 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Percentage display */}
      <div className="text-right">
        <span className="text-xs text-white/50">{Math.round(percent)}%</span>
      </div>
    </div>
  )
}

function CourseCard({
  course,
  progress,
  viewMode
}: {
  course: Course
  progress?: number
  viewMode?: "grid" | "list"
}) {
  const isListView = viewMode === "list"

  return (
    <Link
      href={`/dashboard?course=${course.id}`}
      className={`group border border-white/10 rounded-xl bg-black hover:border-white/20 transition-colors overflow-hidden ${
        isListView ? 'flex flex-col sm:flex-row' : ''
      }`}
    >
      <div className={`${isListView ? 'sm:w-64' : ''} aspect-[16/9] w-full bg-white/5 relative ${isListView ? 'sm:aspect-auto flex-shrink-0' : ''}`}>
        <img
          src={course.image_url}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-4 w-4 lg:h-5 lg:w-5 text-black ml-0.5" fill="black" />
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-5 flex-1">
        <p className="text-xs text-white/50 mb-1">
          {course.category}
        </p>

        <h3 className="text-base font-medium mb-1">
          {course.title}
        </h3>

        <p className="text-sm text-white/40 leading-relaxed mb-4 lg:mb-5 line-clamp-2">
          {course.description}
        </p>

        {progress !== undefined ? (
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
        ) : (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="px-2 py-0.5 rounded-full bg-white/5">
              {course.difficulty}
            </span>
            <span>•</span>
            <span>{course.lessons_count} lessons</span>
          </div>
        )}
      </div>
    </Link>
  )
}