import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { data: pollutants, error } = await supabaseAdmin
      .from("pollutants")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: pollutants,
    })
  } catch (error) {
    console.error("[v0] Pollutants list error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch pollutants" },
      { status: 500 }
    )
  }
}
