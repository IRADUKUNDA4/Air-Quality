-- Seed pollutants data
INSERT INTO pollutants (name, unit, who_guideline_limit, health_effects, sources, vulnerable_groups)
VALUES
  ('PM2.5', 'µg/m³', 35, 'Respiratory and cardiovascular effects', 'Vehicle emissions, industrial processes', 'Children, elderly, people with respiratory diseases'),
  ('PM10', 'µg/m³', 150, 'Respiratory issues', 'Dust, construction, vehicle emissions', 'Children, elderly, people with asthma'),
  ('O3', 'ppb', 100, 'Respiratory and lung damage', 'Photochemical reactions, vehicle emissions', 'Children, outdoor workers, people with respiratory conditions'),
  ('NO2', 'ppb', 100, 'Respiratory inflammation', 'Vehicle emissions, power plants', 'Children, people with respiratory diseases'),
  ('SO2', 'ppb', 75, 'Respiratory effects', 'Power plants, industrial facilities', 'People with respiratory and cardiovascular diseases'),
  ('CO', 'ppm', 9, 'Neurological effects, carboxyhemoglobin', 'Vehicle emissions, combustion processes', 'People with cardiovascular diseases');

-- Seed monitoring stations
INSERT INTO monitoring_stations (name, district, latitude, longitude, status, sensor_type, installation_date)
VALUES
  ('Downtown Kigali', 'Nyarugenge', -1.9476, 29.8742, 'online', 'AirBeam2', '2023-01-15'),
  ('Kimisagara', 'Gasabo', -1.9478, 29.8745, 'online', 'Purple Air', '2023-02-20'),
  ('Gisozi', 'Gasabo', -1.9465, 29.8768, 'online', 'AirBeam2', '2023-03-10'),
  ('Nyarugenge Market', 'Nyarugenge', -1.9482, 29.8738, 'online', 'Purple Air', '2023-04-05'),
  ('Kicukiro Center', 'Kicukiro', -1.9520, 29.8600, 'online', 'AirBeam2', '2023-05-12'),
  ('University of Rwanda', 'Gasabo', -1.9445, 29.8820, 'offline', 'Purple Air', '2023-06-08');

-- Seed alert thresholds
INSERT INTO alert_thresholds (pollutant_id, warning_level, critical_level)
VALUES
  (1, 50, 100),  -- PM2.5
  (2, 150, 250), -- PM10
  (3, 100, 150), -- O3
  (4, 100, 200), -- NO2
  (5, 75, 150),  -- SO2
  (6, 9, 15);    -- CO

-- Seed recent AQI calculations
INSERT INTO aqi_calculations (station_id, aqi_value, status, dominant_pollutant, calculated_at, district)
VALUES
  ((SELECT id FROM monitoring_stations LIMIT 1), 68, 'moderate', 'PM2.5', NOW(), 'Nyarugenge'),
  ((SELECT id FROM monitoring_stations OFFSET 1 LIMIT 1), 45, 'good', 'PM10', NOW() - INTERVAL '1 hour', 'Gasabo'),
  ((SELECT id FROM monitoring_stations OFFSET 2 LIMIT 1), 82, 'unhealthy_sensitive', 'PM2.5', NOW() - INTERVAL '2 hours', 'Gasabo'),
  ((SELECT id FROM monitoring_stations OFFSET 3 LIMIT 1), 55, 'moderate', 'NO2', NOW() - INTERVAL '3 hours', 'Nyarugenge'),
  ((SELECT id FROM monitoring_stations OFFSET 4 LIMIT 1), 38, 'good', 'O3', NOW() - INTERVAL '4 hours', 'Kicukiro');

-- Seed air quality readings
INSERT INTO air_quality_readings (station_id, pollutant_id, concentration_value, recorded_at)
VALUES
  ((SELECT id FROM monitoring_stations LIMIT 1), (SELECT id FROM pollutants WHERE name = 'PM2.5' LIMIT 1), 35.5, NOW()),
  ((SELECT id FROM monitoring_stations LIMIT 1), (SELECT id FROM pollutants WHERE name = 'PM10' LIMIT 1), 68.2, NOW()),
  ((SELECT id FROM monitoring_stations LIMIT 1), (SELECT id FROM pollutants WHERE name = 'O3' LIMIT 1), 42.1, NOW()),
  ((SELECT id FROM monitoring_stations LIMIT 1), (SELECT id FROM pollutants WHERE name = 'NO2' LIMIT 1), 28.5, NOW()),
  ((SELECT id FROM monitoring_stations LIMIT 1), (SELECT id FROM pollutants WHERE name = 'SO2' LIMIT 1), 12.3, NOW()),
  ((SELECT id FROM monitoring_stations LIMIT 1), (SELECT id FROM pollutants WHERE name = 'CO' LIMIT 1), 2.1, NOW()),
  ((SELECT id FROM monitoring_stations OFFSET 1 LIMIT 1), (SELECT id FROM pollutants WHERE name = 'PM2.5' LIMIT 1), 25.8, NOW()),
  ((SELECT id FROM monitoring_stations OFFSET 1 LIMIT 1), (SELECT id FROM pollutants WHERE name = 'PM10' LIMIT 1), 45.3, NOW());

-- Seed alerts
INSERT INTO alerts (station_id, severity, message, status, acknowledged)
VALUES
  ((SELECT id FROM monitoring_stations LIMIT 1), 'warning', 'PM2.5 levels elevated in Nyarugenge', 'active', FALSE),
  ((SELECT id FROM monitoring_stations OFFSET 2 LIMIT 1), 'critical', 'Air quality unhealthy in Gasabo area', 'active', FALSE),
  ((SELECT id FROM monitoring_stations OFFSET 3 LIMIT 1), 'info', 'Monitoring station online', 'resolved', TRUE);

-- Seed user settings
INSERT INTO user_settings (user_id, theme, notifications_enabled, email_alerts, units, refresh_interval, watchlist_districts)
VALUES
  ('default_user', 'dark', true, true, 'metric', 5, ARRAY['Nyarugenge', 'Gasabo', 'Kicukiro']);
