"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Grid3x3,
  List,
  ChevronDown,
  Check,
  Star,
  BookOpen,
  MoreHorizontal,
  Play,
  Clock
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

const BG       = "#0a0a0a"
const BORDER   = "rgba(255,255,255,0.06)"
const BORDER_H = "rgba(255,255,255,0.13)"

export default function OverviewContent({ userId }: { userId: string }) {
  const [searchQuery,  setSearchQuery]  = useState("")
  const [courses,      setCourses]      = useState<Course[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [userStats,    setUserStats]    = useState<UserStats | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [expandStats,  setExpandStats]  = useState(false)

  useEffect(() => { loadData() }, [userId])

  async function loadData() {
    setLoading(true)
    const { data: coursesData }  = await getAllCourses({})
    setCourses(coursesData?.slice(0, 6) || [])

    const { data: progressData } = await getUserProgress(userId)
    setUserProgress(progressData || [])

    const { data: statsData }    = await getUserStats(userId)
    setUserStats(statsData)
    setLoading(false)
  }

  const getProgress = (courseId: string) =>
    userProgress.find(p => p.course_id === courseId)?.progress_percentage ?? 0

  const completedCourses  = userProgress.filter(p => p.progress_percentage === 100)
  const inProgressCourses = userProgress.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100)
  const recentCourse = inProgressCourses[0]?.courses || completedCourses[0]?.courses || courses[0] || null

  const statsRows = [
    { label: "Course Points",     current: userStats?.total_points ?? 0,  total: 100, unit: "pts" },
    { label: "Courses Completed", current: completedCourses.length,       total: 50,  unit: ""    },
    { label: "In Progress",       current: inProgressCourses.length,      total: 20,  unit: ""    },
    { label: "Learning Streak",   current: 3,                             total: 30,  unit: "d"   },
    { label: "Total Hours",       current: 24,                            total: 200, unit: "h"   },
    { label: "Achievements",      current: 7,                             total: 25,  unit: ""    },
  ]
  const visibleStats = expandStats ? statsRows : statsRows.slice(0, 4)

  return (
    <div className="px-4 sm:px-6 lg:px-8 min-h-full">
      <div className="max-w-[1440px] mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div>
              {/* Page Header */}
              <div className="mb-8 lg:mb-10">
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back!</h1>
                <p className="text-white/60 text-sm lg:text-base">Get back to editing with our comprehensive learning capabilities.</p>
              </div>
              <p className="text-base font-medium text-white mb-3">Level</p>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                {/* header */}
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50">Last 30 days</span>
                    <MiniRing percent={((userStats?.current_level||1)/(userStats?.max_level||5))*100} size={24} stroke={2.5}>
                      <span className="text-[9px] font-bold text-white">{userStats?.current_level||1}</span>
                    </MiniRing>
                  </div>
                  <button className="text-xs text-white/55 px-3 py-1 rounded-md transition"
                    style={{ border: `1px solid ${BORDER}` }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                    Upgrade
                  </button>
                </div>

                {visibleStats.map((row, i) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3"
                    style={i < visibleStats.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : {}}>
                    <div className="flex items-center gap-3">
                      <MiniRing percent={(row.current/row.total)*100} size={22} stroke={2.2} />
                      <span className="text-sm text-white/60">{row.label}</span>
                    </div>
                    <span className="text-sm">
                      <span className="text-white font-medium">{row.current}</span>
                      {row.unit && <span className="text-white/25 text-xs ml-0.5">{row.unit}</span>}
                      <span className="text-white/20 mx-1.5">/</span>
                      <span className="text-white/35">{row.total}</span>
                      {row.unit && <span className="text-white/20 text-xs ml-0.5">{row.unit}</span>}
                    </span>
                  </div>
                ))}

                <button onClick={() => setExpandStats(!expandStats)}
                  className="w-full flex items-center justify-center py-2.5"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <ChevronDown className="h-4 w-4 text-white/25 transition-transform duration-300"
                    style={{ transform: expandStats ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-white mb-3">Assetverse</p>
              <div className="rounded-xl p-6 flex flex-col items-center text-center" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                <p className="text-sm font-medium text-white mb-2">Get premium assets</p>
                <p className="text-xs text-white/40 leading-relaxed mb-5 max-w-[240px]">
                  Automatically access templates, presets and media packs — all for free inside Assetverse.
                </p>
                <button
                  className="text-xs text-white/70 hover:text-white transition px-4 py-1.5 rounded-md"
                  style={{ border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={() => { window.location.href = "/assetverse" }}>
                  Open Assetverse
                </button>
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-white mb-3">Courses</p>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                {recentCourse ? (
                  <Link href={`/dashboard/courses/${recentCourse.id}`} className="block">
                    <div className="aspect-[16/7] w-full relative" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <img src={recentCourse.image_url} alt={recentCourse.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-xs text-white/40">Continue learning</p>
                      <p className="text-sm font-medium text-white mt-0.5">{recentCourse.title}</p>
                    </div>
                  </Link>
                ) : (
                  <div className="px-5 py-10 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <BookOpen className="h-6 w-6 text-white/40" />
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Courses you have recently visited will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <p className="text-base font-medium text-white mb-3">Courses</p>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-solid border-white/15 border-r-white" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map(course => (
                  <CourseCard key={course.id} course={course} viewMode="grid" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniRing({ percent, size = 22, stroke = 2.2, children }: {
  percent: number; size?: number; stroke?: number; children?: React.ReactNode
}) {
  const r      = (size - stroke * 2) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(percent, 100) / 100)
  const c      = size / 2
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={c} cy={c} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle cx={c} cy={c} r={r} stroke="white" strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

function CourseCard({ course, viewMode }: { course: Course; viewMode: "grid" | "list" }) {
  const link = `/dashboard/courses/${course.id}`

  if (viewMode === "list") {
    return (
      <Link href={link} className="group border border-white/10 rounded-xl bg-black hover:border-white/20 transition-colors overflow-hidden flex flex-col sm:flex-row">
        <div className="sm:w-64 aspect-[16/9] sm:aspect-auto bg-white/5 relative flex-shrink-0">
          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-4 lg:p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">{course.category}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">{course.difficulty}</span>
            </div>
            <h3 className="text-lg font-medium mb-2">{course.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">{course.description}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration_minutes} min</span>
            <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5" />{course.lessons_count} lessons</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={link} className="group border border-white/10 rounded-xl bg-black hover:border-white/20 transition-colors overflow-hidden">
      <div className="aspect-[16/9] w-full bg-white/5 relative">
        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
          </div>
        </div>
      </div>
      <div className="p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">{course.category}</span>
        </div>
        <h3 className="text-base font-medium mb-1">{course.title}</h3>
        <p className="text-sm text-white/50 leading-relaxed mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration_minutes} min</span>
          <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5" />{course.lessons_count} lessons</span>
          <span className="px-2 py-0.5 rounded-full bg-white/5">{course.difficulty}</span>
        </div>
      </div>
    </Link>
  )
}

function ProgressCheckRing({ percent, size = 34, stroke = 3.5 }: { percent: number; size?: number; stroke?: number }) {
  const r      = (size - stroke * 2) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(percent, 100) / 100)
  const c      = size / 2
  const done   = percent >= 100

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={c} cy={c} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle cx={c} cy={c} r={r}
          stroke={done ? "white" : "rgba(255,255,255,0.55)"}
          strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      {/* checkmark centre */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Check
          className="transition-all duration-300"
          style={{
            width:  done ? size * 0.52 : size * 0.42,
            height: done ? size * 0.52 : size * 0.42,
            color:  done ? "white" : "rgba(255,255,255,0.35)",
            strokeWidth: 2.8,
          }}
        />
      </div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-white/45 px-2.5 py-1 rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
      {children}
    </span>
  )
}