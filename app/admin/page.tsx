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
  Play,
  Type
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
  deleteLesson
} from "@/lib/supabaseApi"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useRouter, notFound } from "next/navigation"
import { BadgeCheck } from "lucide-react"

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

  // Lesson Management State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonLoading, setLessonLoading] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [isCreatingLesson, setIsCreatingLesson] = useState(false)
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    duration_minutes: 0,
    order_index: 0
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Editing course",
    image_url: "",
    difficulty: "Beginner",
    duration_minutes: 0,
  })

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      setChecking(true)
      const fakeUser = localStorage.getItem('fake_user')
      if (fakeUser) {
        try {
          const parsed = JSON.parse(fakeUser)
          setUserId(parsed.id)
          setIsAdmin(false) // Fake users are never database admins
          setChecking(false)
          notFound() // Return 404 for fake users in admin panel
          return
        } catch (e) {
          localStorage.removeItem('fake_user')
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setChecking(false)
        router.push('/login')
        return
      }
      
      // Check for admin role in JWT
      const role = session.user.app_metadata?.role || (session.user as any).role
      
      if (role !== 'admin') {
        setChecking(false)
        notFound() // Trigger 404 if not admin
        return
      }

      setUserId(session.user.id)
      setIsAdmin(true)
      setChecking(false)
      loadCourses()
    }
    
    checkAuth()
  }, [])

  async function loadCourses() {
    setLoading(true)
    const { data } = await getAllCoursesAdmin()
    
    if (data) {
      setCourses(data)
      const statsPromises = data.map(course => 
        getCourseStats(course.id).then(stats => ({ id: course.id, stats }))
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

  const handleLogout = async () => {
    localStorage.removeItem('fake_user')
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Lesson Functions
  async function loadLessons(courseId: string) {
    setLessonLoading(true)
    const { data } = await getCourseLessons(courseId)
    if (data) {
      setLessons(data.sort((a: Lesson, b: Lesson) => a.order_index - b.order_index))
    }
    setLessonLoading(false)
  }

  function handleManageLessons(courseId: string) {
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null)
      setLessons([])
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
      order_index: lesson.order_index
    })
  }

  async function handleSaveLesson() {
    if (!selectedCourseId) return
    if (!lessonFormData.title) {
      alert("Lesson title is required")
      return
    }

    if (isCreatingLesson) {
      const { error } = await createLesson({
        ...lessonFormData,
        course_id: selectedCourseId
      })
      if (error) {
        console.error("RLS Error Detail:", error)
        alert("Error creating lesson: " + error.message + ". This is often a Supabase RLS policy issue.")
      }
    } else if (editingLessonId) {
      const { error } = await updateLesson(editingLessonId, lessonFormData)
      if (error) alert("Error updating lesson: " + error.message)
    }

    setEditingLessonId(null)
    setIsCreatingLesson(false)
    loadLessons(selectedCourseId)
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Are you sure you want to delete this lesson?")) return
    const { error } = await deleteLesson(lessonId)
    if (error) alert("Error deleting lesson: " + error.message)
    else if (selectedCourseId) loadLessons(selectedCourseId)
  }

  // Course Functions
  function handleEdit(course: Course) {
    setEditingId(course.id)
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      image_url: course.image_url,
      difficulty: course.difficulty,
      duration_minutes: course.duration_minutes,
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
      duration_minutes: 0,
    })
  }

  async function handleSave() {
    if (!formData.title || !formData.description) {
      alert("Please fill in all required fields")
      return
    }

    if (isCreating) {
      const { error } = await createCourse(formData)
      if (error) {
        alert("Error creating course: " + error.message)
        return
      }
    } else if (editingId) {
      const { error } = await updateCourse(editingId, formData)
      if (error) {
        alert("Error updating course: " + error.message)
        return
      }
    }

    handleCancelEdit()
    loadCourses()
  }

  async function handleDelete(courseId: string) {
    if (!confirm("Are you sure you want to delete this course?")) return
    const { error } = await deleteCourse(courseId)
    if (error) {
      alert("Error deleting course: " + error.message)
      return
    }
    loadCourses()
  }

  const totalEnrollments = Object.values(stats).reduce((sum, s) => sum + s.enrollments, 0)
  const avgCompletionRate = stats && Object.keys(stats).length > 0
    ? Math.round(Object.values(stats).reduce((sum, s) => sum + s.completionRate, 0) / Object.keys(stats).length)
    : 0

  if ((loading || checking) && !userId) {
    return (
      <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
      </div>
    )
  }

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
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
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="sm"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={BookOpen} label="Total Courses" value={courses.length} />
          <StatCard icon={Users} label="Total Enrollments" value={totalEnrollments} />
          <StatCard icon={TrendingUp} label="Avg Completion Rate" value={`${avgCompletionRate}%`} />
        </div>

        <div className="mb-6">
          <Button
            onClick={() => {
              setIsCreating(true)
              resetForm()
            }}
            className="bg-white text-black hover:bg-white/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Course
          </Button>
        </div>

        {(isCreating || editingId) && (
          <div className="mb-8 p-6 border border-white/10 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold mb-4">
              {isCreating ? "Create New Course" : "Edit Course"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white/90">Lessons Management</h4>
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
                              order_index: lessons.length
                            })
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Lesson
                        </Button>
                      </div>

                      {(isCreatingLesson || editingLessonId) && (
                        <div className="p-4 border border-white/10 rounded bg-black/40 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="text-xs text-white/50 mb-1 block">Lesson Title</label>
                              <Input 
                                value={lessonFormData.title} 
                                onChange={(e) => setLessonFormData({...lessonFormData, title: e.target.value})}
                                className="bg-black border-white/10 h-9"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-white/50 mb-1 block">Video URL (or path)</label>
                              <Input 
                                value={lessonFormData.video_url} 
                                onChange={(e) => setLessonFormData({...lessonFormData, video_url: e.target.value})}
                                className="bg-black border-white/10 h-9"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-white/50 mb-1 block">Duration (min)</label>
                                <Input 
                                  type="number" 
                                  value={lessonFormData.duration_minutes} 
                                  onChange={(e) => setLessonFormData({...lessonFormData, duration_minutes: parseInt(e.target.value) || 0})}
                                  className="bg-black border-white/10 h-9"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-white/50 mb-1 block">Order Index</label>
                                <Input 
                                  type="number" 
                                  value={lessonFormData.order_index} 
                                  onChange={(e) => setLessonFormData({...lessonFormData, order_index: parseInt(e.target.value) || 0})}
                                  className="bg-black border-white/10 h-9"
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-xs text-white/50 mb-1 block">Description</label>
                              <textarea 
                                value={lessonFormData.description} 
                                onChange={(e) => setLessonFormData({...lessonFormData, description: e.target.value})}
                                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveLesson}><Save className="h-4 w-4 mr-2" /> Save Lesson</Button>
                            <Button size="sm" variant="ghost" onClick={() => {setIsCreatingLesson(false); setEditingLessonId(null)}}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                          </div>
                        </div>
                      )}

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

function StatCard({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
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

function CourseAdminCard({ course, stats, onEdit, onDelete, onManageLessons, isManagingLessons }: { 
  course: Course, 
  stats?: CourseStats, 
  onEdit: () => void, 
  onDelete: () => void,
  onManageLessons: () => void,
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
              <Button size="icon" variant="ghost" onClick={onEdit} className="text-white/40 hover:text-white"><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={onDelete} className="text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div><p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Lessons</p><p className="text-sm font-medium">{course.lessons_count}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Duration</p><p className="text-sm font-medium">{course.duration_minutes}m</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Enrolled</p><p className="text-sm font-medium">{stats?.enrollments || 0}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Completion</p><p className="text-sm font-medium">{stats?.completionRate || 0}%</p></div>
          </div>
          <div className="mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onManageLessons}
              className={`border-white/10 hover:bg-white/5 ${isManagingLessons ? 'bg-white/10 border-white/20' : ''}`}
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
