import { segmentKey } from "@/domain/types"
import { normalizeStop, extractEnglishName } from "@/domain/stopNormalizer"

// Import all 5 fare chart files
import fareData1 from "./data/fare_chart_data1.json"
import fareData2 from "./data/fare_chart_data2.json"
import fareData3 from "./data/fare_chart_data3.json"
import fareData4 from "./data/fare_chart_data4.json"
import fareData5 from "./data/fare_chart_data5.json"

// ─── Types for the 3 different JSON schemas ─────────────────────────────────

interface FareStop1 {
  stop_name: string
  cumulative_distance_km: number
  fare_from_start_taka: number
}

interface FareStop2 {
  stop_name: string
  km?: number
  cumulative_distance_km?: number
  fare_from_start?: number
  fare_from_start_taka?: number
}

const RATE_PER_KM = 2.45
const MIN_FARE = 10

// ─── Fare Table ───────────────────────────────────────────────────────────────
// segmentKey(A, B) → fare in BDT

let _fareTable: Map<string, number> | null = null

export function getFareTable(): Map<string, number> {
  if (_fareTable) return _fareTable
  const table = new Map<string, number>()

  const addFare = (a: string, b: string, fare: number) => {
    table.set(segmentKey(a, b), fare)
    table.set(segmentKey(b, a), fare) // bidirectional
  }

  // ── fare_chart_data1: old matrix format ─────────────────────────────────
  try {
    const d1 = (fareData1 as any).fare_chart_data
    if (d1?.fare_matrix) {
      const matrix: Array<{ stop_name: string; cumulative_distance_km: number; fares_taka: Record<string, number> }> =
        d1.fare_matrix
      for (const entry of matrix) {
        const stopB = normalizeStop(extractEnglishName(entry.stop_name))
        for (const [fromRaw, fare] of Object.entries(entry.fares_taka)) {
          const stopA = normalizeStop(extractEnglishName(fromRaw))
          if (stopA !== stopB) addFare(stopA, stopB, Math.max(fare, MIN_FARE))
        }
      }
    }
  } catch {}

  // ── fare_chart_data2: array of routes with stop list ────────────────────
  try {
    const routes = (fareData2 as any).fare_charts ?? []
    for (const route of routes) {
      const stops: FareStop1[] = route.stops ?? []
      // Build segment fares from cumulative distances
      for (let i = 0; i < stops.length; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          const a = normalizeStop(extractEnglishName(stops[i].stop_name))
          const b = normalizeStop(extractEnglishName(stops[j].stop_name))
          const distDiff = (stops[j].cumulative_distance_km ?? 0) - (stops[i].cumulative_distance_km ?? 0)
          const fare = Math.max(Math.round(distDiff * RATE_PER_KM), MIN_FARE)
          if (!table.has(segmentKey(a, b))) addFare(a, b, fare)
        }
      }
    }
  } catch {}

  // ── fare_chart_data3: bus_fare_charts with major_stops ──────────────────
  try {
    const routes = (fareData3 as any).bus_fare_charts ?? []
    for (const route of routes) {
      const stops: FareStop2[] = route.major_stops ?? []
      for (let i = 0; i < stops.length; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          const a = normalizeStop(extractEnglishName(stops[i].stop_name))
          const b = normalizeStop(extractEnglishName(stops[j].stop_name))
          const fareB = stops[j].fare_from_start ?? stops[j].fare_from_start_taka ?? 0
          const fareA = stops[i].fare_from_start ?? stops[i].fare_from_start_taka ?? 0
          const fare = Math.max(fareB - fareA, MIN_FARE)
          if (!table.has(segmentKey(a, b))) addFare(a, b, fare)
        }
      }
    }
  } catch {}

  // ── fare_chart_data4: similar structure ─────────────────────────────────
  try {
    const d4 = fareData4 as any
    const routeGroups = [
      ...(d4.bus_fare_charts ?? []),
      ...(d4.fare_charts ?? []),
    ]
    for (const route of routeGroups) {
      const stops: FareStop2[] = route.stops ?? route.major_stops ?? []
      for (let i = 0; i < stops.length; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          const a = normalizeStop(extractEnglishName(stops[i].stop_name))
          const b = normalizeStop(extractEnglishName(stops[j].stop_name))
          const fareB = stops[j].fare_from_start ?? stops[j].fare_from_start_taka ?? 0
          const fareA = stops[i].fare_from_start ?? stops[i].fare_from_start_taka ?? 0
          const fare = Math.max(fareB - fareA, MIN_FARE)
          if (!table.has(segmentKey(a, b))) addFare(a, b, fare)
        }
      }
    }
  } catch {}

  // ── fare_chart_data5: similar structure ─────────────────────────────────
  try {
    const d5 = fareData5 as any
    const routeGroups = [
      ...(d5.bus_fare_charts ?? []),
      ...(d5.fare_charts ?? []),
    ]
    for (const route of routeGroups) {
      const stops: FareStop2[] = route.stops ?? route.major_stops ?? []
      for (let i = 0; i < stops.length; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          const a = normalizeStop(extractEnglishName(stops[i].stop_name))
          const b = normalizeStop(extractEnglishName(stops[j].stop_name))
          const fareB = stops[j].fare_from_start ?? stops[j].fare_from_start_taka ?? 0
          const fareA = stops[i].fare_from_start ?? stops[i].fare_from_start_taka ?? 0
          const fare = Math.max(fareB - fareA, MIN_FARE)
          if (!table.has(segmentKey(a, b))) addFare(a, b, fare)
        }
      }
    }
  } catch {}

  _fareTable = table
  return table
}

/**
 * Estimate fare for any segment using the table or fallback to 2.45 BDT/km.
 * Fallback assumes ~1 km per stop gap.
 */
export function estimateFare(fareTable: Map<string, number>, from: string, to: string): number {
  const key = segmentKey(from, to)
  return fareTable.get(key) ?? MIN_FARE
}
