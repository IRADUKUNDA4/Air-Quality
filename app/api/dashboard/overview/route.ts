import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Fetch recent sensor readings from Supabase
    const { data: readings, error: readingsError } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (readingsError) throw readingsError;

    // 2. Fetch real alerts from the alerts table
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) throw alertsError;

    const latestReading = readings && readings.length > 0 ? readings[0] : null;

    return NextResponse.json({
      data: {
        currentAQI: {
          aqi_value: latestReading?.concentration_value || 0,
          status: latestReading ? "Live Hardware" : "Awaiting Data",
          district: latestReading?.district || "Kigali",
          recorded_at: latestReading?.recorded_at || new Date().toISOString()
        },
        stationStats: {
          total: 1,
          online: latestReading ? 1 : 0,
          offline: latestReading ? 0 : 1
        },
        recentAlerts: alerts || [],
        trendData: readings || [],
        pollutants: readings || []
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}