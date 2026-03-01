import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase' 

// GET: Fetch all thresholds from database
export async function GET() {
  const { data, error } = await supabase
    .from('pollutant_thresholds')
    .select('*')
    .order('pollutant_code', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// PUT: Update min and max values for a specific threshold
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, min_value, max_value } = body

    const { data, error } = await supabase
      .from('pollutant_thresholds')
      .update({ 
        min_value: Number(min_value), 
        max_value: Number(max_value), 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update threshold' }, { status: 500 })
  }
}