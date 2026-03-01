import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Fetch recent sensor readings from Supabase
    const { data: readings, error: readingsError } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(300); // Increased limit to gather enough data points for 2-min intervals

    if (readingsError) throw readingsError;

    // 2. Fetch real alerts from the alerts table
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) throw alertsError;

    const latestReading = readings && readings.length > 0 ? readings[0] : null;

    // ------------------------------------------------------------------
    // 3. AGGREGATE READINGS INTO 2-MINUTE INTERVAL BUCKETS
    // ------------------------------------------------------------------
    const TWO_MINUTES_MS = 2 * 60 * 1000;
    const buckets: Record<string, any> = {};

    (readings || []).forEach((r) => {
      if (!r.recorded_at) return;

      const timestamp = new Date(r.recorded_at).getTime();
      // Round timestamp down to the nearest 2-minute mark
      const bucketKey = new Date(Math.floor(timestamp / TWO_MINUTES_MS) * TWO_MINUTES_MS).toISOString();

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          recorded_at: bucketKey,
          district: r.district || "Kigali",
          device_id: r.device_id,
          // Pollutant counts to calculate average
          rawValues: {}
        };
      }

      const key = r.pollutant_name ? r.pollutant_name.toUpperCase() : "VALUE";
      if (!buckets[bucketKey].rawValues[key]) {
        buckets[bucketKey].rawValues[key] = [];
      }
      if (typeof r.concentration_value === "number") {
        buckets[bucketKey].rawValues[key].push(r.concentration_value);
      }
    });

    // Transform grouped buckets into formatted interval records
    const twoMinIntervalData = Object.keys(buckets)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Newest first
      .map((bucketKey) => {
        const item = buckets[bucketKey];
        const record: Record<string, any> = {
          recorded_at: item.recorded_at,
          district: item.district,
          device_id: item.device_id,
        };

        // Average out values inside this 2-minute window
        Object.keys(item.rawValues).forEach((pollutant) => {
          const vals = item.rawValues[pollutant];
          const avg = vals.reduce((sum: number, v: number) => sum + v, 0) / vals.length;
          record[pollutant.toLowerCase()] = Number(avg.toFixed(1));
          
          // Set primary concentration value if requested by simple list UI
          if (!record.concentration_value) {
            record.concentration_value = Number(avg.toFixed(1));
            record.pollutant_name = pollutant;
          }
        });

        return record;
      });

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
        trendData: twoMinIntervalData,
        pollutants: twoMinIntervalData
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}