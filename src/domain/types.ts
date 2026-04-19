// ─── Relational-like Data Structures (as requested) ──────────────────────────

export interface Bus {
  id: number
  bus_id: number // Deprecated, use id
  bus_name: string
}

export interface StopRecord {
  id: number
  stop_id: number // Deprecated, use id
  stop_name: string
}

export interface RouteRecord {
  id: number
  route_name?: string
  route_number?: string
}

export interface RouteStop {
  route_id: number
  stop_id: number
  stop_order: number
}

export interface RouteBus {
  route_id: number
  bus_id: number
}

export interface FareSegment {
  route_id: number
  from_stop: number    // stop_id
  to_stop: number      // stop_id
  fare: number
}


// ─── Domain Types (Existing) ──────────────────────────────────────────────────

export type Stop = string
// ... existing types below

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
  path: Stop[]           // sub-path sequence e.g. ["A", "B", "C"]
  buses: BusOperator[]
  fare: number           // BDT
  estimatedMinutes: number
}

export interface PathStep {
  stop: string
  routeId: number
}

export interface RouteResult {
  id: string             // hash of path stops
  path: Stop[]           // ordered stops e.g. ["Mirpur 10", "Farmgate", "Motijheel"]
  steps: PathStep[]      // detailed steps with route info
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

// Graph adjacency list: stop → list of directly reachable next stops (with cost and route info)
export interface Edge {
  to: Stop
  cost: number
  routeId: number
}
export type Graph = Record<Stop, Edge[]>

// segment key format: "StopA|||StopB"
export const segmentKey = (from: Stop, to: Stop): string =>
  `${from.toLowerCase().trim()}|||${to.toLowerCase().trim()}`
