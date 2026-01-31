"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Menu,
  Play
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  getCourseById,
  getCourseProgress,
  getLessonCompletions,
  markLessonComplete,
  startCourse,
  unmarkLessonComplete,
  updateCourseProgress
} from "@/lib/supabaseApi"
import { getSupabaseClient } from "@/lib/supabaseClient"

type LessonChapter = {
  id: string
  title: string
  timestamp_seconds: number
}

type Lesson = {
  id: string
  title: string
  description: string
  video_url: string
  duration_minutes: number
  order_index: number
  chapters?: LessonChapter[]
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

export default function CoursePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const courseId = params?.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["main"]))
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function getUser() {
      const fakeUser = localStorage.getItem("fake_user")
      if (fakeUser) {
        try {
          const parsed = JSON.parse(fakeUser)
          setUserId(parsed.id)
          return
        } catch {
          localStorage.removeItem("fake_user")
        }
      }

      const res = await supabase.auth.getSession()
      const user = res.data?.session?.user
      if (!user) {
        router.push("/login")
        return
      }
      setUserId(user.id)
    }

    getUser()
  }, [supabase, router])

  useEffect(() => {
    if (userId && courseId) {
      loadCourseData()
    }
  }, [userId, courseId])

  useEffect(() => {
    setIsPlaying(false)
  }, [currentLesson?.id])

  async function loadCourseData() {
    setLoading(true)

    const { data: courseData } = await getCourseById(courseId)
    if (courseData) {
      setCourse(courseData)

      const lessons = ((courseData.lessons || []) as Lesson[])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)

      setCurrentLesson(lessons[0] || null)

      if (userId) {
        let { data: progressData } = await getCourseProgress(userId, courseId)
        if (!progressData) {
          const { data: newProgress } = await startCourse(userId, courseId)
          progressData = newProgress
        }

        if (progressData) {
          setProgress(progressData.progress_percentage || 0)
          if (progressData.last_lesson_id) {
            const lastLesson = lessons.find(
              (lesson) => lesson.id === progressData.last_lesson_id
            )
            if (lastLesson) setCurrentLesson(lastLesson)
          }
        }

        const { data: completions } = await getLessonCompletions(userId, courseId)
        if (completions) {
          setCompletedLessons(new Set(completions.map((c) => c.lesson_id)))
        }
      }
    }

    setLoading(false)
  }

  const sortedLessons = useMemo<Lesson[]>(() => {
    if (!course) return []
    return [...course.lessons].sort((a, b) => a.order_index - b.order_index)
  }, [course])

  const currentIndex = sortedLessons.findIndex(
    (lesson) => lesson.id === currentLesson?.id
  )

  const nextLesson =
    currentIndex >= 0 && currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null

  async function handleLessonSelect(lesson: Lesson) {
    setCurrentLesson(lesson)
    setIsPlaying(false)

    if (userId) {
      await updateCourseProgress(userId, courseId, {
        last_lesson_id: lesson.id,
        last_accessed_at: new Date().toISOString()
      })
    }
  }

  async function handleChapterJump(timestamp_seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp_seconds
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  async function handleVideoCompleteToggle() {
    if (!currentLesson || !userId) return

    const lessonId = currentLesson.id
    const isCompleted = completedLessons.has(lessonId)

    if (isCompleted) {
      await unmarkLessonComplete(userId, lessonId)

      setCompletedLessons((prev) => {
        const s = new Set(prev)
        s.delete(lessonId)
        return s
      })
    } else {
      await markLessonComplete(userId, lessonId, courseId)

      setCompletedLessons((prev) => new Set([...prev, lessonId]))

      if (nextLesson) {
        await updateCourseProgress(userId, courseId, {
          last_lesson_id: nextLesson.id,
          last_accessed_at: new Date().toISOString()
        })

        setCurrentLesson(nextLesson)
      }
    }

    const { data: updatedProgress } = await getCourseProgress(userId, courseId)
    if (updatedProgress) setProgress(updatedProgress.progress_percentage || 0)
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) newSet.delete(moduleId)
      else newSet.add(moduleId)
      return newSet
    })
  }

  if (loading) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
        <Header />
        <div className="pt-48 text-center">
          <p className="text-white/60 mb-4">Course not found</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/courses">Back to courses</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isCurrentCompleted =
    currentLesson && completedLessons.has(currentLesson.id)

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
      <Header currentView="courses" />

      <div className="pt-24 lg:pt-28 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 mb-6 lg:mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href="/dashboard/courses"
                  className="text-xs uppercase tracking-[0.2em] text-white/40 inline-block mb-3"
                >
                  Back to courses
                </Link>

                <h1 className="text-2xl lg:text-3xl font-semibold">
                  {course.title}
                </h1>

                <p className="text-sm text-white/50 mt-2 max-w-2xl">
                  {course.description}
                </p>
              </div>

              <button
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="lg:hidden h-9 w-9 border border-white/10 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:border-white/30"
                aria-label="Toggle lessons"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                {course.difficulty}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {course.duration_minutes} min
              </span>
              <span>{course.lessons_count} lessons</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="uppercase tracking-[0.2em] text-white/30">
                {progress}% complete
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* Sidebar */}
            <aside
              className={`${
                sidebarCollapsed ? "hidden" : "block"
              } lg:block border border-white/10 rounded-2xl bg-black/40 backdrop-blur`}
            >
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Progress</p>
                    <p className="text-sm font-medium mt-1">{progress}% complete</p>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mt-3">
                  <div
                    className="h-full bg-white/80 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <nav className="max-h-[calc(100vh-16rem)] overflow-y-auto px-2 py-3">
                <button
                  onClick={() => toggleModule("main")}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white/60 uppercase tracking-[0.2em]"
                >
                  <span>Course content</span>
                  {expandedModules.has("main") ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedModules.has("main") && (
                  <div className="mt-2 space-y-1">
                    {sortedLessons.map((lesson) => {
                      const isCompleted = completedLessons.has(lesson.id)
                      const isCurrent = currentLesson?.id === lesson.id

                      return (
                        <div key={lesson.id}>
                          <button
                            onClick={() => handleLessonSelect(lesson)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-3 ${
                              isCurrent
                                ? "bg-white/10 text-white"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                  <Check className="h-2.5 w-2.5 text-green-500 stroke-[3]" />
                                </div>
                              ) : (
                                <Circle className={`h-4 w-4 ${isCurrent ? "text-white" : "text-white/20"}`} />
                              )}
                            </div>

                            <span className="text-[13px] truncate">{lesson.title}</span>
                          </button>

                          {/* Chapters */}
                          {lesson.chapters?.length && isCurrent ? (
                            <div className="ml-5 mt-1 space-y-1">
                              {lesson.chapters.map((chapter) => (
                                <button
                                  key={chapter.id}
                                  onClick={() => handleChapterJump(chapter.timestamp_seconds)}
                                  className="flex items-center justify-between w-full px-2 py-1 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded"
                                >
                                  <span>{chapter.title}</span>
                                  <span>{Math.floor(chapter.timestamp_seconds / 60)}:
                                    {(chapter.timestamp_seconds % 60).toString().padStart(2, "0")}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </nav>
            </aside>

            {/* Main Content */}
            <section className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black overflow-hidden relative">
                <div className="aspect-video bg-black relative group">
                  {currentLesson ? (
                    <>
                      {isPlaying ? (
                        <div className="w-full h-full">
                          {currentLesson.video_url.includes("youtube.com") ||
                          currentLesson.video_url.includes("youtu.be") ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${
                                currentLesson.video_url.includes("v=")
                                  ? currentLesson.video_url.split("v=")[1].split("&")[0]
                                  : currentLesson.video_url.split("/").pop()
                              }?autoplay=1`}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : currentLesson.video_url.includes("vimeo.com") ? (
                            <iframe
                              src={`https://player.vimeo.com/video/${currentLesson.video_url.split("/").pop()}?autoplay=1`}
                              className="w-full h-full border-0"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              ref={videoRef}
                              src={currentLesson.video_url}
                              controls
                              autoPlay
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsPlaying(true)}
                          className="w-full h-full relative"
                        >
                          <img
                            src={course.image_url}
                            alt={currentLesson.title}
                            className="w-full h-full object-cover opacity-80"
                          />

                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <Play className="h-8 w-8 text-black ml-1" />
                            </div>
                          </div>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      Select a lesson to begin
                    </div>
                  )}
                </div>

                <div className="p-5 lg:p-6 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {currentLesson?.duration_minutes || 0} min
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" />
                      {course.difficulty}
                    </span>
                  </div>

                  <p className="text-base text-white/70 mt-4 leading-relaxed">
                    {currentLesson?.description || "No description available for this lesson."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
