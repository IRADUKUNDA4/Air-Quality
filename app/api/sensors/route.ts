import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET: Fetches sensor data for Dashboard and Analytics pages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const district = searchParams.get("district") || "all"

    let query = supabase.from("sensor_readings").select("*")

    if (district !== "all") {
      query = query.ilike("district", district)
    }

    const { data: readings, error } = await query
      .order("recorded_at", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Latest metric values
    const metrics: Record<string, number> = {
      PM25: 0,
      PM10: 0,
      NO2: 0,
      CO: 0,
      SO2: 0,
      TEMP: 0,
      HUMIDITY: 0,
    }

    let maxAqi = 0

    // Filter out O3 completely and group latest metrics
    const cleanReadings = (readings || []).filter((row) => {
      const name = row.pollutant_name?.toUpperCase().trim()
      return name !== "O3" && name !== "OZONE"
    })

    cleanReadings.forEach((row) => {
      const name = row.pollutant_name?.toUpperCase().trim()
      const val = Number(row.concentration_value) || 0

      if (name && metrics[name] === 0) {
        metrics[name] = val
      }

      if (["PM2.5", "PM25", "PM10"].includes(name) && val > maxAqi) {
        maxAqi = val
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overallAqi: maxAqi,
        metrics,
        readings: cleanReadings,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST: Receives data from hardware/sensors (discards O3)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { device_id, pollutant_name, concentration_value, unit, district } = body

    if (!device_id || !pollutant_name || concentration_value === undefined) {
      return NextResponse.json(
        { error: "Missing required sensor fields" },
        { status: 400 }
      )
    }

    const cleanName = pollutant_name.toUpperCase().trim()

    // Silently ignore O3 readings
    if (cleanName === "O3" || cleanName === "OZONE") {
      return NextResponse.json({ message: "O3 reading ignored" }, { status: 200 })
    }

    const { data, error } = await supabase
      .from("sensor_readings")
      .insert([
        {
          device_id,
          pollutant_name: cleanName,
          concentration_value: Number(concentration_value),
          unit: unit || "µg/m³",
          district: district || "Kigali",
          recorded_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}