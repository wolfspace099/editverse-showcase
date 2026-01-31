"use client"

import { useState, useEffect } from "react"
import { GeistSans } from "geist/font/sans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Users,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Play
} from "lucide-react"
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
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useRouter, notFound } from "next/navigation"
import { BadgeCheck } from "lucide-react"

type Chapter = {
  id: string
  title: string
  order_index: number
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

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState<Record<string, CourseStats>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [checking, setChecking] = useState(true)

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const [chapters, setChapters] = useState<Chapter[]>([])
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [chapterForm, setChapterForm] = useState({
    title: "",
    order_index: 0
  })

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

  const handleLogout = async () => {
    localStorage.removeItem("fake_user")
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
  async function checkAuth() {
    setChecking(true)

    // TEMP: Fake admin user for testing while Supabase is down
    const fakeAdmin = {
      id: 'fake-admin-id-123',
      role: 'admin'
    }
    setUserId(fakeAdmin.id)
    setIsAdmin(true)
    setChecking(false)
    loadCourses()

    /*
    // Original Supabase auth check (commented out)
    const fakeUser = localStorage.getItem("fake_user")
    if (fakeUser) {
      try {
        const parsed = JSON.parse(fakeUser)
        setUserId(parsed.id)
        setIsAdmin(false)
        setChecking(false)
        notFound()
        return
      } catch {
        localStorage.removeItem("fake_user")
      }
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setChecking(false)
      router.push("/login")
      return
    }

    const role = session.user.app_metadata?.role || (session.user as any).role
    if (role !== "admin") {
      setChecking(false)
      notFound()
      return
    }

    setUserId(session.user.id)
    setIsAdmin(true)
    setChecking(false)
    loadCourses()
    */
  }

  checkAuth()
}, [])

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

    if (data) {
      setLessons(data.sort((a, b) => a.order_index - b.order_index))
    }
    if (chapterData) {
      setChapters(chapterData.sort((a, b) => a.order_index - b.order_index))
    }

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
    setLessonFormData({
      title: lesson.title,
      description: lesson.description || "",
      video_url: lesson.video_url || "",
      duration_minutes: lesson.duration_minutes || 0,
      order_index: lesson.order_index,
      chapter_id: lesson.chapter_id
    })
  }

  async function handleSaveLesson() {
    if (!selectedCourseId) return
    if (!lessonFormData.title) {
      alert("Lesson title is required")
      return
    }

    if (isCreatingLesson) {
      await createLesson({ ...lessonFormData, course_id: selectedCourseId })
    } else if (editingLessonId) {
      await updateLesson(editingLessonId, lessonFormData)
    }

    setEditingLessonId(null)
    setIsCreatingLesson(false)
    loadLessons(selectedCourseId)
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Delete lesson?")) return
    await deleteLesson(lessonId)
    if (selectedCourseId) loadLessons(selectedCourseId)
  }

  async function handleSaveChapter() {
    if (!selectedCourseId) return
    if (!chapterForm.title) return

    let savedChapter: Chapter

    if (editingChapterId) {
      savedChapter = await updateCourseChapter(editingChapterId, chapterForm)
      setChapters((prev) =>
        prev.map((c) => (c.id === editingChapterId ? savedChapter : c))
      )
    } else {
      savedChapter = await createCourseChapter({ ...chapterForm, course_id: selectedCourseId })
      setChapters((prev) => [...prev, savedChapter])
    }

    setEditingChapterId(null)
    setChapterForm({ title: "", order_index: 0 })
  }





  async function handleDeleteChapter(id: string) {
    if (!confirm("Delete chapter? Lessons will become unassigned.")) return
    await deleteCourseChapter(id)
    if (selectedCourseId) loadLessons(selectedCourseId)
  }

  function handleEdit(course: Course) {
    setEditingId(course.id)
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      image_url: course.image_url,
      difficulty: course.difficulty,
      duration_minutes: course.duration_minutes
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setIsCreating(false)
    resetForm()
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      category: "Editing course",
      image_url: "",
      difficulty: "Beginner",
      duration_minutes: 0
    })
  }

  async function handleSave() {
    if (!formData.title || !formData.description) return
    if (isCreating) {
      await createCourse(formData)
    } else if (editingId) {
      await updateCourse(editingId, formData)
    }
    handleCancelEdit()
    loadCourses()
  }

  async function handleDelete(courseId: string) {
    if (!confirm("Delete course?")) return
    await deleteCourse(courseId)
    loadCourses()
  }

  const totalEnrollments = Object.values(stats).reduce((sum, s) => sum + s.enrollments, 0)
  const avgCompletionRate =
    stats && Object.keys(stats).length > 0
      ? Math.round(Object.values(stats).reduce((sum, s) => sum + s.completionRate, 0) / Object.keys(stats).length)
      : 0

  if ((loading || checking) && !userId) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white" />
      </div>
    )
  }

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
      {/* header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl lg:text-2xl font-bold">Admin Dashboard</h1>
              {isAdmin && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-white uppercase tracking-wider">
                  <BadgeCheck className="h-3 w-3 text-white" />
                  Admin Verified
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">Back to Dashboard</Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/60 hover:text-white">Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={BookOpen} label="Total Courses" value={courses.length} />
          <StatCard icon={Users} label="Total Enrollments" value={totalEnrollments} />
          <StatCard icon={TrendingUp} label="Avg Completion Rate" value={`${avgCompletionRate}%`} />
        </div>

        {/* create course */}
        <div className="mb-6">
          <Button onClick={() => { setIsCreating(true); resetForm() }} className="bg-white text-black hover:bg-white/90">
            <Plus className="mr-2 h-4 w-4" /> Create New Course
          </Button>
        </div>

        {/* course form */}
        {(isCreating || editingId) && (
          <div className="mb-8 p-6 border border-white/10 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold mb-4">{isCreating ? "Create New Course" : "Edit Course"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* form inputs */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Title *</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Course title" className="bg-black border-white/10" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full h-10 px-3 rounded-md bg-black border border-white/10 text-white">
                  <option value="Editing course">Editing course</option>
                  <option value="Motion Graphics">Motion Graphics</option>
                  <option value="Color Grading">Color Grading</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Difficulty</label>
                <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full h-10 px-3 rounded-md bg-black border border-white/10 text-white">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Duration (minutes)</label>
                <Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })} placeholder="120" className="bg-black border-white/10" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Image URL</label>
                <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} placeholder="/images/course-preview.jpg" className="bg-black border-white/10" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Description *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Course description" rows={4} className="w-full px-3 py-2 rounded-md bg-black border border-white/10 text-white resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Save</Button>
              <Button onClick={handleCancelEdit} variant="outline"><X className="mr-2 h-4 w-4" />Cancel</Button>
            </div>
          </div>
        )}

        {/* courses list */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Courses</h3>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-white/60">No courses yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="space-y-4">
                  <CourseAdminCard
                    course={course}
                    stats={stats[course.id]}
                    onEdit={() => handleEdit(course)}
                    onDelete={() => handleDelete(course.id)}
                    onManageLessons={() => handleManageLessons(course.id)}
                    isManagingLessons={selectedCourseId === course.id}
                  />

                  {selectedCourseId === course.id && (
                  <div className="ml-8 p-6 border border-white/5 rounded-lg bg-white/[0.02] space-y-6">
                    <div className="flex flex-col gap-4">
                      {/* Chapters */}
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-white/40">Chapters</p>
                        {chapters.map((chapter) => (
                          <div key={chapter.id} className="flex items-center justify-between px-3 py-2 rounded border border-white/10">
                            <div className="text-sm">{chapter.order_index + 1}. {chapter.title}</div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingChapterId(chapter.id)
                                  setChapterForm({ title: chapter.title, order_index: chapter.order_index })
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-white/40 hover:text-red-400"
                                onClick={() => handleDeleteChapter(chapter.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Add / Edit chapter form */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <Input
                            placeholder="Chapter title"
                            value={chapterForm.title}
                            onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                            className="bg-black border-white/10"
                          />
                          <Input
                            type="number"
                            value={chapterForm.order_index}
                            onChange={(e) => setChapterForm({ ...chapterForm, order_index: parseInt(e.target.value) || 0 })}
                            className="bg-black border-white/10"
                          />
                          <Button size="sm" onClick={handleSaveChapter}>
                            <Save className="h-4 w-4 mr-2" /> {editingChapterId ? "Update" : "Add"}
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setIsCreatingLesson(true)
                            setEditingLessonId(null)
                            setLessonFormData({
                              title: "",
                              description: "",
                              video_url: "",
                              duration_minutes: 0,
                              order_index: lessons.length,
                              chapter_id: null,
                            })
                          }}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Lesson
                        </Button>
                      </div>

                      {/* Lesson Form */}
                      {(isCreatingLesson || editingLessonId) && (
                        <div className="p-4 border border-white/10 rounded bg-black/40 space-y-4">
                          <Input
                            placeholder="Lesson title"
                            value={lessonFormData.title}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                            className="bg-black border-white/10"
                          />
                          <textarea
                            placeholder="Lesson description"
                            value={lessonFormData.description}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 rounded-md bg-black border border-white/10 text-white resize-none"
                          />
                          <Input
                            placeholder="Video URL"
                            value={lessonFormData.video_url}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, video_url: e.target.value })}
                            className="bg-black border-white/10"
                          />
                          <Input
                            type="number"
                            placeholder="Duration in minutes"
                            value={lessonFormData.duration_minutes}
                            onChange={(e) => setLessonFormData({ ...lessonFormData, duration_minutes: parseInt(e.target.value) || 0 })}
                            className="bg-black border-white/10"
                          />

                          {/* Chapter selector */}
                          {chapters.length > 0 && (
                            <div>
                              <label className="block text-sm text-white/70 mb-1">Chapter</label>
                              <select
                                value={lessonFormData.chapter_id || ""}
                                onChange={(e) =>
                                  setLessonFormData({ ...lessonFormData, chapter_id: e.target.value || null })
                                }
                                className="w-full h-10 px-3 rounded-md bg-black border border-white/10 text-white"
                              >
                                <option value="">Unassigned</option>
                                {chapters.map((chapter) => (
                                  <option key={chapter.id} value={chapter.id}>
                                    {chapter.order_index + 1}. {chapter.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button onClick={handleSaveLesson}>
                              <Save className="h-4 w-4 mr-2" /> Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsCreatingLesson(false)
                                setEditingLessonId(null)
                              }}
                            >
                              <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                          </div>
                        </div>
                      )}


                      {/* Lessons list */}
                      {lessonLoading ? (
                        <div className="py-4 text-center text-white/40">Loading lessons...</div>
                      ) : lessons.length === 0 ? (
                        <div className="py-4 text-center text-white/40">No lessons in this course.</div>
                      ) : (
                        <div className="space-y-2">
                          {lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 border border-white/5 rounded bg-white/[0.01] hover:bg-white/[0.03] transition group">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center text-xs text-white/40 font-mono">
                                  {lesson.order_index + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{lesson.title}</p>
                                  <p className="text-xs text-white/40 flex items-center gap-2">
                                    <Play className="h-3 w-3" /> {lesson.duration_minutes} min
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => handleEditLesson(lesson)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-red-400" onClick={() => handleDeleteLesson(lesson.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
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
          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <h4 className="text-lg font-semibold mb-1">{course.title}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-white/5 text-white/50">{course.category}</span>
                <span className="px-2 py-1 rounded-full bg-white/5 text-white/50">{course.difficulty}</span>
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
              Manage Lessons
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
