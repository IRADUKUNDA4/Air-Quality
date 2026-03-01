import { supabaseAdmin } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id
    const body = await request.json()
    const { status, acknowledged } = body

    const updateData: Record<string, any> = {}
    if (status) updateData.status = status
    if (acknowledged !== undefined) updateData.acknowledged = acknowledged

    const { data: alert, error } = await supabaseAdmin
      .from("alerts")
      .update(updateData)
      .eq("id", alertId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: alert,
    })
  } catch (error) {
    console.error("[v0] Alert update error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update alert" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id

    const { error } = await supabaseAdmin
      .from("alerts")
      .delete()
      .eq("id", alertId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Alert deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Alert delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete alert" },
      { status: 500 }
    )
  }
}
