import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase environment variables are missing.")
}

const supabase = createClient(supabaseUrl, supabaseKey)

const getPollutantUnit = (pollutantName: string): string => {
  const clean = pollutantName.toUpperCase().trim()
  if (clean.includes("HUMIDITY")) return "%"
  if (clean.includes("TEMP")) return "°C"
  if (
    clean.includes("CO") ||
    clean.includes("NO2") ||
    clean.includes("SO2") ||
    clean.includes("CO2") ||
    clean.includes("O3")
  ) {
    return "ppm"
  }
  return "µg/m³"
}

const fixAlertMessage = (alert: any): any => {
  if (!alert || !alert.message) return alert

  let msg = alert.message as string

  if (msg.includes("HUMIDITY")) {
    msg = msg.replace(/µg\/m³|ppm/g, "%")
  } else if (
    msg.includes("NO2") ||
    msg.includes("SO2") ||
    msg.includes("CO2") ||
    msg.includes("CO ")
  ) {
    msg = msg.replace("µg/m³", "ppm")
  } else if (msg.includes("TEMPERATURE")) {
    msg = msg.replace(/µg\/m³|ppm/g, "°C")
  }

  return {
    ...alert,
    message: msg,
  }
}

// GET: Fetch recent alerts with formatted units
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Database error fetching alerts:", error)
      throw error
    }

    const sanitizedData = (data || []).map(fixAlertMessage)

    return NextResponse.json({ success: true, data: sanitizedData }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch alerts" },
      { status: 500 }
    )
  }
}

// POST: Insert new alert with validated units
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pollutant_name, concentration_value, location = "Kigali" } = body

    const unit = getPollutantUnit(pollutant_name || "")
    const message = `${pollutant_name} reading reached ${concentration_value} ${unit} in ${location}.`

    const { data, error } = await supabase
      .from("alerts")
      .insert([
        {
          pollutant_name,
          value: concentration_value,
          unit,
          message,
          acknowledged: false,
          is_read: "false",
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create alert" },
      { status: 500 }
    )
  }
}

// PATCH: Acknowledge / Read alert(s)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ids, acknowledged = true, is_read = true } = body

    const isReadVal = typeof is_read === "boolean" ? String(is_read) : is_read

    const payload = {
      acknowledged: Boolean(acknowledged),
      is_read: isReadVal,
    }

    let responseData

    if (ids && Array.isArray(ids)) {
      const { data, error } = await supabase
        .from("alerts")
        .update(payload)
        .in("id", ids)
        .select()

      if (error) throw error
      responseData = data
    } else if (id) {
      const { data, error } = await supabase
        .from("alerts")
        .update(payload)
        .eq("id", id)
        .select()

      if (error) throw error
      responseData = data
    } else {
      return NextResponse.json(
        { success: false, error: "Missing alert ID or array of IDs" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Alert status updated", data: responseData },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Database error updating alerts:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update alert status" },
      { status: 500 }
    )
  }
}

// DELETE: Remove alert(s)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const ids = searchParams.get("ids")

    if (ids) {
      const idArray = ids.split(",").map((item) => item.trim())
      const { error } = await supabase.from("alerts").delete().in("id", idArray)
      if (error) throw error
    } else if (id) {
      const { error } = await supabase.from("alerts").delete().eq("id", id)
      if (error) throw error
    } else {
      return NextResponse.json(
        { success: false, error: "Alert ID or IDs required" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Alert(s) deleted" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Database error deleting alerts:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete alert" },
      { status: 500 }
    )
  }
}