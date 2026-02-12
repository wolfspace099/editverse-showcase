"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, notFound } from "next/navigation"
import { GeistSans } from "geist/font/sans"
import { BadgeCheck, BookOpen, ChevronDown, ChevronUp, Edit2, Plus, Save, Shield, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  addAdminEmail,
  approveApplication,
  createCourse,
  createCourseChapter,
  createLesson,
  deleteCourse,
  deleteCourseChapter,
  deleteLesson,
  getAdminEmails,
  getAllApplications,
  getAllCoursesAdmin,
  getApplicationStats,
  getCourseChapters,
  getCourseLessons,
  getCourseStats,
  getCurrentUserIsAdmin,
  rejectApplication,
  removeAdminEmail,
  updateCourse,
  updateCourseChapter,
  updateLesson,
  type AdminEmail,
  type Application,
} from "@/lib/supabaseApi"

type Chapter = { id: string; title: string; order_index: number; course_id: string }
type Lesson = { id: string; title: string; description: string; video_url: string; duration_minutes: number; order_index: number; chapter_id: string | null; course_id: string }
type Course = { id: string; title: string; description: string; category: string; image_url: string; difficulty: string; duration_minutes: number; lessons_count: number; is_published: boolean; order_index: number }
type CourseStats = { enrollments: number; completions: number; completionRate: number }
type AdminTab = "admin" | "courses" | "applications"
type ApplicationStatusFilter = "all" | "pending" | "approved" | "rejected"
type ApplicationStats = { pending: number; approved: number; rejected: number; total: number }

const EMPTY_COURSE = { title: "", description: "", category: "Editing course", image_url: "", difficulty: "Beginner", duration_minutes: 0, order_index: 0, is_published: false }
const EMPTY_LESSON = { title: "", description: "", video_url: "", duration_minutes: 0, order_index: 0, chapter_id: null as string | null }
const EMPTY_APPLICATION_STATS: ApplicationStats = { pending: 0, approved: 0, rejected: 0, total: 0 }

