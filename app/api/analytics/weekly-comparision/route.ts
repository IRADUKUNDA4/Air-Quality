import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    // Fetch readings for current 14-day window
    const { data: readings, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('recorded_at', fourteenDaysAgo.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const comparison: Record<string, { thisWeekTotal: number; thisWeekCount: number; lastWeekTotal: number; lastWeekCount: number }> = {};

    daysOfWeek.forEach((day) => {
      comparison[day] = { thisWeekTotal: 0, thisWeekCount: 0, lastWeekTotal: 0, lastWeekCount: 0 };
    });

    (readings || []).forEach((row) => {
      const name = row.pollutant_name?.toUpperCase().trim();
      if (['O3', 'OZONE'].includes(name)) return;

      const recordDate = new Date(row.recorded_at);
      const dayName = daysOfWeek[recordDate.getDay()];
      const val = Number(row.concentration_value) || 0;

      if (recordDate >= sevenDaysAgo) {
        comparison[dayName].thisWeekTotal += val;
        comparison[dayName].thisWeekCount += 1;
      } else {
        comparison[dayName].lastWeekTotal += val;
        comparison[dayName].lastWeekCount += 1;
      }
    });

    const result = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
      const item = comparison[day];
      return {
        day,
        thisWeek: item.thisWeekCount > 0 ? Math.round(item.thisWeekTotal / item.thisWeekCount) : 0,
        lastWeek: item.lastWeekCount > 0 ? Math.round(item.lastWeekTotal / item.lastWeekCount) : 0,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}