import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"


export async function GET() {
  try {
    const { data: thresholds, error } = await supabaseAdmin
      .from("alert_thresholds")
      .select("*")

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: thresholds,
    })
  } catch (error) {
    console.error("[v0] Alert thresholds error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch alert thresholds" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, warning_level, critical_level } = body

    const { data: threshold, error } = await supabaseAdmin
      .from("alert_thresholds")
      .update({ warning_level, critical_level })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: threshold,
    })
  } catch (error) {
    console.error("[v0] Alert threshold update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update alert threshold" },
      { status: 500 }
    )
  }
}
