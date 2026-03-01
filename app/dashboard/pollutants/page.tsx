"use client"

import { Header } from "@/components/dashboard/header"
import { PollutantDetailChart } from "@/components/dashboard/pollutant-detail-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const pollutantsData = {
  "PM2.5": {
    name: "PM2.5",
    fullName: "Fine Particulate Matter",
    value: 35,
    unit: "µg/m³",
    limit: 35,
    description: "Particles less than 2.5 micrometers in diameter",
    healthEffects: "Can penetrate deep into the lungs and bloodstream, causing cardiovascular and respiratory issues, and increasing cancer risk.",
    sources: ["Vehicle emissions", "Industrial processes", "Construction dust", "Burning of fuels"],
    data: [
      { time: "00:00", value: 28 },
      { time: "04:00", value: 22 },
      { time: "08:00", value: 42 },
      { time: "12:00", value: 38 },
      { time: "16:00", value: 35 },
      { time: "20:00", value: 32 },
    ],
  },
  "PM10": {
    name: "PM10",
    fullName: "Coarse Particulate Matter",
    value: 68,
    unit: "µg/m³",
    limit: 150,
    description: "Particles less than 10 micrometers in diameter",
    healthEffects: "Can irritate the eyes, nose, and throat. May aggravate asthma and cause respiratory infections.",
    sources: ["Road dust", "Construction activities", "Industrial emissions", "Agricultural operations"],
    data: [
      { time: "00:00", value: 55 },
      { time: "04:00", value: 48 },
      { time: "08:00", value: 82 },
      { time: "12:00", value: 75 },
      { time: "16:00", value: 68 },
      { time: "20:00", value: 58 },
    ],
  },
  "O3": {
    name: "O3",
    fullName: "Ground-level Ozone",
    value: 42,
    unit: "ppb",
    limit: 100,
    description: "A secondary pollutant formed by photochemical reactions",
    healthEffects: "Triggers respiratory problems, reduces lung function, and aggravates asthma. Can damage crops and vegetation.",
    sources: ["Formed from NOx and VOCs in sunlight", "Vehicle exhaust", "Industrial facilities", "Power plants"],
    data: [
      { time: "00:00", value: 25 },
      { time: "04:00", value: 20 },
      { time: "08:00", value: 35 },
      { time: "12:00", value: 55 },
      { time: "16:00", value: 48 },
      { time: "20:00", value: 30 },
    ],
  },
  "NO2": {
    name: "NO2",
    fullName: "Nitrogen Dioxide",
    value: 28,
    unit: "ppb",
    limit: 100,
    description: "A reddish-brown gas with a pungent odor",
    healthEffects: "Irritates airways, aggravates respiratory diseases, and may contribute to asthma development in children.",
    sources: ["Motor vehicles", "Power plants", "Industrial boilers", "Off-road equipment"],
    data: [
      { time: "00:00", value: 18 },
      { time: "04:00", value: 15 },
      { time: "08:00", value: 38 },
      { time: "12:00", value: 32 },
      { time: "16:00", value: 28 },
      { time: "20:00", value: 22 },
    ],
  },
  "SO2": {
    name: "SO2",
    fullName: "Sulfur Dioxide",
    value: 12,
    unit: "ppb",
    limit: 75,
    description: "A colorless gas with a sharp, pungent odor",
    healthEffects: "Causes respiratory irritation, particularly in those with asthma. Contributes to acid rain formation.",
    sources: ["Fossil fuel combustion", "Industrial processes", "Volcanic eruptions", "Smelting operations"],
    data: [
      { time: "00:00", value: 8 },
      { time: "04:00", value: 6 },
      { time: "08:00", value: 15 },
      { time: "12:00", value: 14 },
      { time: "16:00", value: 12 },
      { time: "20:00", value: 10 },
    ],
  },
  "CO": {
    name: "CO",
    fullName: "Carbon Monoxide",
    value: 2.1,
    unit: "ppm",
    limit: 9,
    description: "A colorless, odorless gas produced by incomplete combustion",
    healthEffects: "Reduces oxygen delivery to organs. High levels can cause dizziness, confusion, and in severe cases, death.",
    sources: ["Vehicle exhaust", "Gas stoves and heaters", "Industrial processes", "Tobacco smoke"],
    data: [
      { time: "00:00", value: 1.5 },
      { time: "04:00", value: 1.2 },
      { time: "08:00", value: 3.2 },
      { time: "12:00", value: 2.8 },
      { time: "16:00", value: 2.1 },
      { time: "20:00", value: 1.8 },
    ],
  },
}

export default function PollutantsPage() {
  return (
    <>
      <Header
        title="Pollutants"
        description="Detailed monitoring of criteria pollutants"
      />
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue="PM2.5" className="space-y-6">
            <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0">
              {Object.keys(pollutantsData).map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(pollutantsData).map(([key, pollutant]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <PollutantDetailChart pollutant={pollutant} />
              </TabsContent>
            ))}
          </Tabs>

          {/* AQI Formula Information */}
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">About Air Quality Index (AQI)</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              The Air Quality Index (AQI) is calculated using standardized breakpoint methods where
              the concentration of each pollutant is mapped to a sub-index (IAQI). The overall AQI
              is determined by the highest pollutant-specific IAQI to reflect the greatest health
              risk at a given time.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-secondary p-4">
                <div className="text-2xl font-bold text-aqi-good">0-50</div>
                <div className="text-sm font-medium text-foreground">Good</div>
                <div className="text-xs text-muted-foreground">Air quality is satisfactory</div>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <div className="text-2xl font-bold text-aqi-moderate">51-100</div>
                <div className="text-sm font-medium text-foreground">Moderate</div>
                <div className="text-xs text-muted-foreground">Acceptable for most people</div>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <div className="text-2xl font-bold text-aqi-unhealthy-sensitive">101-150</div>
                <div className="text-sm font-medium text-foreground">Unhealthy for Sensitive</div>
                <div className="text-xs text-muted-foreground">Sensitive groups may experience effects</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
