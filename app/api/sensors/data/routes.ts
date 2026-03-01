import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, pollutant_name, concentration_value, unit } = body;

    if (!device_id || !pollutant_name || concentration_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required sensor fields' },
        { status: 400 }
      );
    }

    // Insert reading into Supabase
    const { data, error } = await supabase
      .from('sensor_readings')
      .insert([
        {
          device_id,
          pollutant_name,
          concentration_value: Number(concentration_value),
          unit: unit || 'µg/m³',
          recorded_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}