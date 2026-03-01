import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get AQI trend data for the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: trendData, error } = await supabaseAdmin
      .from("aqi_calculations")
      .select("*")
      .gte("recorded_at", twentyFourHoursAgo)
      .order("recorded_at", { ascending: true })

    if (error) throw error

    // Format data for chart
    let chartData = trendData?.map((item) => ({
      time: new Date(item.recorded_at).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      aqi: item.aqi_value,
      timestamp: item.recorded_at,
    })) || []

    // If no data, provide demo data
    if (chartData.length === 0) {
      chartData = Array.from({ length: 12 }, (_, i) => ({
        time: new Date(Date.now() - (12 - i) * 2 * 60 * 60 * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        aqi: Math.floor(Math.random() * 50 + 40),
        timestamp: new Date(Date.now() - (12 - i) * 2 * 60 * 60 * 1000).toISOString(),
      }))
    }

    return NextResponse.json({
      success: true,
      data: chartData,
    })
  } catch (error) {
    console.error("[v0] AQI trend error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch AQI trend" },
      { status: 500 }
    )
  }
}
