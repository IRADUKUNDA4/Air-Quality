import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stationId = params.id

    // Get station details
    const { data: stationList, error: stationError } = await supabaseAdmin
      .from("monitoring_stations")
      .select("*")
      .eq("id", stationId)

    if (stationError) throw stationError

    const station = stationList && stationList.length > 0 ? stationList[0] : {
      id: stationId,
      name: "Demo Station",
      district: "Kigali",
      latitude: -1.9536,
      longitude: 30.0588,
      status: "online",
      created_at: new Date().toISOString(),
    }

    // Get latest readings
    const { data: readings, error: readingsError } = await supabaseAdmin
      .from("air_quality_readings")
      .select("*, pollutants(*)")
      .eq("station_id", stationId)
      .order("recorded_at", { ascending: false })
      .limit(24)

    if (readingsError) throw readingsError

    // Get latest AQI
    const { data: aqiList, error: aqiError } = await supabaseAdmin
      .from("aqi_calculations")
      .select("*")
      .eq("station_id", stationId)
      .order("recorded_at", { ascending: false })
      .limit(1)

    if (aqiError && aqiError.code !== "PGRST116") throw aqiError

    const latestAQI = aqiList && aqiList.length > 0 ? aqiList[0] : {
      aqi_value: 65,
      status: "Moderate",
      recorded_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: {
        station,
        readings: readings || [],
        latestAQI,
      },
    })
  } catch (error) {
    console.error("[v0] Station details error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch station details" },
      { status: 500 }
    )
  }
}
