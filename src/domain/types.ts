// ============================================================
// DOMAIN LAYER — Single Source of Truth
// All modules, use-cases and UI share these exact types.
// ============================================================

export type Stop = string

export interface BusOperator {
  name: string
  name_bn: string
  serviceType?: string
  startTime?: string
  endTime?: string
}

export interface Segment {
  from: Stop
  to: Stop
}

export interface SegmentResult extends Segment {
  buses: BusOperator[]
  fare: number           // BDT
  estimatedMinutes: number
}

export interface RouteResult {
  id: string             // hash of path stops
  path: Stop[]           // ordered stops e.g. ["Mirpur 10", "Farmgate", "Motijheel"]
  segments: SegmentResult[]
  totalFare: number      // BDT
  totalTime: number      // minutes
  transfers: number      // path.length - 2 (intermediate stops requiring transfers)
}

export type SortKey = "fare" | "time" | "transfers"

export interface SearchParams {
  from: Stop
  to: Stop
  sort?: SortKey
}

// Graph adjacency list: stop → list of directly reachable next stops (with operator info)
export type Graph = Record<Stop, Stop[]>

// segment key format: "StopA|||StopB"
export const segmentKey = (from: Stop, to: Stop): string =>
  `${from.toLowerCase().trim()}|||${to.toLowerCase().trim()}`
