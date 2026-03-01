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

    const { data, error } = await supabase
      .from("sensor_readings")
      .select("*")
      .gte("recorded_at", timeBoundary.toISOString())
      .order("recorded_at", { ascending: true })

    if (error) {
      console.error("Supabase Query Error:", error.message)
      return NextResponse.json({ error: error.message, data: [] }, { status: 200 })
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (err: any) {
    console.error("API Route Error:", err)
    return NextResponse.json({ error: err?.message || "Internal Server Error", data: [] }, { status: 200 })
  }
}