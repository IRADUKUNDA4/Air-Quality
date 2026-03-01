import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30days';

  // 1. Support all periods including 24hours
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

    // 2. Fetch with flexible date column handling
    let { data: readings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Fallback A: Try 'recorded_at' if 'created_at' fails
    if (error && error.message.includes('created_at')) {
      const fallback = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });

      readings = fallback.data;
      error = fallback.error;
    }

    // Fallback B: If no records exist in timeframe, fetch latest 200 historical records
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cleanReadings = (readings || []).filter(
      (r) => !['O3', 'OZONE'].includes(r.pollutant_name?.toUpperCase()?.trim())
    );

    if (cleanReadings.length === 0) {
      return NextResponse.json([
        { label: 'Average AQI', value: '0', change: 'No data recorded' },
        { label: 'Peak PM2.5', value: '0 µg/m³', change: 'No data recorded' },
        { label: 'Clean Air Days', value: `0 / ${days}`, change: '0% Good AQI' },
        { label: 'Readings Captured', value: '0', change: 'Inactive' },
      ]);
    }

    // 3. Extract PM2.5 values (handles both flat columns and row-based structures)
    const pm25Values = cleanReadings
      .map((r) => {
        if (r.pm25 !== undefined && r.pm25 !== null) return Number(r.pm25);
        if (r.pm2_5 !== undefined && r.pm2_5 !== null) return Number(r.pm2_5);
        if (['PM2.5', 'PM25'].includes(r.pollutant_name?.toUpperCase()?.trim())) {
          return Number(r.concentration_value);
        }
        return null;
      })
      .filter((val): val is number => val !== null && !isNaN(val));

    const maxPm25 = pm25Values.length > 0 ? Math.max(...pm25Values) : 0;

    // 4. Calculate Average AQI
    const aqiValues = cleanReadings
      .map((r) => {
        if (r.aqi !== undefined && r.aqi !== null) return Number(r.aqi);
        if (r.air_quality_index !== undefined) return Number(r.air_quality_index);
        return Number(r.concentration_value) || 0;
      })
      .filter((val) => !isNaN(val));

    const totalVal = aqiValues.reduce((acc, val) => acc + val, 0);
    const avgAqi = aqiValues.length > 0 ? Math.round(totalVal / aqiValues.length) : 0;

    // 5. Calculate Clean Readings Count (AQI <= 50)
    const cleanCount = aqiValues.filter((val) => val <= 50).length;
    const cleanPercent = aqiValues.length > 0 ? Math.round((cleanCount / aqiValues.length) * 100) : 0;

    return NextResponse.json([
      {
        label: 'Average AQI',
        value: avgAqi.toString(),
        change: `Based on ${cleanReadings.length} readings`,
      },
      {
        label: 'Peak PM2.5',
        value: `${maxPm25} µg/m³`,
        change: 'Max value in period',
      },
      {
        label: 'Clean Air Readings',
        value: `${cleanPercent}%`,
        change: `${cleanCount} safe readings recorded`,
      },
      {
        label: 'Total Samples',
        value: cleanReadings.length.toLocaleString(),
        change: 'Active telemetry stream',
      },
    ]);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err?.message }, { status: 500 });
  }
}