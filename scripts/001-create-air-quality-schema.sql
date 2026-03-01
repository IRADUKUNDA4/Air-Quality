-- Air Quality Monitoring Dashboard Schema

-- Create tables for core air quality data
CREATE TABLE IF NOT EXISTS public.monitoring_stations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  district TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
  sensor_type TEXT,
  installation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_maintenance TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pollutants (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  who_guideline DECIMAL(10, 2),
  us_epa_standard DECIMAL(10, 2),
  description TEXT,
  health_effects TEXT,
  major_sources TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.air_quality_readings (
  id BIGSERIAL PRIMARY KEY,
  station_id BIGINT NOT NULL REFERENCES public.monitoring_stations(id) ON DELETE CASCADE,
  pollutant_id BIGINT NOT NULL REFERENCES public.pollutants(id) ON DELETE CASCADE,
  value DECIMAL(10, 4) NOT NULL,
  quality_index INT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_quality_flag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(station_id, pollutant_id, recorded_at)
);

CREATE TABLE IF NOT EXISTS public.aqi_calculations (
  id BIGSERIAL PRIMARY KEY,
  station_id BIGINT NOT NULL REFERENCES public.monitoring_stations(id) ON DELETE CASCADE,
  aqi_value INT NOT NULL,
  primary_pollutant TEXT,
  health_concern TEXT,
  color_code TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alert_thresholds (
  id BIGSERIAL PRIMARY KEY,
  pollutant_id BIGINT NOT NULL REFERENCES public.pollutants(id) ON DELETE CASCADE,
  station_id BIGINT REFERENCES public.monitoring_stations(id) ON DELETE SET NULL,
  threshold_value DECIMAL(10, 4) NOT NULL,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('warning', 'critical')),
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alerts (
  id BIGSERIAL PRIMARY KEY,
  station_id BIGINT NOT NULL REFERENCES public.monitoring_stations(id) ON DELETE CASCADE,
  pollutant_id BIGINT REFERENCES public.pollutants(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning', 'info', 'success')),
  message TEXT NOT NULL,
  value_recorded DECIMAL(10, 4),
  threshold_value DECIMAL(10, 4),
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  severity INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alert_logs (
  id BIGSERIAL PRIMARY KEY,
  alert_id BIGINT NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historical_analytics (
  id BIGSERIAL PRIMARY KEY,
  station_id BIGINT NOT NULL REFERENCES public.monitoring_stations(id) ON DELETE CASCADE,
  pollutant_id BIGINT NOT NULL REFERENCES public.pollutants(id) ON DELETE CASCADE,
  date_recorded DATE NOT NULL,
  min_value DECIMAL(10, 4),
  max_value DECIMAL(10, 4),
  avg_value DECIMAL(10, 4),
  median_value DECIMAL(10, 4),
  std_deviation DECIMAL(10, 4),
  readings_count INT,
  aqi_avg INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(station_id, pollutant_id, date_recorded)
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  alert_notifications_enabled BOOLEAN DEFAULT TRUE,
  email_alerts_enabled BOOLEAN DEFAULT FALSE,
  sms_alerts_enabled BOOLEAN DEFAULT FALSE,
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  preferred_district TEXT,
  aqi_alert_threshold INT DEFAULT 150,
  pm25_alert_threshold DECIMAL(10, 4) DEFAULT 35,
  pm10_alert_threshold DECIMAL(10, 4) DEFAULT 150,
  o3_alert_threshold DECIMAL(10, 4) DEFAULT 100,
  no2_alert_threshold DECIMAL(10, 4) DEFAULT 100,
  so2_alert_threshold DECIMAL(10, 4) DEFAULT 75,
  co_alert_threshold DECIMAL(10, 4) DEFAULT 9,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_air_quality_readings_station ON public.air_quality_readings(station_id);
CREATE INDEX IF NOT EXISTS idx_air_quality_readings_pollutant ON public.air_quality_readings(pollutant_id);
CREATE INDEX IF NOT EXISTS idx_air_quality_readings_recorded_at ON public.air_quality_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_aqi_calculations_station ON public.aqi_calculations(station_id);
CREATE INDEX IF NOT EXISTS idx_aqi_calculations_recorded_at ON public.aqi_calculations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_station ON public.alerts(station_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_acknowledged ON public.alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_historical_analytics_station ON public.historical_analytics(station_id);
CREATE INDEX IF NOT EXISTS idx_historical_analytics_date ON public.historical_analytics(date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_stations_district ON public.monitoring_stations(district);
CREATE INDEX IF NOT EXISTS idx_monitoring_stations_status ON public.monitoring_stations(status);

-- Insert sample pollutants data
INSERT INTO public.pollutants (code, name, unit, who_guideline, us_epa_standard, description, health_effects, major_sources) VALUES
('PM25', 'PM2.5 (Fine Particulate Matter)', 'µg/m³', 15, 35, 'Particles smaller than 2.5 micrometers in diameter', 'Respiratory and cardiovascular diseases', 'Vehicle emissions, industrial facilities, power plants'),
('PM10', 'PM10 (Coarse Particulate Matter)', 'µg/m³', 45, 150, 'Particles smaller than 10 micrometers in diameter', 'Asthma, bronchitis', 'Dust, pollen, vehicle exhaust'),
('O3', 'Ozone (O₃)', 'µg/m³', 100, 100, 'Ground-level ozone', 'Lung damage, asthma, reduced lung function', 'Vehicle emissions, industrial processes'),
('NO2', 'Nitrogen Dioxide (NO₂)', 'µg/m³', 40, 100, 'Nitrogen dioxide gas', 'Respiratory problems, increased susceptibility to respiratory infections', 'Vehicle emissions, power plants'),
('SO2', 'Sulfur Dioxide (SO₂)', 'µg/m³', 40, 75, 'Sulfur dioxide gas', 'Respiratory effects, worsening of asthma', 'Fossil fuel combustion, industrial facilities'),
('CO', 'Carbon Monoxide (CO)', 'mg/m³', NULL, 9, 'Carbon monoxide gas', 'Reduced oxygen supply to organs and tissues', 'Vehicle emissions, incomplete combustion')
ON CONFLICT (code) DO NOTHING;

-- Create sample monitoring stations
INSERT INTO public.monitoring_stations (name, location, latitude, longitude, district, status, sensor_type, installation_date) VALUES
('Kigali Central Station', 'Central Business District', -1.9456, 30.0644, 'Gasabo', 'online', 'AirBeam', now() - interval '365 days'),
('Nyarugenge Station', 'Nyarugenge District', -1.9488, 30.0738, 'Nyarugenge', 'online', 'PurpleAir', now() - interval '300 days'),
('Kicukiro Station', 'Kicukiro District', -1.9725, 30.0823, 'Kicukiro', 'online', 'AirBeam', now() - interval '200 days'),
('Rwamagana Station', 'Eastern Province', -2.4583, 30.4667, 'Eastern', 'online', 'PurpleAir', now() - interval '150 days'),
('Musanze Station', 'Northern Province', -1.4969, 29.6333, 'Northern', 'maintenance', 'AirBeam', now() - interval '120 days')
ON CONFLICT (name) DO NOTHING;
