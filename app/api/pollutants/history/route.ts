import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pollutantId = searchParams.get("pollutantId")
    const days = parseInt(searchParams.get("days") || "7")

    if (!pollutantId) {
      return NextResponse.json(
        { success: false, error: "pollutantId is required" },
        { status: 400 }
      )
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: readings, error } = await supabaseAdmin
      .from("air_quality_readings")
      .select("*")
      .eq("pollutant_id", pollutantId)
      .gte("recorded_at", startDate.toISOString())
      .order("recorded_at", { ascending: true })

    if (error) throw error

    // Calculate statistics
    const values = readings?.map((r) => r.concentration_value) || []
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const min = values.length > 0 ? Math.min(...values) : 0

    return NextResponse.json({
      success: true,
      data: {
        readings,
        statistics: {
          average: parseFloat(avg.toFixed(2)),
          maximum: parseFloat(max.toFixed(2)),
          minimum: parseFloat(min.toFixed(2)),
          dataPoints: readings?.length || 0,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Pollutant history error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch pollutant history" },
      { status: 500 }
    )
  }
}
