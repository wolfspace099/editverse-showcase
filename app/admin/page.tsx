"use client"

import { useState, useEffect } from "react"
import { GeistSans } from "geist/font/sans"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useRouter, notFound } from "next/navigation"
import { BadgeCheck, Users, BookOpen, Plus, Edit2, Trash2, Save, X, TrendingUp, ChevronDown, ChevronUp, Play } from "lucide-react"
import {
  getAllCoursesAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStats,
  getCourseLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getCourseChapters,
  createCourseChapter,
  updateCourseChapter,
  deleteCourseChapter
} from "@/lib/supabaseApi"
import ApplicationsManagement from "@/components/applications-management"

// ADMIN EMAIL WHITELIST
const ADMIN_EMAILS = [
  'wolfspace099@gmail.com',
]

type Tab = 'courses' | 'applications'

type Chapter = {
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
  course_id: string
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
  is_published: boolean
  order_index: number
}

type CourseStats = {
  enrollments: number
  completions: number
  completionRate: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  // User / Auth
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('applications')

  // Courses management state
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState<Record<string, CourseStats>>({})

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const [chapters, setChapters] = useState<Chapter[]>([])
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [isCreatingChapter, setIsCreatingChapter] = useState(false)
  const [chapterForm, setChapterForm] = useState({ title: "", order_index: 0 })

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonLoading, setLessonLoading] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    duration_minutes: 0,
    order_index: 0,
    chapter_id: null as string | null
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Editing course",
    image_url: "",
    difficulty: "Beginner",
    duration_minutes: 0
  })

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      setChecking(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setChecking(false)
        router.push("/login")
        return
      }

      const email = session.user.email
      if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
        setChecking(false)
        notFound()
        return
      }

      setUserId(session.user.id)
      setUserEmail(email)
      setIsAdmin(true)
      setChecking(false)

      if (activeTab === 'courses') loadCourses()
    }

    checkAuth()
  }, [activeTab])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // --- Courses management functions ---
  async function loadCourses() {
    setLoading(true)
    const { data } = await getAllCoursesAdmin()
    if (data) {
      setCourses(data)
      const statsPromises = data.map((course) =>
        getCourseStats(course.id).then((stats) => ({ id: course.id, stats }))
      )
      const statsResults = await Promise.all(statsPromises)
      const statsMap = statsResults.reduce((acc, { id, stats }) => {
        acc[id] = stats
        return acc
      }, {} as Record<string, CourseStats>)
      setStats(statsMap)
    }
    setLoading(false)
  }

  async function loadLessons(courseId: string) {
    setLessonLoading(true)
    const { data } = await getCourseLessons(courseId)
    const { data: chapterData } = await getCourseChapters(courseId)

    if (data) setLessons(data.sort((a, b) => a.order_index - b.order_index))
    if (chapterData) setChapters(chapterData.sort((a, b) => a.order_index - b.order_index))
    setLessonLoading(false)
  }

  function handleManageLessons(courseId: string) {
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null)
      setLessons([])
      setChapters([])
    } else {
      setSelectedCourseId(courseId)
      loadLessons(courseId)
    }
  }

  function handleEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id)
    setIsCreatingLesson(false)
    setLessonFormData({ ...lesson })
  }

  async function handleSaveLesson() {
    if (!selectedCourseId) return
    if (!lessonFormData.title.trim()) return alert("Lesson title is required")
    try {
      if (isCreatingLesson) {
        await createLesson({ ...lessonFormData, course_id: selectedCourseId })
      } else if (editingLessonId) {
        await updateLesson(editingLessonId, lessonFormData)
      }
      setEditingLessonId(null)
      setIsCreatingLesson(false)
      setLessonFormData({ title: "", description: "", video_url: "", duration_minutes: 0, order_index: 0, chapter_id: null })
      loadLessons(selectedCourseId)
    } catch (error) { console.error(error); alert("Failed to save lesson.") }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Are you sure you want to delete this lesson?")) return
    try {
      await deleteLesson(lessonId)
      if (selectedCourseId) { loadLessons(selectedCourseId); loadCourses() }
    } catch (error) { console.error(error); alert("Failed to delete lesson.") }
  }

  async function handleSaveChapter() {
    if (!selectedCourseId || !chapterForm.title.trim()) return alert("Chapter title is required")
    try {
      if (editingChapterId) await updateCourseChapter(editingChapterId, chapterForm)
      else await createCourseChapter({ ...chapterForm, course_id: selectedCourseId })
      setEditingChapterId(null)
      setIsCreatingChapter(false)
      setChapterForm({ title: "", order_index: 0 })
      loadLessons(selectedCourseId)
    } catch (error) { console.error(error); alert("Failed to save chapter.") }
  }

  async function handleDeleteChapter(id: string) {
    if (!confirm("Delete chapter? Lessons will become unassigned.")) return
    try { await deleteCourseChapter(id); if (selectedCourseId) loadLessons(selectedCourseId) }
    catch (error) { console.error(error); alert("Failed to delete chapter.") }
  }

  function handleEdit(course: Course) {
    setEditingId(course.id)
    setIsCreating(false)
    setFormData({ ...course })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setIsCreating(false)
    resetForm()
  }

  function resetForm() {
    setFormData({ title: "", description: "", category: "Editing course", image_url: "", difficulty: "Beginner", duration_minutes: 0 })
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.description.trim()) return alert("Title and description are required")
    try {
      if (isCreating) await createCourse(formData)
      else if (editingId) await updateCourse(editingId, formData)
      handleCancelEdit()
      loadCourses()
    } catch (error) { console.error(error); alert("Failed to save course.") }
  }

  async function handleDelete(courseId: string) {
    if (!confirm("Delete this course? All lessons & chapters will be removed.")) return
    try { await deleteCourse(courseId); loadCourses() }
    catch (error) { console.error(error); alert("Failed to delete course.") }
  }

  function getLessonsByChapter() {
    const grouped: { [key: string]: Lesson[] } = { unassigned: [] }
    chapters.forEach(c => grouped[c.id] = [])
    lessons.forEach(l => { if (l.chapter_id && grouped[l.chapter_id]) grouped[l.chapter_id].push(l); else grouped.unassigned.push(l) })
    return grouped
  }

  const totalEnrollments = Object.values(stats).reduce((sum, s) => sum + s.enrollments, 0)
  const avgCompletionRate = stats && Object.keys(stats).length > 0 ? Math.round(Object.values(stats).reduce((sum, s) => sum + s.completionRate, 0) / Object.keys(stats).length) : 0
  const lessonsByChapter = selectedCourseId ? getLessonsByChapter() : {}

  if ((checking && !userId) || (activeTab === 'courses' && loading && !userId)) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    )
  }

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl lg:text-2xl font-bold">Admin Dashboard</h1>
            {isAdmin && <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-white uppercase tracking-wider"><BadgeCheck className="h-3 w-3 text-white" />Admin Verified</div>}
            {userEmail && <span className="text-xs text-white/40 hidden sm:inline">({userEmail})</span>}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">Back to Dashboard</Button>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/60 hover:text-white">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition ${activeTab === 'applications' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/60'}`}>
            <Users className="h-4 w-4" /> Applications
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 flex items-center gap-2 border-b-2 transition ${activeTab === 'courses' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/60'}`}>
            <BookOpen className="h-4 w-4" /> Courses
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'applications' && userId && <ApplicationsManagement adminUserId={userId} />}
        {activeTab === 'courses' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard icon={BookOpen} label="Total Courses" value={courses.length} />
              <StatCard icon={Users} label="Total Enrollments" value={totalEnrollments} />
              <StatCard icon={TrendingUp} label="Avg Completion Rate" value={`${avgCompletionRate}%`} />
            </div>

            {/* Create Course Button */}
            <div className="mb-6">
              <Button onClick={() => { setIsCreating(true); setEditingId(null); resetForm() }} className="bg-white text-black hover:bg-white/90">
                <Plus className="mr-2 h-4 w-4" /> Create New Course
              </Button>
            </div>

            {/* Course management content here... */}
            {/* You can reuse all your first snippet course forms, cards, and lessons UI here */}
          </>
        )}
      </main>
    </div>
  )
}


