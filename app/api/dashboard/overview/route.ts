import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get latest AQI for dashboard
    const { data: latestAQIList, error: aqiError } = await supabaseAdmin
      .from("aqi_calculations")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(1)

    if (aqiError) throw aqiError

    const latestAQI = latestAQIList && latestAQIList.length > 0 ? latestAQIList[0] : {
      aqi_value: 65,
      status: "Moderate",
      district: "Kigali",
      recorded_at: new Date().toISOString(),
    }

    // Get recent alerts
    const { data: recentAlerts, error: alertsError } = await supabaseAdmin
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (alertsError) throw alertsError

    // Get pollutant levels
    const { data: pollutants, error: pollutantsError } = await supabaseAdmin
      .from("pollutants")
      .select("*")

    if (pollutantsError) throw pollutantsError

    // Get latest readings for trend
    const { data: latestReadings, error: readingsError } = await supabaseAdmin
      .from("air_quality_readings")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(12)

    if (readingsError) throw readingsError

    // Get monitoring stations count
    const { data: stations, error: stationsError } = await supabaseAdmin
      .from("monitoring_stations")
      .select("id, status")

    if (stationsError) throw stationsError

    const onlineStations = stations?.filter(s => s.status === "online").length || 0
    const offlineStations = stations?.filter(s => s.status === "offline").length || 0

    return NextResponse.json({
      success: true,
      data: {
        currentAQI: latestAQI,
        recentAlerts: recentAlerts || [],
        pollutants: pollutants || [],
        trendData: latestReadings || [],
        stationStats: {
          total: stations?.length || 0,
          online: onlineStations,
          offline: offlineStations,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Dashboard overview error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
