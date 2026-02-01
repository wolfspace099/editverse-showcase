import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  console.log("=== Auth Callback Debug ===")
  console.log("Code:", code ? "present" : "missing")
  console.log("Error:", error)
  console.log("Error Description:", error_description)

  if (error) {
    console.error("OAuth error:", error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  if (!code) {
    console.error("No code in callback")
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
  }

  // Create response with proper cookie handling
  const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          } catch (error) {
            console.error("Error setting cookie:", error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          } catch (error) {
            console.error("Error removing cookie:", error)
          }
        },
      },
    }
  )

  try {
    console.log("Exchanging code for session...")
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Exchange error:", exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (!data.session) {
      console.error("No session returned from exchange")
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=no_session`
      )
    }

    console.log("Session created for user:", data.session.user.id)

    // Initialize user stats if they don't exist
    const { error: statsError } = await supabase
      .from("user_stats")
      .upsert(
        {
          user_id: data.session.user.id,
          total_points: 0,
          skill_level: "Beginner",
          current_level: 1,
          max_level: 5,
          courses_completed: 0,
          courses_in_progress: 0,
          total_watch_time_minutes: 0,
          streak_days: 0,
          last_activity_date: new Date().toISOString().split('T')[0],
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      )

    if (statsError) {
      console.error("Stats creation error:", statsError)
      // Don't fail auth if stats creation fails
    }

    return response
  } catch (err) {
    console.error("Callback exception:", err)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent("Authentication failed")}`
    )
  }
}