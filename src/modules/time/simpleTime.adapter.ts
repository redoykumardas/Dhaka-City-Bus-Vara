import { segmentKey } from "@/domain/types"
import { TimePort } from "./time.port"

// Average city bus speed in Dhaka: ~15 km/h in congestion
const AVG_SPEED_KMH = 15
const AVG_DISTANCE_PER_STOP_KM = 1.5  // rough average
const STOP_WAIT_MINUTES = 2

export const simpleTimeAdapter: TimePort = {
  estimate(timeTable: Map<string, number>, segment: { from: string; to: string }): number {
    const key = segmentKey(segment.from, segment.to)
    const precomputed = timeTable.get(key)
    if (precomputed !== undefined) return precomputed

    // Fallback: estimate from distance assumption
    const travelMinutes = (AVG_DISTANCE_PER_STOP_KM / AVG_SPEED_KMH) * 60
    return Math.round(travelMinutes + STOP_WAIT_MINUTES)
  },
}

/** Build a basic time table from fare-based distance (fare / 2.45 = km) */
export function buildTimeTable(fareTable: Map<string, number>): Map<string, number> {
  const timeTable = new Map<string, number>()
  for (const [key, fare] of fareTable.entries()) {
    const distKm = fare / 2.45
    const minutes = Math.round((distKm / AVG_SPEED_KMH) * 60) + STOP_WAIT_MINUTES
    timeTable.set(key, Math.max(minutes, 5))
  }
  return timeTable
}
