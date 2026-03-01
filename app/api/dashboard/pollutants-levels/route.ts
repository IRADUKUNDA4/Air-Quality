import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get latest pollutant levels
    const { data: readings, error: readingsError } = await supabaseAdmin
      .from("air_quality_readings")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(6)

    if (readingsError) throw readingsError

    // Get pollutant info
    const { data: pollutants, error: pollutantsError } = await supabaseAdmin
      .from("pollutants")
      .select("*")

    if (pollutantsError) throw pollutantsError

    // Combine data
    let pollutantData = pollutants?.map((pollutant) => {
      const latestReading = readings?.find(
        (r) => r.pollutant_id === pollutant.id
      )

      return {
        name: pollutant.name,
        value: latestReading?.concentration_value || 0,
        limit: pollutant.who_guideline_limit || 0,
      }
    }) || []

    // If no data, provide demo data
    if (pollutantData.length === 0) {
      pollutantData = [
        { name: "PM2.5", value: 35, limit: 35 },
        { name: "PM10", value: 68, limit: 150 },
        { name: "O3", value: 42, limit: 100 },
        { name: "NO2", value: 28, limit: 100 },
        { name: "SO2", value: 12, limit: 75 },
        { name: "CO", value: 2.1, limit: 9 },
      ]
    }

    return NextResponse.json({
      success: true,
      data: pollutantData,
    })
  } catch (error) {
    console.error("[v0] Pollutants levels error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch pollutants levels" },
      { status: 500 }
    )
  }
}