function LessonItem({ 
  lesson, 
  onEdit, 
  onDelete 
}: { 
  lesson: Lesson
  onEdit: (lesson: Lesson) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between p-2 px-3 rounded border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition group">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded bg-white/5 flex items-center justify-center text-[10px] text-white/40 font-mono flex-shrink-0">
          {lesson.order_index + 1}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{lesson.title}</p>
          <p className="text-xs text-white/40 flex items-center gap-2">
            <Play className="h-3 w-3 flex-shrink-0" /> {lesson.duration_minutes} min
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 text-white/40 hover:text-white" 
          onClick={() => onEdit(lesson)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 text-white/40 hover:text-red-400" 
          onClick={() => onDelete(lesson.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-6 border border-white/10 rounded-lg bg-white/5">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-5 w-5 text-white/60" />
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

function CourseAdminCard({
  course,
  stats,
  onEdit,
  onDelete,
  onManageLessons,
  isManagingLessons
}: {
  course: Course
  stats?: CourseStats
  onEdit: () => void
  onDelete: () => void
  onManageLessons: () => void
  isManagingLessons: boolean
}) {
  return (
    <div className="p-6 border border-white/10 rounded-lg bg-white/5 hover:border-white/20 transition">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-48 aspect-video bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
          {course.image_url ? (
            <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <BookOpen className="h-12 w-12" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <h4 className="text-lg font-semibold mb-1">{course.title}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-white/5 text-white/50">{course.category}</span>
                <span className="px-2 py-1 rounded-full bg-white/5 text-white/50">{course.difficulty}</span>
                {!course.is_published && (
                  <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Draft</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={onEdit} className="text-white/40 hover:text-white">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} className="text-white/40 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-white/60 mb-4 line-clamp-2">{course.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Lessons</p>
              <p className="text-sm font-medium">{course.lessons_count}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Duration</p>
              <p className="text-sm font-medium">{course.duration_minutes}m</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Enrolled</p>
              <p className="text-sm font-medium">{stats?.enrollments || 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Completion</p>
              <p className="text-sm font-medium">{stats?.completionRate || 0}%</p>
            </div>
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={onManageLessons}
              className={`border-white/10 hover:bg-white/5 ${isManagingLessons ? "bg-white/10 border-white/20" : ""}`}
            >
              {isManagingLessons ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              Manage Lessons & Chapters
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}