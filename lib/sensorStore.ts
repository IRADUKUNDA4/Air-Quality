export interface SensorReading {
  device_id: string;
  pollutant_name: string;
  concentration_value: number;
  unit: string;
  recorded_at: string;
}

const globalForSensors = globalThis as unknown as {
  sensorReadings: SensorReading[];
};

export const sensorReadings = globalForSensors.sensorReadings || [];

if (process.env.NODE_ENV !== 'production') {
  globalForSensors.sensorReadings = sensorReadings;
}