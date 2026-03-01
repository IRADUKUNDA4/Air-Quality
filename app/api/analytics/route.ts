import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "24hours"

    let daysLimit = 1
    if (period === "7days") daysLimit = 7
    if (period === "30days") daysLimit = 30
    if (period === "90days") daysLimit = 90

    const timeBoundary = new Date()
    timeBoundary.setDate(timeBoundary.getDate() - daysLimit)

    const pageSize = 1000
    let allData: any[] = []
    let page = 0
    let hasMore = true

    while (hasMore && page < 100) {
      const from = page * pageSize
      const to = from + pageSize - 1

      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .gte("recorded_at", timeBoundary.toISOString())
        .order("recorded_at", { ascending: true })
        .range(from, to)

      if (error) {
        console.error("Supabase Query Error:", error.message)
        break
      }

      if (data && data.length > 0) {
        allData = allData.concat(data)
        if (data.length < pageSize) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    return NextResponse.json({ data: allData }, { status: 200 })
  } catch (err: any) {
    console.error("API Route Error:", err)
    return NextResponse.json({ error: err?.message || "Internal Server Error", data: [] }, { status: 200 })
  }
}