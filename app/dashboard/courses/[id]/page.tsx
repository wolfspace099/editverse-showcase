"use client"

import { Suspense, useEffect, useMemo, useState, useRef } from "react"
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
  updateCourseProgress,
  getCourseChapters,
  recalculateProgress
} from "@/lib/supabaseApi"
import { getSupabaseClient } from "@/lib/supabaseClient"

type CourseChapter = {
  id: string
  title: string
  order_index: number
  course_id: string
}

type Lesson = {
  id: string
  title: string
  description: string
  video_url: string
  duration_minutes: number
  order_index: number
  chapter_id: string | null
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

function CoursePlayerContent() {
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseClient()
  const courseId = params?.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<CourseChapter[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function getUser() {
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

      // Load chapters
      const { data: chaptersData } = await getCourseChapters(courseId)
      if (chaptersData) {
        const sortedChapters = chaptersData.sort((a, b) => a.order_index - b.order_index)
        setChapters(sortedChapters)
        
        // Expand all chapters by default
        setExpandedChapters(new Set(sortedChapters.map(c => c.id)))
      }

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

  // Group lessons by chapter
  const lessonsByChapter = useMemo(() => {
    const grouped: { [key: string]: Lesson[] } = {
      unassigned: []
    }
    
    chapters.forEach(chapter => {
      grouped[chapter.id] = []
    })

    sortedLessons.forEach(lesson => {
      if (lesson.chapter_id && grouped[lesson.chapter_id]) {
        grouped[lesson.chapter_id].push(lesson)
      } else {
        grouped.unassigned.push(lesson)
      }
    })

    return grouped
  }, [sortedLessons, chapters])

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

  async function handleToggleComplete() {
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
    }

    // Recalculate progress
    const { progress_percentage } = await recalculateProgress(userId, courseId)
    setProgress(progress_percentage)
  }

  async function handleMarkCompleteAndNext() {
    if (!currentLesson || !userId) return

    const lessonId = currentLesson.id
    const isCompleted = completedLessons.has(lessonId)

    if (!isCompleted) {
      await markLessonComplete(userId, lessonId, courseId)
      setCompletedLessons((prev) => new Set([...prev, lessonId]))
    }

    // Recalculate progress
    const { progress_percentage } = await recalculateProgress(userId, courseId)
    setProgress(progress_percentage)

    if (nextLesson) {
      await updateCourseProgress(userId, courseId, {
        last_lesson_id: nextLesson.id,
        last_accessed_at: new Date().toISOString()
      })
      setCurrentLesson(nextLesson)
    }
  }

  function toggleChapter(chapterId: string) {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
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

  const isCurrentCompleted = currentLesson && completedLessons.has(currentLesson.id)

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
                {/* Chapters */}
                {chapters.map((chapter) => {
                  const chapterLessons = lessonsByChapter[chapter.id] || []
                  const isExpanded = expandedChapters.has(chapter.id)
                  
                  return (
                    <div key={chapter.id} className="mb-2">
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white/70 uppercase tracking-[0.2em] hover:text-white transition"
                      >
                        <span>Chapter {chapter.order_index + 1}: {chapter.title}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-1 space-y-1 pl-2">
                          {chapterLessons.map((lesson) => {
                            const isCompleted = completedLessons.has(lesson.id)
                            const isCurrent = currentLesson?.id === lesson.id

                            return (
                              <button
                                key={lesson.id}
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
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Unassigned Lessons */}
                {lessonsByChapter.unassigned?.length > 0 && (
                  <div className="mt-4">
                    <p className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">
                      Other Lessons
                    </p>
                    <div className="mt-1 space-y-1">
                      {lessonsByChapter.unassigned.map((lesson) => {
                        const isCompleted = completedLessons.has(lesson.id)
                        const isCurrent = currentLesson?.id === lesson.id

                        return (
                          <button
                            key={lesson.id}
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
                        )
                      })}
                    </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{currentLesson?.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {currentLesson?.duration_minutes || 0} min
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    {currentLesson?.description || "No description available for this lesson."}
                  </p>

                  {/* Completion Controls */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                    <Button
                      onClick={handleToggleComplete}
                      variant={isCurrentCompleted ? "outline" : "default"}
                      size="sm"
                      className={isCurrentCompleted ? "border-green-500/50 text-green-400 hover:bg-green-500/10" : ""}
                    >
                      {isCurrentCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Incomplete
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>

                    {nextLesson && (
                      <Button
                        onClick={handleMarkCompleteAndNext}
                        variant="default"
                        size="sm"
                        className="bg-white text-black hover:bg-white/90"
                      >
                        Complete & Continue
                        <ChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CoursePlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    }>
      <CoursePlayerContent />
    </Suspense>
  )
}