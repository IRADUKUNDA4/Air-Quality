import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    const district = searchParams.get("district")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabaseAdmin
      .from("aqi_calculations")
      .select("*")
      .gte("recorded_at", startDate.toISOString())

    if (district) {
      query = query.eq("district", district)
    }

    const { data: aqiData, error } = await query.order("recorded_at", { ascending: true })

    if (error) throw error

    // Calculate statistics
    const values = aqiData?.map((d) => d.aqi_value) || []
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const max = values.length > 0 ? Math.max(...values) : 0
    const min = values.length > 0 ? Math.min(...values) : 0

    // Group by day
    const dailyData = aqiData?.reduce(
      (acc: Record<string, number[]>, item: any) => {
        const date = new Date(item.recorded_at).toLocaleDateString()
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(item.aqi_value)
        return acc
      },
      {} as Record<string, number[]>
    ) || {}

    const chartData = Object.entries(dailyData).map(([date, values]: [string, number[]]) => ({
      date,
      average: parseFloat((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2)),
      max: Math.max(...values),
      min: Math.min(...values),
    }))

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          average: parseFloat(avg.toFixed(2)),
          maximum: parseFloat(max.toFixed(2)),
          minimum: parseFloat(min.toFixed(2)),
          dataPoints: aqiData?.length || 0,
          days,
        },
        chartData,
      },
    })
  } catch (error) {
    console.error("[v0] Analytics summary error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics summary" },
      { status: 500 }
    )
  }
}
