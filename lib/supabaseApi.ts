import { getSupabaseClient } from './supabaseClient'


const supabase = getSupabaseClient()

// ============= COURSES =============

export async function getAllCourses(filters?: {
  category?: string
  difficulty?: string
  search?: string
}) {
  let query = supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  return { data, error }
}

export async function getCourseById(courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      lessons (
        id,
        title,
        description,
        video_url,
        duration_minutes,
        order_index
      )
    `)
    .eq('id', courseId)
    .single()

  return { data, error }
}

export async function createCourse(course: {
  title: string
  description: string
  category: string
  image_url: string
  video_url?: string
  difficulty?: string
  duration_minutes?: number
}) {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single()

  return { data, error }
}

export async function updateCourse(courseId: string, updates: any) {
  const { data, error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single()

  return { data, error }
}

export async function deleteCourse(courseId: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  return { error }
}

// ============= LESSONS =============

export async function getCourseLessons(courseId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  return { data, error }
}

export async function createLesson(lesson: {
  course_id: string
  title: string
  description?: string
  video_url: string
  duration_minutes?: number
  order_index: number
}) {
  const { data, error } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .single()

  return { data, error }
}

export async function updateLesson(lessonId: string, updates: any) {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .select()
    .single()

  return { data, error }
}

export async function deleteLesson(lessonId: string) {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  return { error }
}

// ============= USER PROGRESS =============

export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select(`
      *,
      courses (
        id,
        title,
        description,
        image_url,
        category
      )
    `)
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false })

  return { data, error }
}

export async function getCourseProgress(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  return { data, error }
}

export async function startCourse(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      course_id: courseId,
      progress_percentage: 0,
      started_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString()
    })
    .select()
    .single()

  return { data, error }
}

export async function updateCourseProgress(
  userId: string,
  courseId: string,
  updates: {
    last_lesson_id?: string
    last_accessed_at?: string
  }
) {
  const { data, error } = await supabase
    .from('user_progress')
    .update({
      ...updates,
      last_accessed_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single()

  return { data, error }
}

// ============= LESSON COMPLETIONS =============

export async function getLessonCompletions(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('lesson_completions')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)

  return { data, error }
}

export async function markLessonComplete(
  userId: string,
  lessonId: string,
  courseId: string
) {
  const { data, error } = await supabase
    .from('lesson_completions')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  return { data, error }
}

export async function unmarkLessonComplete(userId: string, lessonId: string) {
  const { error } = await supabase
    .from('lesson_completions')
    .delete()
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)

  return { error }
}

// ============= USER STATS =============

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  // If user stats don't exist, create them
  if (error && error.code === 'PGRST116') {
    const { data: newData, error: createError } = await supabase
      .from('user_stats')
      .insert({ user_id: userId })
      .select()
      .single()

    return { data: newData, error: createError }
  }

  return { data, error }
}

export async function updateUserStats(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('user_stats')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  return { data, error }
}

// ============= ADMIN FUNCTIONS =============

type Chapter = {
  id: string
  title: string
  order_index: number
}


export async function getAllCoursesAdmin() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('order_index', { ascending: true })

  return { data, error }
}

export async function getCourseStats(courseId: string) {
  // Get total enrollments
  const { count: enrollments } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)

  // Get completion count
  const { count: completions } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('completed', true)

  return {
    enrollments: enrollments || 0,
    completions: completions || 0,
    completionRate: enrollments ? Math.round((completions! / enrollments) * 100) : 0
  }
}

export function getCourseChapters(courseId: string) {
  return supabase
    .from("course_chapters")
    .select("*")
    .eq("course_id", courseId)
}

export async function createCourseChapter(chapter: {
  title: string
  order_index: number
  course_id: string
}): Promise<Chapter> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("course_chapters")
    .insert(chapter)
    .select()
    .single() // make sure we get the inserted row

  if (error) throw error
  return data as Chapter
}


export async function updateCourseChapter(
  chapterId: string,
  chapter: { title: string; order_index: number }
): Promise<Chapter> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("course_chapters")
    .update(chapter)
    .eq("id", chapterId)
    .select()
    .single()

  if (error) throw error
  return data as Chapter
}


export function deleteCourseChapter(id: string) {
  return supabase
    .from("course_chapters")
    .delete()
    .eq("id", id)
}
