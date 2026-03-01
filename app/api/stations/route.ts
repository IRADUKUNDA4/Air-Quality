import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // 1. Fetch stations from database
    const { data: stations, error: stationsError } = await supabase
      .from("stations")
      .select("*")

    if (stationsError) {
      console.error("Supabase error fetching stations:", stationsError)
      return NextResponse.json({ error: stationsError.message }, { status: 500 })
    }

    if (!stations || stations.length === 0) {
      return NextResponse.json([])
    }

    const NOW = new Date().getTime()
    const OFFLINE_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes in milliseconds

    // 2. Process each station and compute real-time status
    const mappedStations = await Promise.all(
      stations.map(async (station) => {
        // Retrieve the latest sensor reading matching device_id
        const { data: readings } = await supabase
          .from("sensor_readings")
          .select("*")
          .eq("device_id", station.id)
          .order("created_at", { ascending: false })
          .limit(1)

        const latest = readings && readings.length > 0 ? readings[0] : null

        // DYNAMIC STATUS CALCULATION
        let computedStatus: "online" | "offline" | "maintenance" = "offline"

        if (station.status === "maintenance") {
          computedStatus = "maintenance"
        } else if (latest?.created_at) {
          const lastReadingTime = new Date(latest.created_at).getTime()
          const timeDifference = NOW - lastReadingTime

          // Mark online if data was received in the last 15 minutes
          if (timeDifference <= OFFLINE_THRESHOLD_MS) {
            computedStatus = "online"
          } else {
            computedStatus = "offline"
          }
        } else {
          computedStatus = "offline"
        }

        return {
          id: station.id,
          name: station.name || "Unknown Station",
          location: station.district || station.location || "Kigali",
          coordinates: {
            lat: station.latitude || -1.9403,
            lng: station.longitude || 29.8739,
          },
          status: computedStatus,
          aqi: latest?.aqi_value || latest?.aqi || 0,
          pm25: latest?.pm25 || 0,
          pm10: latest?.pm10 || 0,
          temperature: latest?.temperature || 0,
          humidity: latest?.humidity || 0,
          battery: station.battery_level ?? 100,
          lastUpdate: latest?.created_at
            ? new Date(latest.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No telemetry data",
        }
      })
    )

    return NextResponse.json(mappedStations)
  } catch (err: any) {
    console.error("API Route Error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch stations data" },
      { status: 500 }
    )
  }
}