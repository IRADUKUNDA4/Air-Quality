import { useEffect, useState } from "react"

interface UseDataOptions {
  refreshInterval?: number
  enabled?: boolean
}

export function useDashboardOverview(options: UseDataOptions = {}) {
  const { refreshInterval = 60000, enabled = true } = options
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/overview")
        if (!response.ok) throw new Error("Failed to fetch data")
        const result = await response.json()
        setData(result.data)
        setError(null)
      } catch (err) {
        console.error("[v0] Dashboard fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval])

  return { data, loading, error }
}

export function usePollutantsList(options: UseDataOptions = {}) {
  const { refreshInterval = 300000, enabled = true } = options
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      try {
        const response = await fetch("/api/pollutants/list")
        if (!response.ok) throw new Error("Failed to fetch pollutants")
        const result = await response.json()
        setData(result.data || [])
        setError(null)
      } catch (err) {
        console.error("[v0] Pollutants fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval])

  return { data, loading, error }
}

export function usePollutantHistory(pollutantId: string, days: number = 7, options: UseDataOptions = {}) {
  const { refreshInterval = 300000, enabled = true } = options
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !pollutantId) return

    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/pollutants/history?pollutantId=${pollutantId}&days=${days}`
        )
        if (!response.ok) throw new Error("Failed to fetch history")
        const result = await response.json()
        setData(result.data)
        setError(null)
      } catch (err) {
        console.error("[v0] History fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [pollutantId, days, enabled, refreshInterval])

  return { data, loading, error }
}

export function useAnalyticsSummary(days: number = 30, options: UseDataOptions = {}) {
  const { refreshInterval = 300000, enabled = true } = options
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analytics/summary?days=${days}`)
        if (!response.ok) throw new Error("Failed to fetch analytics")
        const result = await response.json()
        setData(result.data)
        setError(null)
      } catch (err) {
        console.error("[v0] Analytics fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [days, enabled, refreshInterval])

  return { data, loading, error }
}

export function useStationsList(options: UseDataOptions = {}) {
  const { refreshInterval = 300000, enabled = true } = options
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      try {
        const response = await fetch("/api/stations/list")
        if (!response.ok) throw new Error("Failed to fetch stations")
        const result = await response.json()
        setData(result.data || [])
        setError(null)
      } catch (err) {
        console.error("[v0] Stations fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval])

  return { data, loading, error }
}

export function useAlertsList(options: UseDataOptions = {}) {
  const { refreshInterval = 60000, enabled = true } = options
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      try {
        const response = await fetch("/api/alerts/list?limit=50")
        if (!response.ok) throw new Error("Failed to fetch alerts")
        const result = await response.json()
        setData(result.data || [])
        setError(null)
      } catch (err) {
        console.error("[v0] Alerts fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval])

  return { data, loading, error }
}

export function useUserSettings(userId: string, options: UseDataOptions = {}) {
  const { refreshInterval = 300000, enabled = true } = options
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !userId) return

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/settings?userId=${userId}`)
        if (!response.ok) throw new Error("Failed to fetch settings")
        const result = await response.json()
        setData(result.data)
        setError(null)
      } catch (err) {
        console.error("[v0] Settings fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [userId, enabled, refreshInterval])

  return { data, loading, error }
}
