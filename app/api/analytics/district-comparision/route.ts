import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: aqiData, error } = await supabaseAdmin
      .from("aqi_calculations")
      .select("*")
      .gte("recorded_at", startDate.toISOString())

    if (error) throw error

    // Group by district
    const districtData = aqiData?.reduce(
      (acc: Record<string, number[]>, item: any) => {
        const district = item.district || "Unknown"
        if (!acc[district]) {
          acc[district] = []
        }
        acc[district].push(item.aqi_value)
        return acc
      },
      {} as Record<string, number[]>
    ) || {}

    const comparisonData = Object.entries(districtData).map(([district, values]: [string, number[]]) => ({
      name: district,
      aqi: parseFloat((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2)),
      readings: values.length,
      max: Math.max(...values),
      min: Math.min(...values),
    }))

    return NextResponse.json({
      success: true,
      data: comparisonData.sort((a, b) => b.aqi - a.aqi),
    })
  } catch (error) {
    console.error("[v0] District comparison error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch district comparison" },
      { status: 500 }
    )
  }
}
