import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pollutantId = params.id

    // Get pollutant details
    const { data: pollutantList, error: pollutantError } = await supabaseAdmin
      .from("pollutants")
      .select("*")
      .eq("id", pollutantId)

    if (pollutantError) throw pollutantError

    const pollutant = pollutantList && pollutantList.length > 0 ? pollutantList[0] : {
      id: pollutantId,
      name: "Demo Pollutant",
      symbol: "PM",
      unit: "µg/m³",
      who_guideline_limit: 35,
      health_effects: "Can affect respiratory system",
      sources: "Vehicle emissions, industrial activities",
      vulnerable_groups: "Children, elderly, people with respiratory diseases",
    }

    // Get latest readings for this pollutant
    const { data: readings, error: readingsError } = await supabaseAdmin
      .from("air_quality_readings")
      .select("*")
      .eq("pollutant_id", pollutantId)
      .order("recorded_at", { ascending: false })
      .limit(100)

    if (readingsError) throw readingsError

    // Get health information
    const healthInfo = pollutant || {}

    return NextResponse.json({
      success: true,
      data: {
        pollutant,
        readings: readings || [],
        healthInfo,
      },
    })
  } catch (error) {
    console.error("[v0] Pollutant details error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch pollutant details" },
      { status: 500 }
    )
  }
}
