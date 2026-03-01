import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30days"
    const district = searchParams.get("district") || "all"

    // 1. Fetch data ordered by date
    let query = supabase
      .from("sensor_readings")
      .select("*")
      .order("recorded_at", { ascending: true })

    if (district !== "all") {
      query = query.ilike("district", district)
    }

    const { data: readings, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!readings || readings.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    // 2. Determine relative max date from hardware data if real-time gap exists
    const latestRecordTime = new Date(readings[readings.length - 1].recorded_at).getTime()
    const now = new Date().getTime()
    // Use latest recorded timestamp as reference anchor if data is historical
    const anchorDate = (now - latestRecordTime > 48 * 60 * 60 * 1000) ? new Date(latestRecordTime) : new Date()

    let startDate = new Date(anchorDate)

    switch (period) {
      case "24hours":
        startDate.setHours(anchorDate.getHours() - 24)
        break
      case "7days":
        startDate.setDate(anchorDate.getDate() - 7)
        break
      case "30days":
        startDate.setDate(anchorDate.getDate() - 30)
        break
      case "90days":
        startDate.setDate(anchorDate.getDate() - 90)
        break
      default:
        startDate.setDate(anchorDate.getDate() - 30)
    }

    // Filter readings within calculated range
    const filteredReadings = readings.filter((r) => {
      const recTime = new Date(r.recorded_at).getTime()
      return recTime >= startDate.getTime()
    })

    const targetDataset = filteredReadings.length > 0 ? filteredReadings : readings.slice(-100)

    // 3. Hourly Grouping & Aggregation
    const hourlyMap = new Map<string, Record<string, number[]>>()

    targetDataset.forEach((row) => {
      const name = row.pollutant_name?.toUpperCase().trim()
      if (!row.recorded_at || name === "O3" || name === "OZONE") return

      const dateObj = new Date(row.recorded_at)
      const hourKey = `${dateObj.toISOString().slice(0, 13)}:00:00.000Z`

      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, {
          pm25: [],
          pm10: [],
          no2: [],
          so2: [],
          co: [],
          nh3: [],
          co2: [],
          temp: [],
          humidity: [],
        })
      }

      const bucket = hourlyMap.get(hourKey)!
      let val = Number(row.concentration_value) || 0

      if (["PM2.5", "PM25"].includes(name)) bucket.pm25.push(val)
      else if (name === "PM10") bucket.pm10.push(val)
      else if (name === "NO2") bucket.no2.push(val)
      else if (name === "SO2") bucket.so2.push(val)
      else if (name === "CO") bucket.co.push(val)
      else if (name === "NH3") bucket.nh3.push(val)
      else if (name === "CO2") bucket.co2.push(val)
      else if (["TEMP", "TEMPERATURE"].includes(name)) bucket.temp.push(val)
      else if (["HUMIDITY", "HUMID"].includes(name)) bucket.humidity.push(val)
    })

    const calcAvg = (arr: number[]) =>
      arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0

    const formattedData = Array.from(hourlyMap.entries()).map(([hourIso, values]) => {
      const d = new Date(hourIso)
      const displayTime = `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`

      const pm25Avg = calcAvg(values.pm25)
      const pm10Avg = calcAvg(values.pm10)
      const calculatedAqi = Math.max(Math.round(pm25Avg * 2.1), Math.round(pm10Avg * 1.2))

      return {
        id: hourIso,
        created_at: hourIso,
        display_time: displayTime,
        aqi: calculatedAqi,
        pm25: pm25Avg,
        pm10: pm10Avg,
        no2: calcAvg(values.no2),
        so2: calcAvg(values.so2),
        co: calcAvg(values.co),
        nh3: calcAvg(values.nh3),
        co2: calcAvg(values.co2),
        temperature: calcAvg(values.temp),
        humidity: calcAvg(values.humidity),
      }
    })

    return NextResponse.json(formattedData, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}