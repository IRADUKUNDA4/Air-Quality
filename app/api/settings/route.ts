import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default"

    const { data: settings, error } = await supabaseAdmin
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code === "PGRST116") {
      // No settings found, return defaults
      return NextResponse.json({
        success: true,
        data: {
          user_id: userId,
          theme: "dark",
          notifications_enabled: true,
          email_alerts: true,
          units: "metric",
          refresh_interval: 5,
          watchlist_districts: [],
          created_at: new Date().toISOString(),
        },
      })
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("[v0] Settings error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, ...settings } = body

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    let result

    if (existing) {
      // Update existing settings
      const { data, error } = await supabaseAdmin
        .from("user_settings")
        .update(settings)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabaseAdmin
        .from("user_settings")
        .insert([{ user_id: userId, ...settings }])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Settings update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
