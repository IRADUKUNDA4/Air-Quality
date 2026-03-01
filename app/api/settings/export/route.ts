import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get("type") || "all" // all, aqi, pollutants
    const days = parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let data: any = {}

    if (dataType === "all" || dataType === "aqi") {
      const { data: aqiData, error: aqiError } = await supabaseAdmin
        .from("aqi_calculations")
        .select("*")
        .gte("recorded_at", startDate.toISOString())

      if (aqiError) throw aqiError
      data.aqi = aqiData
    }

    if (dataType === "all" || dataType === "pollutants") {
      const { data: pollutantData, error: pollutantError } = await supabaseAdmin
        .from("air_quality_readings")
        .select("*")
        .gte("recorded_at", startDate.toISOString())

      if (pollutantError) throw pollutantError
      data.pollutants = pollutantData
    }

    // Convert to CSV
    const csv = convertToCSV(data)

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="air-quality-data-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("[v0] Data export error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to export data" },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any): string {
  const rows: string[] = []

  if (data.aqi && Array.isArray(data.aqi)) {
    rows.push("AQI Data")
    rows.push("Date,AQI Value,District,Status")
    data.aqi.forEach((row: any) => {
      rows.push(
        `${new Date(row.recorded_at).toLocaleString()},${row.aqi_value},${row.district || "N/A"},${row.status || "N/A"}`
      )
    })
    rows.push("")
  }

  if (data.pollutants && Array.isArray(data.pollutants)) {
    rows.push("Pollutant Data")
    rows.push("Date,Station,Pollutant,Value,Unit")
    data.pollutants.forEach((row: any) => {
      rows.push(
        `${new Date(row.recorded_at).toLocaleString()},${row.station_id},Pollutant,${row.concentration_value},${row.unit || "N/A"}`
      )
    })
  }

  return rows.join("\n")
}
