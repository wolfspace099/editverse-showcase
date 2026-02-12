export const COURSE_CATEGORIES = ["All", "Editing course", "Motion Graphics", "Color Grading", "Audio"] as const
export const COURSE_DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"] as const

export const COURSE_CATEGORY_OPTIONS = COURSE_CATEGORIES.filter((value) => value !== "All")
export const COURSE_DIFFICULTY_OPTIONS = COURSE_DIFFICULTIES.filter((value) => value !== "All")
