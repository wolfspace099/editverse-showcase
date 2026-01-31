"use client"

import { useState, useEffect } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  CheckCircle2, 
  Circle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  MoreHorizontal,
  Check,
  Edit2
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['main']))

  // Get current user
  useEffect(() => {
    async function getUser() {
      const fakeUser = localStorage.getItem('fake_user')
      if (fakeUser) {
        try {
          const parsed = JSON.parse(fakeUser)
          setUserId(parsed.id)
          return
        } catch (e) {
          localStorage.removeItem('fake_user')
        }
      }

      const res = await supabase.auth.getSession()
      const user = res.data?.session?.user
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
    }
    
    getUser()
  }, [supabase, router])

  // Load course data
  useEffect(() => {
    if (userId && courseId) {
      loadCourseData()
    }
  }, [userId, courseId])

  async function loadCourseData() {
    setLoading(true)

    const { data: courseData } = await getCourseById(courseId)
    if (courseData) {
      setCourse(courseData)
      
      if (courseData.lessons && courseData.lessons.length > 0) {
        const sortedLessons = courseData.lessons.sort((a: Lesson, b: Lesson) => 
          a.order_index - b.order_index
        )
        setCurrentLesson(sortedLessons[0])
      }
    }

    if (!userId) return

    let { data: progressData } = await getCourseProgress(userId, courseId)
    if (!progressData) {
      const { data: newProgress } = await startCourse(userId, courseId)
      progressData = newProgress
    }

    if (progressData) {
      setProgress(progressData.progress_percentage || 0)
      if (progressData.last_lesson_id && courseData) {
        const lastLesson = courseData.lessons.find(
          (l: Lesson) => l.id === progressData.last_lesson_id
        )
        if (lastLesson) setCurrentLesson(lastLesson)
      }
    }

    const { data: completions } = await getLessonCompletions(userId, courseId)
    if (completions) {
      setCompletedLessons(new Set(completions.map(c => c.lesson_id)))
    }

    setLoading(false)
  }

  async function handleLessonSelect(lesson: Lesson) {
    setCurrentLesson(lesson)
    if (userId) {
      await updateCourseProgress(userId, courseId, {
        last_lesson_id: lesson.id,
        last_accessed_at: new Date().toISOString()
      })
    }
  }

  async function toggleLessonComplete(lessonId: string) {
    if (!userId) return
    const isCompleted = completedLessons.has(lessonId)

    if (isCompleted) {
      await unmarkLessonComplete(userId, lessonId)
      setCompletedLessons(prev => {
        const newSet = new Set(prev)
        newSet.delete(lessonId)
        return newSet
      })
    } else {
      await markLessonComplete(userId, lessonId, courseId)
      setCompletedLessons(prev => new Set([...prev, lessonId]))
    }

    const { data: updatedProgress } = await getCourseProgress(userId, courseId)
    if (updatedProgress) setProgress(updatedProgress.progress_percentage || 0)
  }

  function toggleModule(moduleId: string) {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) newSet.delete(moduleId)
      else newSet.add(moduleId)
      return newSet
    })
  }

  if (loading) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
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

  const sortedLessons = [...course.lessons].sort((a, b) => 
    a.order_index - b.order_index
  )

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white flex flex-col`}>
      <Header currentView="courses" />

      <div className="flex flex-1 pt-14 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Sidebar - Lessons List (Left) */}
        <aside 
          className={`${
            sidebarCollapsed ? 'w-0' : 'w-full lg:w-80'
          } border-r border-white/10 bg-black flex flex-col transition-all duration-300 relative z-30 overflow-y-auto`}
        >
          {/* Sidebar Header */}
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-bold text-lg leading-tight truncate pr-2" title={course.title}>
                {course.title}
              </h1>
              <button className="text-white/40 hover:text-white transition">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lessons List */}
          <nav className="flex-1 overflow-y-auto px-2">
            <div className="mb-2">
              <button 
                onClick={() => toggleModule('main')}
                className="w-full flex items-center justify-between p-3 text-sm font-semibold text-white/70 hover:bg-white/5 rounded-lg transition"
              >
                <span>Course Content</span>
                {expandedModules.has('main') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedModules.has('main') && (
                <div className="mt-1 space-y-0.5">
                  {sortedLessons.map((lesson, index) => {
                    const isCompleted = completedLessons.has(lesson.id)
                    const isCurrent = currentLesson?.id === lesson.id

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson)}
                        className={`w-full text-left p-3 pl-4 rounded-lg transition flex items-center gap-3 ${
                          isCurrent 
                            ? 'bg-white/10 text-white font-medium' 
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-green-500 stroke-[3]" />
                            </div>
                          ) : (
                            <Circle className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-white/20'}`} />
                          )}
                        </div>
                        <span className="text-[13px] truncate">{lesson.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content Area (Right) */}
        <main className="flex-1 overflow-y-auto bg-black relative">
          <div className="max-w-5xl mx-auto p-6 lg:p-10">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-bold text-white">
                {currentLesson?.title || "Welcome"}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => currentLesson && toggleLessonComplete(currentLesson.id)}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  <CheckCircle2 className={`h-5 w-5 ${currentLesson && completedLessons.has(currentLesson.id) ? 'text-green-500' : ''}`} />
                </button>
                <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition">
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Container */}
            <div className="bg-black rounded-2xl shadow-2xl border border-white/5 overflow-hidden mb-8 aspect-video relative group">
              {currentLesson ? (
                <img
                  src={course.image_url}
                  alt={currentLesson.title}
                  className="w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 bg-white/5">
                  Select a lesson to begin
                </div>
              )}
              
              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-black ml-1" />
                </div>
              </div>
            </div>

            {/* Lesson Details */}
            {currentLesson && (
              <div className="max-w-none">
                <div className="flex items-center gap-4 mb-6 text-sm text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {currentLesson.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    {course.difficulty}
                  </span>
                </div>
                <p className="text-white/60 leading-relaxed text-lg">
                  {currentLesson.description || "No description available for this lesson."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
