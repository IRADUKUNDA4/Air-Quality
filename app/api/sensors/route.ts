import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await request.json();
    const deviceId = body.device_id || body.deviceId || "airquality-station01";
    const district = body.district || "Kigali";

    // 1. Fetch threshold settings once per request
    const { data: settings, error: settingsError } = await supabaseAdmin.from("settings").select("*");
    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
    }

    // Helper: Check and insert alert
    const checkAndInsertAlert = async (name: string, value: number, unit: string) => {
      const setting = settings?.find(
        (s) => s.pollutant_name?.toUpperCase() === name.toUpperCase()
      );

      const moderateThreshold = setting?.moderate_threshold ?? 12.1;
      const unhealthyThreshold = setting?.unhealthy_threshold ?? 55.5;

      let severity: "critical" | "warning" | null = null;
      let title = "";

      if (value >= unhealthyThreshold) {
        severity = "critical";
        title = `Unhealthy ${name} Level Detected`;
      } else if (value >= moderateThreshold) {
        severity = "warning";
        title = `Moderate ${name} Level Alert`;
      }

      if (severity) {
        const { error: alertError } = await supabaseAdmin.from("alerts").insert([
          {
            type: severity,
            title: title,
            message: `${name} reading reached ${value} ${unit} in ${district}. Exceeds threshold (${moderateThreshold}).`,
            severity: severity,
            district: district,
            station: deviceId,
            acknowledged: false,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);

        if (alertError) {
          console.error(`Alert Insertion Failed for ${name}:`, alertError);
        }
      }
    };

    // -------------------------------------------------------------------
    // CASE A: SINGLE READING PAYLOAD
    // -------------------------------------------------------------------
    if (body.pollutant_name && body.concentration_value !== undefined) {
      const cleanName = String(body.pollutant_name).toUpperCase().trim();
      const val = Number(body.concentration_value);

      if (cleanName === "O3" || cleanName === "OZONE") {
        return NextResponse.json({ message: "O3 ignored" }, { status: 200 });
      }

      if (isNaN(val)) {
        return NextResponse.json({ error: "Invalid numeric value" }, { status: 400 });
      }

      // Check throttling (2 minutes window)
      const { data: latestReading } = await supabaseAdmin
        .from("sensor_readings")
        .select("recorded_at")
        .eq("device_id", deviceId)
        .eq("pollutant_name", cleanName)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestReading?.recorded_at) {
        const lastRecordedTime = new Date(latestReading.recorded_at).getTime();
        const currentTime = Date.now();
        const timeDifferenceInMs = currentTime - lastRecordedTime;
        const twoMinutesInMs = 2 * 60 * 1000;

        if (timeDifferenceInMs < twoMinutesInMs) {
          const remainingSeconds = Math.ceil((twoMinutesInMs - timeDifferenceInMs) / 1000);
          return NextResponse.json(
            {
              message: `Data throttled for ${cleanName}. Wait ${remainingSeconds}s.`,
              skipped: true,
            },
            { status: 200 }
          );
        }
      }

      // Insert reading
      const { data, error } = await supabaseAdmin
        .from("sensor_readings")
        .insert([
          {
            device_id: deviceId,
            pollutant_name: cleanName,
            concentration_value: val,
            unit: body.unit || "µg/m³",
            district: district,
            recorded_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Run threshold check AFTER verified insert
      await checkAndInsertAlert(cleanName, val, body.unit || "µg/m³");

      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const fieldsToMap = [
      { keys: ["pm25", "pm2.5", "PM25", "PM2.5"], name: "PM2.5", unit: "µg/m³" },
      { keys: ["pm10", "PM10"], name: "PM10", unit: "µg/m³" },
      { keys: ["aqi", "AQI"], name: "AQI", unit: "AQI" },
      { keys: ["co", "CO"], name: "CO", unit: "ppm" },
      { keys: ["no2", "NO2"], name: "NO2", unit: "ppm" },
      { keys: ["so2", "SO2"], name: "SO2", unit: "ppm" },
      { keys: ["co2", "CO2"], name: "CO2", unit: "ppm" },
      { keys: ["temperature", "temp", "TEMP"], name: "TEMPERATURE", unit: "°C" },
      { keys: ["humidity", "hum", "HUM"], name: "HUMIDITY", unit: "%" },
    ];

    const rowsToInsert: any[] = [];
    const alertsToCheck: { name: string; val: number; unit: string }[] = [];

    for (const field of fieldsToMap) {
      const matchedKey = field.keys.find((k) => body[k] !== undefined && body[k] !== null);

      if (matchedKey !== undefined) {
        const val = Number(body[matchedKey]);
        if (!isNaN(val)) {
          const unit = body.unit || field.unit;
          rowsToInsert.push({
            device_id: deviceId,
            pollutant_name: field.name,
            concentration_value: val,
            unit: unit,
            district: district,
            recorded_at: new Date().toISOString(),
          });

          alertsToCheck.push({ name: field.name, val, unit });
        }
      }
    }

    if (rowsToInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid sensor readings found in payload body" },
        { status: 400 }
      );
    }

    // Insert sensor readings batch
    const { data, error } = await supabaseAdmin
      .from("sensor_readings")
      .insert(rowsToInsert)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Execute alert checks after successful bulk insertion
    for (const item of alertsToCheck) {
      await checkAndInsertAlert(item.name, item.val, item.unit);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error("API Route Processing Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err?.message },
      { status: 500 }
    );
  }
}