export default function AdminPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [activeTab, setActiveTab] = useState<AdminTab>("admin")
  const [checking, setChecking] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([])
  const [adminEmailInput, setAdminEmailInput] = useState("")
  const [adminEmailBusy, setAdminEmailBusy] = useState(false)
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null)

  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Record<string, CourseStats>>({})
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE)

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [chapterForm, setChapterForm] = useState({ title: "", order_index: 0 })
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON)

  const [applications, setApplications] = useState<Application[]>([])
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>(EMPTY_APPLICATION_STATS)
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<ApplicationStatusFilter>("all")
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return void router.push("/login")

      const { data: isAdmin, error } = await getCurrentUserIsAdmin()
      if (error || !isAdmin) return void notFound()

      setUserEmail(session.user.email ?? null)
      setUserId(session.user.id ?? null)
      await Promise.all([loadCourses(true), loadAdminEmails(), loadApplications("all", true)])
      setChecking(false)
    })()
  }, [])

  async function loadCourses(showInitialLoader = false) {
    if (showInitialLoader) setInitialLoading(true)
    else setRefreshing(true)

    const { data, error } = await getAllCoursesAdmin()
    if (error) {
      if (showInitialLoader) setInitialLoading(false)
      else setRefreshing(false)
      return void alert("Failed to load courses.")
    }

    const rows = data || []
    setCourses(rows)
    const entries = await Promise.all(rows.map(async (c) => [c.id, await getCourseStats(c.id)] as const))
    setStats(Object.fromEntries(entries))

    if (showInitialLoader) setInitialLoading(false)
    else setRefreshing(false)
  }

  async function loadApplications(status: ApplicationStatusFilter = "all", showLoader = false) {
    if (showLoader) setApplicationsLoading(true)
    const selectedStatus = status === "all" ? undefined : status
    const [{ data, error }, statsData] = await Promise.all([getAllApplications(selectedStatus), getApplicationStats()])
    if (error) {
      if (showLoader) setApplicationsLoading(false)
      return void alert("Failed to load applications.")
    }
    setApplications(data || [])
    setApplicationStats(statsData)
    setApplicationStatusFilter(status)
    if (showLoader) setApplicationsLoading(false)
  }

  async function loadAdminEmails() {
    const { data, error } = await getAdminEmails()
    if (error) return
    setAdminEmails(data || [])
  }

  async function handleAddAdminEmail() {
    const email = adminEmailInput.trim().toLowerCase()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!isEmail) return void alert("Please enter a valid email.")

    setAdminEmailBusy(true)
    const { error } = await addAdminEmail(email)
    setAdminEmailBusy(false)

    if (error) return void alert(error.message || "Failed to add admin email.")
    setAdminEmailInput("")
    await loadAdminEmails()
  }

  async function handleRemoveAdmin(emailRow: AdminEmail) {
    const current = userEmail?.toLowerCase() || ""
    if (emailRow.email.toLowerCase() === current) {
      return void alert("You cannot remove your own admin access.")
    }

    setRemovingAdminId(emailRow.id)
    const { error } = await removeAdminEmail(emailRow.id)
    setRemovingAdminId(null)

    if (error) return void alert(error.message || "Failed to remove admin email.")
    await loadAdminEmails()
  }

  async function handleApproveApplication(applicationId: string) {
    if (!userId) return void alert("Could not identify admin user.")
    setReviewingApplicationId(applicationId)
    const { error } = await approveApplication(applicationId, userId)
    setReviewingApplicationId(null)
    if (error) return void alert(error.message || "Failed to approve application.")
    await loadApplications(applicationStatusFilter)
  }

  async function handleRejectApplication(applicationId: string) {
    if (!userId) return void alert("Could not identify admin user.")
    const reason = (rejectionReasons[applicationId] || "").trim()
    if (!reason) return void alert("Please add a rejection reason.")
    setReviewingApplicationId(applicationId)
    const { error } = await rejectApplication(applicationId, userId, reason)
    setReviewingApplicationId(null)
    if (error) return void alert(error.message || "Failed to reject application.")
    setRejectionReasons((prev) => ({ ...prev, [applicationId]: "" }))
    await loadApplications(applicationStatusFilter)
  }

  async function loadLessons(courseId: string) {
    setLessonLoading(true)
    const [{ data: lessonData }, { data: chapterData }] = await Promise.all([getCourseLessons(courseId), getCourseChapters(courseId)])
    setLessons((lessonData || []).sort((a, b) => a.order_index - b.order_index))
    setChapters((chapterData || []).sort((a, b) => a.order_index - b.order_index))
    setLessonLoading(false)
  }

  async function saveCourse() {
    if (!courseForm.title.trim() || !courseForm.description.trim()) return void alert("Title and description are required")
    const res = creatingCourse ? await createCourse(courseForm) : editingCourseId ? await updateCourse(editingCourseId, courseForm) : null
    if (res?.error) return void alert(res.error.message || "Failed to save course.")
    setCreatingCourse(false)
    setEditingCourseId(null)
    setCourseForm(EMPTY_COURSE)
    await loadCourses()
  }

  async function saveChapter() {
    if (!selectedCourseId || !chapterForm.title.trim()) return void alert("Chapter title is required")
    try {
      if (editingChapterId) await updateCourseChapter(editingChapterId, chapterForm)
      else await createCourseChapter({ ...chapterForm, course_id: selectedCourseId })
    } catch {
      return void alert("Failed to save chapter.")
    }
    setEditingChapterId(null)
    setChapterForm({ title: "", order_index: 0 })
    await loadLessons(selectedCourseId)
  }

  async function saveLesson() {
    if (!selectedCourseId) return
    if (!lessonForm.title.trim()) return void alert("Lesson title is required")
    if (!lessonForm.video_url.trim()) return void alert("Video URL is required")
    const res = creatingLesson ? await createLesson({ ...lessonForm, course_id: selectedCourseId }) : editingLessonId ? await updateLesson(editingLessonId, lessonForm) : null
    if (res?.error) return void alert("Failed to save lesson.")
    setCreatingLesson(false)
    setEditingLessonId(null)
    setLessonForm(EMPTY_LESSON)
    await loadLessons(selectedCourseId)
    await loadCourses()
  }

  const byChapter = useMemo(() => chapters.reduce((acc, c) => ({ ...acc, [c.id]: lessons.filter((l) => l.chapter_id === c.id) }), {} as Record<string, Lesson[]>), [chapters, lessons])
  const unassigned = useMemo(() => lessons.filter((l) => !l.chapter_id), [lessons])
  const totalEnrollments = Object.values(stats).reduce((s, v) => s + v.enrollments, 0)
  const avgCompletionRate = courses.length ? Math.round(Object.values(stats).reduce((s, v) => s + v.completionRate, 0) / courses.length) : 0

  if (checking || initialLoading) return <div className={`${GeistSans.className} min-h-screen bg-black text-white flex items-center justify-center`}><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-r-white" /></div>

  return (
    <div className={`${GeistSans.className} min-h-screen bg-black text-white`}>
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <span className="px-2 py-1 text-xs rounded-full border border-white/20 bg-white/10 flex items-center gap-1"><BadgeCheck className="h-3 w-3" />Admin</span>
              {userEmail && <span className="text-xs text-white/50">({userEmail})</span>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => router.push("/dashboard")}>Back</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await supabase.auth.signOut(); router.push("/login") }}>Sign Out</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeTab === "admin" ? "default" : "outline"} onClick={() => setActiveTab("admin")}>Admin</Button>
            <Button size="sm" variant={activeTab === "courses" ? "default" : "outline"} onClick={() => setActiveTab("courses")}>Courses</Button>
            <Button size="sm" variant={activeTab === "applications" ? "default" : "outline"} onClick={() => setActiveTab("applications")}>Applications</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {activeTab === "admin" && (
          <div className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/80"><Shield className="h-4 w-4" />Admin Emails</div>
            <div className="flex gap-2">
              <Input placeholder="admin@example.com" value={adminEmailInput} onChange={(e) => setAdminEmailInput(e.target.value)} />
              <Button onClick={handleAddAdminEmail} disabled={adminEmailBusy || !adminEmailInput.trim()}>{adminEmailBusy ? "Adding..." : "Add Admin"}</Button>
            </div>
            <div className="space-y-2">
              {adminEmails.length === 0 ? <p className="text-xs text-white/50">No admin emails configured.</p> : adminEmails.map((row) => (
                <div key={row.id} className="flex items-center justify-between border border-white/10 rounded px-3 py-2">
                  <div className="text-sm">{row.email}{row.email.toLowerCase() === (userEmail?.toLowerCase() || "") ? " (you)" : ""}</div>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveAdmin(row)} disabled={removingAdminId === row.id || row.email.toLowerCase() === (userEmail?.toLowerCase() || "")}>{removingAdminId === row.id ? "Removing..." : "Remove"}</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <StatCard icon={BookOpen} label="Total Courses" value={courses.length} />
              <StatCard icon={Users} label="Total Enrollments" value={totalEnrollments} />
              <StatCard icon={Users} label="Avg Completion Rate" value={`${avgCompletionRate}%`} />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => { setCreatingCourse(true); setEditingCourseId(null); setCourseForm(EMPTY_COURSE) }} className="bg-white text-black"><Plus className="h-4 w-4 mr-2" />Create New Course</Button>
              <Button variant="outline" onClick={() => loadCourses()} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh"}</Button>
            </div>

            {(creatingCourse || editingCourseId) && (
              <div className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
                <h3 className="font-semibold">{creatingCourse ? "Create Course" : "Edit Course"}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <LabeledInput label="Title" value={courseForm.title} onChange={(v) => setCourseForm({ ...courseForm, title: v })} />
                  <LabeledInput label="Image URL" value={courseForm.image_url} onChange={(v) => setCourseForm({ ...courseForm, image_url: v })} />
                  <LabeledInput label="Category" value={courseForm.category} onChange={(v) => setCourseForm({ ...courseForm, category: v })} />
                  <LabeledInput label="Difficulty" value={courseForm.difficulty} onChange={(v) => setCourseForm({ ...courseForm, difficulty: v })} />
                  <LabeledInput label="Duration" value={String(courseForm.duration_minutes)} type="number" onChange={(v) => setCourseForm({ ...courseForm, duration_minutes: Number(v || 0) })} />
                  <LabeledInput label="Order" value={String(courseForm.order_index)} type="number" onChange={(v) => setCourseForm({ ...courseForm, order_index: Number(v || 0) })} />
                  <div className="md:col-span-2"><label className="text-xs text-white/60">Description</label><Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
                  <div className="md:col-span-2 flex items-center gap-2"><input id="published" type="checkbox" checked={courseForm.is_published} onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })} /><label htmlFor="published">Published</label></div>
                </div>
                <div className="flex gap-2"><Button onClick={saveCourse}><Save className="h-4 w-4 mr-2" />Save Course</Button><Button variant="outline" onClick={() => { setCreatingCourse(false); setEditingCourseId(null); setCourseForm(EMPTY_COURSE) }}>Cancel</Button></div>
              </div>
            )}

            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
                  <div className="flex justify-between gap-3">
                    <div><h3 className="font-semibold">{course.title}</h3><p className="text-sm text-white/60">{course.description}</p><p className="text-xs text-white/50 mt-1">{course.category} | {course.difficulty} | {course.duration_minutes}m | Lessons: {course.lessons_count} | Enrolled: {stats[course.id]?.enrollments || 0}</p></div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingCourseId(course.id); setCreatingCourse(false); setCourseForm({ title: course.title, description: course.description, category: course.category, image_url: course.image_url, difficulty: course.difficulty, duration_minutes: course.duration_minutes, order_index: course.order_index, is_published: course.is_published }) }}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={async () => { if (!confirm("Delete this course?")) return; const { error } = await deleteCourse(course.id); if (error) return void alert(error.message || "Failed to delete course."); if (selectedCourseId === course.id) setSelectedCourseId(null); await loadCourses() }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={async () => { if (selectedCourseId === course.id) return void setSelectedCourseId(null); setSelectedCourseId(course.id); await loadLessons(course.id) }}>{selectedCourseId === course.id ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}Manage Lessons</Button>

                  {selectedCourseId === course.id && (
                    <div className="border border-white/10 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between"><h4 className="font-semibold">Lessons Management</h4><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingChapterId(null); setChapterForm({ title: "", order_index: chapters.length }) }}>Add Chapter</Button><Button size="sm" onClick={() => { setCreatingLesson(true); setEditingLessonId(null); setLessonForm({ ...EMPTY_LESSON, order_index: lessons.length }) }}>Add Lesson</Button></div></div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Chapter</h5>
                          <label className="text-xs text-white/60">Chapter Title</label>
                          <Input value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} />
                          <label className="text-xs text-white/60">Order</label>
                          <Input type="number" value={chapterForm.order_index} onChange={(e) => setChapterForm({ ...chapterForm, order_index: Number(e.target.value || 0) })} />
                          <Button size="sm" onClick={saveChapter}>Save Chapter</Button>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Lesson</h5>
                          <label className="text-xs text-white/60">Lesson Title</label>
                          <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
                          <label className="text-xs text-white/60">Video URL</label>
                          <Input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} />
                          <label className="text-xs text-white/60">Duration</label>
                          <Input type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: Number(e.target.value || 0) })} />
                          <label className="text-xs text-white/60">Order</label>
                          <Input type="number" value={lessonForm.order_index} onChange={(e) => setLessonForm({ ...lessonForm, order_index: Number(e.target.value || 0) })} />
                          <label className="text-xs text-white/60">Chapter</label>
                          <select className="h-10 rounded-md bg-transparent border border-white/20 px-3 text-sm w-full" value={lessonForm.chapter_id ?? ""} onChange={(e) => setLessonForm({ ...lessonForm, chapter_id: e.target.value || null })}><option value="">Unassigned</option>{chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
                          <Button size="sm" onClick={saveLesson}>Save Lesson</Button>
                        </div>
                      </div>

                      {lessonLoading ? <p className="text-sm text-white/60">Loading...</p> : (
                        <div className="space-y-3">
                          {chapters.map((ch) => (
                            <div key={ch.id} className="border border-white/10 rounded p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div><p className="font-medium">{ch.title}</p><p className="text-xs text-white/50">Order: {ch.order_index}</p></div>
                                <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditingChapterId(ch.id); setChapterForm({ title: ch.title, order_index: ch.order_index }) }}><Edit2 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { if (!confirm("Delete chapter?")) return; const { error } = await deleteCourseChapter(ch.id); if (error) return void alert("Failed to delete chapter."); if (selectedCourseId) await loadLessons(selectedCourseId) }}><Trash2 className="h-4 w-4" /></Button></div>
                              </div>
                              <div className="space-y-1">{(byChapter[ch.id] || []).map((l) => <LessonRow key={l.id} lesson={l} onEdit={(x) => { setEditingLessonId(x.id); setCreatingLesson(false); setLessonForm({ title: x.title, description: x.description, video_url: x.video_url, duration_minutes: x.duration_minutes, order_index: x.order_index, chapter_id: x.chapter_id }) }} onDelete={async (id) => { if (!confirm("Delete lesson?")) return; const { error } = await deleteLesson(id); if (error) return void alert("Failed to delete lesson."); if (selectedCourseId) { await loadLessons(selectedCourseId); await loadCourses() } }} />)}</div>
                            </div>
                          ))}
                          <div className="border border-dashed border-white/10 rounded p-3"><p className="font-medium mb-2">Unassigned Lessons</p><div className="space-y-1">{unassigned.map((l) => <LessonRow key={l.id} lesson={l} onEdit={(x) => { setEditingLessonId(x.id); setCreatingLesson(false); setLessonForm({ title: x.title, description: x.description, video_url: x.video_url, duration_minutes: x.duration_minutes, order_index: x.order_index, chapter_id: x.chapter_id }) }} onDelete={async (id) => { if (!confirm("Delete lesson?")) return; const { error } = await deleteLesson(id); if (error) return void alert("Failed to delete lesson."); if (selectedCourseId) { await loadLessons(selectedCourseId); await loadCourses() } }} />)}</div></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "applications" && (
          <>
            <div className="grid md:grid-cols-4 gap-3">
              <StatCard icon={Users} label="All Applications" value={applicationStats.total} />
              <StatCard icon={Users} label="Pending" value={applicationStats.pending} />
              <StatCard icon={Users} label="Approved" value={applicationStats.approved} />
              <StatCard icon={Users} label="Rejected" value={applicationStats.rejected} />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <Button key={status} size="sm" variant={applicationStatusFilter === status ? "default" : "outline"} onClick={() => loadApplications(status)}>{status[0].toUpperCase() + status.slice(1)}</Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => loadApplications(applicationStatusFilter)} disabled={applicationsLoading}>{applicationsLoading ? "Refreshing..." : "Refresh"}</Button>
            </div>

            <div className="space-y-3">
              {applications.length === 0 && <div className="border border-white/10 rounded-lg p-4 bg-white/5 text-sm text-white/60">No applications found for this filter.</div>}
              {applications.map((application) => {
                const reason = rejectionReasons[application.id] || ""
                const isPending = application.status === "pending"
                const isReviewing = reviewingApplicationId === application.id
                return (
                  <div key={application.id} className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{application.full_name}</h3>
                        <p className="text-sm text-white/60">{application.experience_level}{application.age ? ` | ${application.age} years old` : ""}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full border ${application.status === "approved" ? "border-green-400/40 text-green-300 bg-green-400/10" : application.status === "rejected" ? "border-red-400/40 text-red-300 bg-red-400/10" : "border-yellow-400/40 text-yellow-300 bg-yellow-400/10"}`}>{application.status}</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p><span className="text-white/50">Why join:</span> {application.why_join}</p>
                      {application.portfolio_url && <p><span className="text-white/50">Portfolio:</span> <a className="underline" href={application.portfolio_url} target="_blank" rel="noreferrer">{application.portfolio_url}</a></p>}
                      <p className="text-white/50">Submitted: {new Date(application.submitted_at).toLocaleString()}</p>
                      {application.reviewed_at && <p className="text-white/50">Reviewed: {new Date(application.reviewed_at).toLocaleString()}</p>}
                      {application.rejection_reason && <p><span className="text-white/50">Rejection reason:</span> {application.rejection_reason}</p>}
                    </div>

                    {isPending && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Rejection reason (required for reject)"
                          value={reason}
                          onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [application.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveApplication(application.id)} disabled={isReviewing}>{isReviewing ? "Saving..." : "Approve"}</Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectApplication(application.id)} disabled={isReviewing || !reason.trim()}>{isReviewing ? "Saving..." : "Reject"}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function LabeledInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <div><label className="text-xs text-white/60">{label}</label><Input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div>
}

function LessonRow({ lesson, onEdit, onDelete }: { lesson: Lesson; onEdit: (lesson: Lesson) => void; onDelete: (id: string) => void }) {
  return <div className="flex items-center justify-between border border-white/10 rounded px-3 py-2"><div><p className="text-sm">{lesson.title}</p><p className="text-xs text-white/50">{lesson.duration_minutes} min</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => onEdit(lesson)}><Edit2 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => onDelete(lesson.id)}><Trash2 className="h-4 w-4" /></Button></div></div>
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <div className="border border-white/10 rounded-lg p-4 bg-white/5"><div className="text-sm text-white/60 flex gap-2 items-center"><Icon className="h-4 w-4" />{label}</div><p className="text-2xl font-bold mt-1">{value}</p></div>
}
