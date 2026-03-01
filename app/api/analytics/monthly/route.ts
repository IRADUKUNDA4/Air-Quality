import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30days';

  const daysMap: Record<string, number> = {
    '24hours': 1,
    '7days': 7,
    '30days': 30,
    '90days': 90,
    '1year': 365,
  };
  const days = daysMap[period] || 30;

  try {
    const startDate = new Date();
    if (period === '24hours') {
      startDate.setHours(startDate.getHours() - 24);
    } else {
      startDate.setDate(startDate.getDate() - days);
    }

    // Helper function to check if a row contains actual non-zero data
    const isValidRow = (row: any) => {
      const aqi = Number(row.aqi ?? row.air_quality_index ?? 0);
      const pm25 = Number(row.pm25 ?? row.pm2_5 ?? 0);
      const pm10 = Number(row.pm10 ?? 0);
      const conc = Number(row.concentration_value ?? 0);
      const temp = Number(row.temperature ?? row.temp ?? 0);
      const hum = Number(row.humidity ?? row.hum ?? 0);

      return aqi > 0 || pm25 > 0 || pm10 > 0 || conc > 0 || temp > 0 || hum > 0;
    };

    // 1. Fetch telemetry records
    let { data: rawReadings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error && error.message.includes('created_at')) {
      const fallback = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      rawReadings = fallback.data;
      error = fallback.error;
    }

    // Filter out all-zero rows immediately
    let cleanReadings = (rawReadings || []).filter(isValidRow);

    // 2. Fallback: If filtered window is empty, grab historical valid non-zero data (captures August)
    if (!error && cleanReadings.length === 0) {
      const historyQuery = await supabase
        .from('sensor_readings')
        .select('*')
        .order('id', { ascending: false })
        .limit(1000); // Higher limit to bypass September zeroes and reach August records

      const historicalRaw = historyQuery.data || [];
      cleanReadings = historicalRaw.filter(isValidRow).reverse();
      error = historyQuery.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Group valid non-zero readings dynamically
    const grouped: Record<
      string,
      { aqiSum: number; pm25Sum: number; pm10Sum: number; count: number }
    > = {};

    cleanReadings.forEach((row) => {
      const timestamp = row.created_at || row.recorded_at;
      if (!timestamp) return;

      const dateObj = new Date(timestamp);
      if (isNaN(dateObj.getTime())) return;

      const dateKey =
        period === '24hours'
          ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!grouped[dateKey]) {
        grouped[dateKey] = { aqiSum: 0, pm25Sum: 0, pm10Sum: 0, count: 0 };
      }

      const rowAqi = Number(row.aqi ?? row.air_quality_index ?? row.concentration_value ?? 0);
      const rowPm25 = Number(row.pm25 ?? row.pm2_5 ?? (row.pollutant_name === 'PM2.5' ? row.concentration_value : 0));
      const rowPm10 = Number(row.pm10 ?? (row.pollutant_name === 'PM10' ? row.concentration_value : 0));

      grouped[dateKey].aqiSum += rowAqi;
      grouped[dateKey].pm25Sum += rowPm25;
      grouped[dateKey].pm10Sum += rowPm10;
      grouped[dateKey].count += 1;
    });

    // 4. Transform into Recharts format
    const chartData = Object.keys(grouped).map((dateKey) => {
      const item = grouped[dateKey];
      const count = item.count || 1;
      return {
        month: dateKey,
        created_at: dateKey,
        aqi: Math.round(item.aqiSum / count),
        pm25: Math.round(item.pm25Sum / count),
        pm10: Math.round(item.pm10Sum / count),
      };
    });

    return NextResponse.json(chartData);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err?.message }, { status: 500 });
  }
}