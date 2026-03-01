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

    // Query readings for the selected period excluding O3
    const { data: readings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('recorded_at', startDate.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cleanReadings = (readings || []).filter(
      (r) => !['O3', 'OZONE'].includes(r.pollutant_name?.toUpperCase().trim())
    );

    if (cleanReadings.length === 0) {
      return NextResponse.json([
        { label: 'Average AQI', value: '0', change: 'No data recorded' },
        { label: 'Peak PM2.5', value: '0 µg/m³', change: 'No data recorded' },
        { label: 'Clean Air Days', value: `0 / ${days}`, change: '0% Good AQI' },
        { label: 'Readings Captured', value: '0', change: 'Inactive' },
      ]);
    }

    // Calculate Peak PM2.5
    const pm25Values = cleanReadings
      .filter((r) => ['PM2.5', 'PM25'].includes(r.pollutant_name?.toUpperCase().trim()))
      .map((r) => Number(r.concentration_value) || 0);

    const maxPm25 = pm25Values.length > 0 ? Math.max(...pm25Values) : 0;

    // Calculate Average Concentration Value across all readings
    const totalVal = cleanReadings.reduce(
      (acc, r) => acc + (Number(r.concentration_value) || 0),
      0
    );
    const avgAqi = Math.round(totalVal / cleanReadings.length);

    // Calculate clean readings count (values <= 50)
    const cleanCount = cleanReadings.filter(
      (r) => (Number(r.concentration_value) || 0) <= 50
    ).length;
    const cleanPercent = Math.round((cleanCount / cleanReadings.length) * 100);

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
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}