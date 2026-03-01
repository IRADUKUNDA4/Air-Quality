import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const district = searchParams.get("district")

    let query = supabaseAdmin.from("monitoring_stations").select("*")

    if (status) {
      query = query.eq("status", status)
    }

    if (district) {
      query = query.eq("district", district)
    }

    const { data: stations, error } = await query.order("name", { ascending: true })

    if (error) throw error

    // Get latest reading for each station
    const stationsWithReadings = await Promise.all(
      stations?.map(async (station) => {
        const { data: latestReading } = await supabaseAdmin
          .from("air_quality_readings")
          .select("*")
          .eq("station_id", station.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single()

        return {
          ...station,
          latestReading,
        }
      }) || []
    )

    return NextResponse.json({
      success: true,
      data: stationsWithReadings,
    })
  } catch (error) {
    console.error("[v0] Stations list error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch stations" },
      { status: 500 }
    )
  }
}
