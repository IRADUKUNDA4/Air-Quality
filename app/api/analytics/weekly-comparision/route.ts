import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days';

    // 1. Calculate dynamic cutoff date based on timeframe
    const now = new Date();
    let cutoff = new Date();

    switch (period) {
      case '24hours':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7days':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoff.setDate(now.getDate() - 30);
        break;
      case '90days':
        cutoff.setDate(now.getDate() - 90);
        break;
      default:
        cutoff.setDate(now.getDate() - 30);
    }

    const isoCutoff = cutoff.toISOString();

    // 2. Fetch records filtered by cutoff date (trying 'created_at' first)
    let { data: readings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('created_at', isoCutoff)
      .order('created_at', { ascending: false });

    // Fallback A: If 'created_at' column doesn't exist, try 'recorded_at'
    if (error && error.message.includes('created_at')) {
      const fallbackQuery = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('recorded_at', isoCutoff)
        .order('recorded_at', { ascending: false });

      readings = fallbackQuery.data;
      error = fallbackQuery.error;
    }

    // Fallback B: If no records match the strict time window, grab the latest 200 records regardless of date
    if (!error && (!readings || readings.length === 0)) {
      const historyQuery = await supabase
        .from('sensor_readings')
        .select('*')
        .order('id', { ascending: false })
        .limit(200);

      readings = historyQuery.data;
      error = historyQuery.error;
    }

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Transform database columns to match UI expects
    const formattedReadings = (readings || []).map((row) => ({
      id: row.id,
      created_at: row.created_at || row.recorded_at || new Date().toISOString(),
      display_time: row.display_time || row.created_at || row.recorded_at,
      aqi: Number(row.aqi ?? row.air_quality_index ?? 0),
      pm25: Number(row.pm25 ?? row.pm2_5 ?? 0),
      pm10: Number(row.pm10 ?? 0),
      no2: Number(row.no2 ?? 0),
      so2: Number(row.so2 ?? 0),
      co: Number(row.co ?? 0),
      nh3: Number(row.nh3 ?? 0),
      co2: Number(row.co2 ?? 0),
      temperature: Number(row.temperature ?? row.temp ?? 0),
      humidity: Number(row.humidity ?? row.hum ?? 0),
    }));

    return NextResponse.json(formattedReadings);
  } catch (err: any) {
    console.error('Analytics GET handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err?.message },
      { status: 500 }
    );
  }
}