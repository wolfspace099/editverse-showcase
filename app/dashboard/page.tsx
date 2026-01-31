"use client"

import { useEffect, useState } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import OverviewContent from "@/components/dashboard/overview-content"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Play,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Award
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  getCourseById,
  getCourseProgress,
  startCourse,
  updateCourseProgress,
  getLessonCompletions,
  markLessonComplete,
  unmarkLessonComplete
} from "@/lib/supabaseApi"
import { getSupabaseClient } from "@/lib/supabaseClient"

type Lesson = {
  id: string
  title: string
  description: string
  video_url: string
  duration_minutes: number
  order_index: number
}

type Course = {
  id: string
  title: string
  description: string
  category: string
  image_url: string
  difficulty: string
  duration_minutes: number
  lessons_count: number
  lessons: Lesson[]
}

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Page state
  const [page, setPage] = useState<string>("overview")
  const [courseId, setCourseId] = useState<string | null>(null)

  // Course Player State
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Detect page & course from query param
  useEffect(() => {
    const courseParam = searchParams?.get("course")
    setCourseId(courseParam)
    
    const pageParam = searchParams?.get("page") || (courseParam ? "course" : "overview")
    setPage(pageParam)
  }, [searchParams])

  // Check authentication
  useEffect(() => {
    let mounted = true

    async function resolveUser() {
      const fakeUserRaw =
        typeof window !== "undefined"
          ? localStorage.getItem("fake_user")
          : null

      if (fakeUserRaw) {
        try {
          const fakeUser = JSON.parse(fakeUserRaw)
          if (fakeUser?.id && mounted) {
            setUser(fakeUser)
            setLoading(false)
            return
          }
        } catch {
          localStorage.removeItem("fake_user")
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (!session?.user) {
        router.replace("/login")
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    resolveUser()
  }, [supabase, router])

  // Load course if courseId exists
  useEffect(() => {
    if (user && courseId) {
      loadCourseData(courseId)
    } else {
      setCourse(null)
      setCurrentLesson(null)
      setCompletedLessons(new Set())
      setProgress(0)
    }
  }, [user, courseId])

  async function loadCourseData(id: string) {
    setLoading(true)
    const { data: courseData } = await getCourseById(id)

    if (!courseData) {
      setCourse(null)
      setLoading(false)
      return
    }

    const sortedLessons = [...courseData.lessons].sort(
      (a, b) => a.order_index - b.order_index
    )

    setCourse({ ...courseData, lessons: sortedLessons })
    if (sortedLessons.length > 0) setCurrentLesson(sortedLessons[0])

    // Load progress
    const userId = user!.id
    let { data: progressData } = await getCourseProgress(userId, id)
    if (!progressData) {
      const { data: newProgress } = await startCourse(userId, id)
      progressData = newProgress
    }

    if (progressData) {
      setProgress(progressData.progress_percentage || 0)
      if (progressData.last_lesson_id) {
        const lastLesson = sortedLessons.find(l => l.id === progressData.last_lesson_id)
        if (lastLesson) setCurrentLesson(lastLesson)
      }
    }

    const { data: completions } = await getLessonCompletions(userId, id)
    if (completions) setCompletedLessons(new Set(completions.map(c => c.lesson_id)))

    setLoading(false)
  }

  async function handleLessonSelect(lesson: Lesson) {
    setCurrentLesson(lesson)
    if (!user || !course) return
    await updateCourseProgress(user.id, course.id, {
      last_lesson_id: lesson.id,
      last_accessed_at: new Date().toISOString()
    })
  }

  async function toggleLessonComplete(lessonId: string) {
    if (!user || !course) return
    const isCompleted = completedLessons.has(lessonId)
    if (isCompleted) {
      await unmarkLessonComplete(user.id, lessonId)
      setCompletedLessons(prev => { const next = new Set(prev); next.delete(lessonId); return next })
    } else {
      await markLessonComplete(user.id, lessonId, course.id)
      setCompletedLessons(prev => new Set([...prev, lessonId]))
    }
    const { data: updatedProgress } = await getCourseProgress(user.id, course.id)
    if (updatedProgress) setProgress(updatedProgress.progress_percentage || 0)
  }

  function handleNextLesson() {
    if (!course || !currentLesson) return
    const idx = course.lessons.findIndex(l => l.id === currentLesson.id)
    if (idx < course.lessons.length - 1) handleLessonSelect(course.lessons[idx + 1])
  }

  function handlePreviousLesson() {
    if (!course || !currentLesson) return
    const idx = course.lessons.findIndex(l => l.id === currentLesson.id)
    if (idx > 0) handleLessonSelect(course.lessons[idx - 1])
  }

  if (loading) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white flex flex-col`}>
      <Header currentView={page === "course" ? "courses" : page} />

      <main className="flex-1 pt-32 lg:pt-48">
        {page === "course" && course ? (
          // Course Player
          <div className="flex h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)]">
            <div className="flex h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)]">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-black aspect-video w-full relative flex-shrink-0">
                {currentLesson ? (
                  <img src={course.image_url} alt={currentLesson.title} className="w-full h-full object-contain"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    Select a lesson to begin
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePreviousLesson}
                    disabled={!currentLesson || currentLesson.order_index === 0}
                    className="h-8 px-3"
                  >
                    <ChevronLeft className="h-4 w-4"/>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNextLesson}
                    disabled={!currentLesson || currentLesson.order_index === course.lessons_count -1}
                    className="h-8 px-4"
                  >
                    Next Lesson
                  </Button>

                  {currentLesson && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleLessonComplete(currentLesson.id)}
                      className="ml-auto h-8 px-4"
                    >
                      {completedLessons.has(currentLesson.id) ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-4xl">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-white/60 hover:text-white mb-4 transition"
                >
                  <ChevronLeft className="h-4 w-4 mr-1"/>
                  Back to dashboard
                </Link>

                <h1 className="text-2xl lg:text-3xl font-bold mb-2">{course.title}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mb-6">
                  <span className="flex items-center gap-1"><Award className="h-4 w-4"/>{course.difficulty}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4"/>{course.duration_minutes} min total</span>
                  <span className="flex items-center gap-1"><Play className="h-4 w-4"/>{course.lessons_count} lessons</span>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/70">Your Progress</span>
                    <span className="text-white">{progress}% Complete</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-white/80 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {currentLesson && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Lesson {currentLesson.order_index + 1}: {currentLesson.title}
                    </h2>
                    <p className="text-white/70 leading-relaxed">{currentLesson.description || "No description available."}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className={`${sidebarCollapsed ? "w-0" : "w-full lg:w-96"} border-l border-white/10 bg-black/50 flex flex-col transition-all duration-300 absolute lg:relative inset-y-0 right-0 z-30 lg:z-auto`}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold">Course Content</h3>
                <Button size="sm" variant="ghost" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="lg:hidden h-8 w-8 p-0">
                  {sidebarCollapsed ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                </Button>
              </div>

              {!sidebarCollapsed && (
                <div className="flex-1 overflow-y-auto">
                  {course.lessons.map((lesson, idx) => {
                    const isCompleted = completedLessons.has(lesson.id)
                    const isCurrent = currentLesson?.id === lesson.id
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson)}
                        className={`w-full text-left p-4 border-b border-white/10 hover:bg-white/5 transition ${isCurrent ? "bg-white/10" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-500"/> : <Circle className="h-5 w-5 text-white/30"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/50 mb-1">Lesson {idx + 1}</p>
                            <p className={`text-sm font-medium mb-1 ${isCurrent ? "text-white" : "text-white/80"}`}>{lesson.title}</p>
                            <p className="text-xs text-white/40 flex items-center gap-1"><Clock className="h-3 w-3"/>{lesson.duration_minutes} min</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="lg:hidden p-2 border-t border-white/10">
                <Button size="sm" variant="outline" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full">
                  {sidebarCollapsed ? (<><ChevronUp className="mr-2 h-4 w-4"/> Show Lessons</>) : (<><ChevronDown className="mr-2 h-4 w-4"/> Hide Lessons</>)}
                </Button>
              </div>
            </div>
          </div>
          </div>
        ) : page === "courses" ? (
          // Courses list page (can reuse OverviewContent with viewMode=all courses)
          <OverviewContent userId={user.id} />
        ) : (
          // Overview page
          <OverviewContent userId={user.id} />
        )}
      </main>
    </div>
  )
}
