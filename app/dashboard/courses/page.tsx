"use client"

import { useState, useEffect } from "react"
import { GeistSans } from "geist/font/sans"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Filter,
  Clock,
  Play,
  Grid3x3,
  List,
  ArrowRight,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { getAllCourses, getUserProgress } from "@/lib/supabaseApi"
import { getSupabaseClient } from "@/lib/supabaseClient"

const categories = ["All", "Editing course", "Motion Graphics", "Color Grading", "Audio"]
const difficulties = ["All", "Beginner", "Intermediate", "Advanced"]

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
  last_accessed_at: string
  courses: Course
}

export default function CoursesPage() {
  const supabase = getSupabaseClient()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  
  const [courses, setCourses] = useState<Course[]>([])
  const [continueLearning, setContinueLearning] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

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
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Load courses and user progress
  useEffect(() => {
    loadData()
  }, [selectedCategory, selectedDifficulty, searchQuery, userId])

  async function loadData() {
    setLoading(true)
    
    const filters: any = {}
    if (selectedCategory !== "All") filters.category = selectedCategory
    if (selectedDifficulty !== "All") filters.difficulty = selectedDifficulty
    if (searchQuery) filters.search = searchQuery

    const { data: coursesData } = await getAllCourses(filters)
    setCourses(coursesData || [])

    if (userId) {
      const { data: progressData } = await getUserProgress(userId)
      const inProgress = progressData?.filter(p => 
        p.progress_percentage > 0 && p.progress_percentage < 100
      ) || []
      setContinueLearning(inProgress)
    }

    setLoading(false)
  }

  const filteredCourses = courses

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
      <Header currentView="courses" />

      <main className="pt-32 lg:pt-48 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          
          {/* Continue Learning Section */}
          {continueLearning.length > 0 && (
            <div className="mb-12 lg:mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-semibold">Continue Learning</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white/60 hover:text-white text-sm"
                >
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {continueLearning.slice(0, 3).map((progress) => (
                  <ContinueLearningCard
                    key={progress.course_id}
                    course={progress.courses}
                    progress={progress.progress_percentage}
                    lastAccessed={progress.last_accessed_at}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8 lg:mb-10">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">All Courses</h1>
            <p className="text-white/60 text-sm lg:text-base">
              Master video editing with our comprehensive course library
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 h-11 bg-transparent border border-white/10 rounded-md text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 transition-colors hover:border-white/20"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden flex-1 h-11 border-white/10 hover:bg-white/5"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>

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
              </div>
            </div>

            <div className={`space-y-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
              <div>
                <label className="text-xs text-white/50 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm transition ${
                        selectedCategory === cat
                          ? "bg-white text-black"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-2 block">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-4 py-2 rounded-full text-sm transition ${
                        selectedDifficulty === diff
                          ? "bg-white text-black"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Courses List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/60 mb-4">No courses found</p>
              <Button 
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                  setSelectedDifficulty("All")
                }}
                variant="outline"
                className="border-white/10 hover:bg-white/5"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
                  : "grid grid-cols-1 gap-4 lg:gap-5"
              }
            >
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ContinueLearningCard({
  course,
  progress,
  lastAccessed
}: {
  course: Course
  progress: number
  lastAccessed: string
}) {
  return (
    <Link 
      href={`/dashboard/courses/${course.id}`}
      className="group border border-white/10 rounded-xl bg-black hover:border-white/20 transition-colors overflow-hidden"
    >
      <div className="aspect-[16/9] w-full bg-white/5 relative">
        <img
          src={course.image_url}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        <h3 className="text-base font-medium mb-3">
          {course.title}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{progress}% complete</span>
          </div>

          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function CourseCard({
  course,
  viewMode
}: {
  course: Course
  viewMode: "grid" | "list"
}) {
  return (
    <Link
      href={`/dashboard/courses/${course.id}`}
      className={`group border border-white/10 rounded-xl bg-black hover:border-white/20 transition-colors overflow-hidden ${
        viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"
      }`}
    >
      <div className={`${viewMode === "list" ? "sm:w-64" : "w-full aspect-[16/9]"} bg-white/5 relative flex-shrink-0`}>
        <img
          src={course.image_url}
          alt={course.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4 lg:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">
              {course.category}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">
              {course.difficulty}
            </span>
          </div>

          <h3 className="text-lg font-medium mb-2">
            {course.title}
          </h3>

          <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-2">
            {course.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {course.duration_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Play className="h-3.5 w-3.5" />
            {course.lessons_count} lessons
          </span>
        </div>
      </div>
    </Link>
  )
}
