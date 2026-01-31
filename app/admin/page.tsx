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
  BookOpen
} from "lucide-react"
import {
  getAllCoursesAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStats
} from "@/lib/supabaseApi"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Editing course",
    image_url: "",
    difficulty: "Beginner",
    duration_minutes: 0,
  })

  // Check admin access
  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    // In production, check if user has admin role
    // For now, allow access if logged in
    loadCourses()
  }

  async function loadCourses() {
    setLoading(true)
    const { data } = await getAllCoursesAdmin()
    
    if (data) {
      setCourses(data)
      
      // Load stats for each course
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
  const totalCompletions = Object.values(stats).reduce((sum, s) => sum + s.completions, 0)
  const avgCompletionRate = stats && Object.keys(stats).length > 0
    ? Math.round(Object.values(stats).reduce((sum, s) => sum + s.completionRate, 0) / Object.keys(stats).length)
    : 0

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl lg:text-2xl font-bold">Admin Dashboard</h1>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Total Courses"
            value={courses.length}
          />
          <StatCard
            icon={Users}
            label="Total Enrollments"
            value={totalEnrollments}
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Completion Rate"
            value={`${avgCompletionRate}%`}
          />
        </div>

        {/* Create New Button */}
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

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="mb-8 p-6 border border-white/10 rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold mb-4">
              {isCreating ? "Create New Course" : "Edit Course"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Course title"
                  className="bg-black border-white/10"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-black border border-white/10 text-white"
                >
                  <option value="Editing course">Editing course</option>
                  <option value="Motion Graphics">Motion Graphics</option>
                  <option value="Color Grading">Color Grading</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-black border border-white/10 text-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="120"
                  className="bg-black border-white/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Image URL</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/images/course-preview.jpg"
                  className="bg-black border-white/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description"
                  rows={4}
                  className="w-full px-3 py-2 rounded-md bg-black border border-white/10 text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleCancelEdit} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Courses</h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              No courses yet. Create your first course!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {courses.map((course) => (
                <CourseAdminCard
                  key={course.id}
                  course={course}
                  stats={stats[course.id]}
                  onEdit={() => handleEdit(course)}
                  onDelete={() => handleDelete(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
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
  onDelete
}: {
  course: Course
  stats?: CourseStats
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="p-6 border border-white/10 rounded-lg bg-white/5 hover:border-white/20 transition">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image */}
        <div className="w-full lg:w-48 aspect-video bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <h4 className="text-lg font-semibold mb-1">{course.title}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-white/5 text-white/50">
                  {course.category}
                </span>
                <span className="px-2 py-1 rounded-full bg-white/5 text-white/50">
                  {course.difficulty}
                </span>
                <span className={`px-2 py-1 rounded-full ${
                  course.is_published ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {course.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="h-8 px-3"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className="h-8 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-white/60 mb-4 line-clamp-2">{course.description}</p>

          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-white/50">Enrollments: </span>
                <span className="text-white font-medium">{stats.enrollments}</span>
              </div>
              <div>
                <span className="text-white/50">Completions: </span>
                <span className="text-white font-medium">{stats.completions}</span>
              </div>
              <div>
                <span className="text-white/50">Completion Rate: </span>
                <span className="text-white font-medium">{stats.completionRate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}