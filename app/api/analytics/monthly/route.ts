import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30days';

  const daysMap: Record<string, number> = {
    '7days': 7,
    '30days': 30,
    '90days': 90,
    '1year': 365,
  };
  const days = daysMap[period] || 30;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: readings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group readings by date (e.g., "Jan 15" or "Mon 12")
    const grouped: Record<
      string,
      { aqiSum: number; pm25Sum: number; pm10Sum: number; count: number }
    > = {};

    (readings || []).forEach((row) => {
      const name = row.pollutant_name?.toUpperCase().trim();
      if (['O3', 'OZONE'].includes(name)) return; // Skip O3

      const dateStr = new Date(row.recorded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!grouped[dateStr]) {
        grouped[dateStr] = { aqiSum: 0, pm25Sum: 0, pm10Sum: 0, count: 0 };
      }

      const val = Number(row.concentration_value) || 0;
      grouped[dateStr].aqiSum += val;
      grouped[dateStr].count += 1;

      if (['PM2.5', 'PM25'].includes(name)) grouped[dateStr].pm25Sum += val;
      if (name === 'PM10') grouped[dateStr].pm10Sum += val;
    });

    // Format output array for Recharts
    const chartData = Object.keys(grouped).map((dateKey) => {
      const item = grouped[dateKey];
      const avgAqi = Math.round(item.aqiSum / item.count);
      return {
        month: dateKey,
        aqi: avgAqi,
        pm25: Math.round(item.pm25Sum / (item.count || 1)),
        pm10: Math.round(item.pm10Sum / (item.count || 1)),
      };
    });

    return NextResponse.json(chartData);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}