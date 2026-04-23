/**
 * NormalizedDataProcessor
 *
 * Reads the six relational JSON files from data/normalized/:
 *   1_stops.json        → all stops (id, name_bangla, name_english)
 *   2_routes.json       → route metadata (id, route, route_number, total_distance_km)
 *   3_route_stops.json  → route-stop membership with sequence order
 *   4_route_fares.json  → real BRTA fare table (from_stop_id, to_stop_id, fare, distance_km)
 *   5_buses.json        → bus operator info
 *   6_bus_routes.json   → bus-to-route mapping
 *
 * This replaces the old DataProcessor's reliance on raw fare_chart_data*.json files.
 */

import stopsRaw       from "../../data/normalized/1_stops.json"
import routesRaw      from "../../data/normalized/2_routes.json"
import routeStopsRaw  from "../../data/normalized/3_route_stops.json"
import routeFaresRaw  from "../../data/normalized/4_route_fares.json"
import busesRaw       from "../../data/normalized/5_buses.json"
import busRoutesRaw   from "../../data/normalized/6_bus_routes.json"
import busStopsRaw    from "../../data/normalized/7_bus_stops.json"

// ─── Raw JSON shapes ──────────────────────────────────────────────────────────

interface RawStop {
  id: number
  name_bangla: string
  name_english: string
}

interface RawRoute {
  id: number
  route: { bangla: string; english: string }
  route_number: { bangla: string; english: string }
  total_distance_km: number
}

interface RawRouteStop {
  id: number
  route_id: number
  stop_id: number
  sequence: number
}

interface RawRouteFare {
  id: number
  route_id: number
  from_stop_id: number
  to_stop_id: number
  fare: number
  distance_km: number | null
}

interface RawBus {
  id: number
  name_en: string
  name_bn: string
  service_type?: string
}

interface RawBusRoute {
  id: number
  bus_id: number
  route_id: number
}

// ─── Processed types ──────────────────────────────────────────────────────────

export interface NStop {
  id: number
  name_en: string
  name_bn: string
}

export interface NRoute {
  id: number
  name_en: string
  name_bn: string
  route_number: string
  total_distance_km: number
}

export interface NRouteStop {
  route_id: number
  stop_id: number
  sequence: number
}

export interface NFare {
  route_id: number
  from_stop_id: number
  to_stop_id: number
  fare: number
  distance_km: number | null
}

export interface NBus {
  id: number
  name_en: string
  name_bn: string
  service_type?: string
}

export interface NBusRoute {
  bus_id: number
  route_id: number
}

export interface NBusStop {
  bus_id: number
  stop_id: number
  sequence: number
}

// ─── Main class ───────────────────────────────────────────────────────────────

export class NormalizedDataProcessor {
  public readonly stops:      NStop[]
  public readonly routes:     NRoute[]
  public readonly routeStops: NRouteStop[]
  public readonly fares:      NFare[]
  public readonly buses:      NBus[]
  public readonly busRoutes:  NBusRoute[]
  public readonly busStops:   NBusStop[]

  // Lookup maps (built once on construction)
  private readonly stopById:        Map<number, NStop>
  private readonly stopByNameEn:    Map<string, NStop>   // lower-cased english name → stop
  private readonly fareIndex:       Map<string, number>  // "routeId-fromId-toId" → fare
  private readonly fareAnyIndex:    Map<string, number>  // "fromId-toId" → best fare (any route)
  private readonly routeStopsByRoute: Map<number, NRouteStop[]>
  private readonly busesForRoute:   Map<number, NBus[]>  // routeId → buses
  private readonly busStopsByBus:   Map<number, NBusStop[]> // busId → stops

  constructor() {
    // Cast raw imports to typed arrays
    this.stops      = (stopsRaw      as RawStop[]).map(s => ({
      id:      s.id,
      name_en: s.name_english?.trim() || s.name_bangla?.trim() || `Stop ${s.id}`,
      name_bn: s.name_bangla?.trim()  || "",
    }))

    this.routes = (routesRaw as RawRoute[]).map(r => ({
      id:               r.id,
      name_en:          r.route?.english?.trim() || r.route?.bangla?.trim() || `Route ${r.id}`,
      name_bn:          r.route?.bangla?.trim()  || "",
      route_number:     r.route_number?.english?.trim() || r.route_number?.bangla?.trim() || "",
      total_distance_km: r.total_distance_km ?? 0,
    }))

    this.routeStops = (routeStopsRaw as RawRouteStop[]).map(rs => ({
      route_id: rs.route_id,
      stop_id:  rs.stop_id,
      sequence: rs.sequence,
    }))

    this.fares = (routeFaresRaw as RawRouteFare[]).map(f => ({
      route_id:    f.route_id,
      from_stop_id: f.from_stop_id,
      to_stop_id:  f.to_stop_id,
      fare:        f.fare,
      distance_km: f.distance_km,
    }))

    this.buses = (busesRaw as RawBus[]).map(b => ({
      id:           b.id,
      name_en:      b.name_en?.trim()  || `Bus ${b.id}`,
      name_bn:      b.name_bn?.trim()  || "",
      service_type: b.service_type,
    }))

    this.busRoutes = (busRoutesRaw as RawBusRoute[]).map(br => ({
      bus_id:   br.bus_id,
      route_id: br.route_id,
    }))

    this.busStops = (busStopsRaw as any[]).map(bs => ({
      bus_id:   bs.bus_id,
      stop_id:  bs.stop_id,
      sequence: bs.sequence,
    }))

    // ── Build lookup maps ──

    this.stopById = new Map(this.stops.map(s => [s.id, s]))

    this.stopByNameEn = new Map()
    for (const s of this.stops) {
      const key = s.name_en.toLowerCase().trim()
      if (!this.stopByNameEn.has(key)) this.stopByNameEn.set(key, s)
    }

    // Route-stops grouped and sorted by sequence
    this.routeStopsByRoute = new Map()
    for (const rs of this.routeStops) {
      if (!this.routeStopsByRoute.has(rs.route_id)) {
        this.routeStopsByRoute.set(rs.route_id, [])
      }
      this.routeStopsByRoute.get(rs.route_id)!.push(rs)
    }
    for (const arr of this.routeStopsByRoute.values()) {
      arr.sort((a, b) => a.sequence - b.sequence)
    }

    // Fare indexes
    this.fareIndex    = new Map()
    this.fareAnyIndex = new Map()
    for (const f of this.fares) {
      const specificKey = `${f.route_id}-${f.from_stop_id}-${f.to_stop_id}`
      this.fareIndex.set(specificKey, f.fare)

      const anyKey  = `${f.from_stop_id}-${f.to_stop_id}`
      const anyKeyR = `${f.to_stop_id}-${f.from_stop_id}`
      // Keep the minimum fare across routes for a pair
      const existing = this.fareAnyIndex.get(anyKey) ?? Infinity
      if (f.fare < existing) {
        this.fareAnyIndex.set(anyKey,  f.fare)
        this.fareAnyIndex.set(anyKeyR, f.fare)
      }
    }

    // Buses per route
    this.busesForRoute = new Map()
    for (const br of this.busRoutes) {
      const bus = this.buses.find(b => b.id === br.bus_id)
      if (!bus) continue
      if (!this.busesForRoute.has(br.route_id)) {
        this.busesForRoute.set(br.route_id, [])
      }
      this.busesForRoute.get(br.route_id)!.push(bus)
    }

    // Bus stops grouped by bus
    this.busStopsByBus = new Map()
    for (const bs of this.busStops) {
      if (!this.busStopsByBus.has(bs.bus_id)) {
        this.busStopsByBus.set(bs.bus_id, [])
      }
      this.busStopsByBus.get(bs.bus_id)!.push(bs)
    }
    for (const arr of this.busStopsByBus.values()) {
      arr.sort((a, b) => a.sequence - b.sequence)
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Look up a stop by its numeric ID */
  getStopById(id: number): NStop | undefined {
    return this.stopById.get(id)
  }

  /** Look up a stop by English name (case-insensitive) */
  getStopByName(name: string): NStop | undefined {
    return this.stopByNameEn.get(name.toLowerCase().trim())
  }

  /** All unique stop names (English) sorted alphabetically */
  getAllStopNames(): string[] {
    return Array.from(new Set(this.stops.map(s => s.name_en))).sort()
  }

  /** Stops for a given route, in sequence order */
  getRouteStops(routeId: number): NRouteStop[] {
    return this.routeStopsByRoute.get(routeId) ?? []
  }

  /**
   * Fare lookup:
   *   1. Exact fare for (routeId, fromId, toId)
   *   2. Symmetric  for (routeId, toId, fromId)
   *   3. Best fare across ALL routes for (fromId, toId)
   *   4. Distance-based estimate: 2.45 BDT/km, minimum 10
   */
  getFare(routeId: number, fromId: number, toId: number): number {
    const exactFwd = this.fareIndex.get(`${routeId}-${fromId}-${toId}`)
    if (exactFwd !== undefined) return exactFwd

    const exactBwd = this.fareIndex.get(`${routeId}-${toId}-${fromId}`)
    if (exactBwd !== undefined) return exactBwd

    const anyFare = this.fareAnyIndex.get(`${fromId}-${toId}`)
    if (anyFare !== undefined) return anyFare

    // Estimate: distance between sequential positions on the route
    const stops  = this.routeStopsByRoute.get(routeId) ?? []
    const fromRS = stops.find(rs => rs.stop_id === fromId)
    const toRS   = stops.find(rs => rs.stop_id === toId)
    if (fromRS && toRS) {
      const hopCount = Math.abs(fromRS.sequence - toRS.sequence)
      return Math.max(hopCount * 5, 10)          // ~5 BDT per stop, min 10
    }

    return 10  // absolute floor
  }

  /** Buses operating on a given route */
  getBusesForRoute(routeId: number): NBus[] {
    return this.busesForRoute.get(routeId) ?? []
  }

  /**
   * Build adjacency-list graph (stop IDs as nodes).
   * Only adjacent consecutive stops are connected (sparse → fast Dijkstra/BFS).
   * Edge cost = real BRTA fare.
   */
  buildGraph(): Record<number, { to: number; cost: number; routeId: number }[]> {
    const graph: Record<number, { to: number; cost: number; routeId: number }[]> = {}

    for (const [routeId, stops] of this.routeStopsByRoute) {
      for (let i = 0; i < stops.length - 1; i++) {
        const fromId = stops[i].stop_id
        const toId   = stops[i + 1].stop_id
        const fare   = this.getFare(routeId, fromId, toId)

        if (!graph[fromId]) graph[fromId] = []
        graph[fromId].push({ to: toId,   cost: fare, routeId })

        if (!graph[toId]) graph[toId] = []
        graph[toId].push({ to: fromId, cost: fare, routeId })
      }
    }

    return graph
  }

  /**
   * Returns the ordered stop IDs between from→to on a specific route.
   * Handles both forward and reverse directions.
   */
  getStopsForRoute(routeId: number, fromStopId: number, toStopId: number): number[] {
    const stops = this.routeStopsByRoute.get(routeId) ?? []
    const fromIdx = stops.findIndex(rs => rs.stop_id === fromStopId)
    const toIdx   = stops.findIndex(rs => rs.stop_id === toStopId)

    if (fromIdx === -1 || toIdx === -1) return [fromStopId, toStopId]

    if (fromIdx <= toIdx) {
      return stops.slice(fromIdx, toIdx + 1).map(rs => rs.stop_id)
    } else {
      return stops.slice(toIdx, fromIdx + 1).map(rs => rs.stop_id).reverse()
    }
  }
  
  /**
   * Find buses that cover the segment from→to in their sequence.
   */
  getBusesForSegment(fromId: number, toId: number): NBus[] {
    const results: NBus[] = []
    
    for (const [busId, stops] of this.busStopsByBus) {
      // Find ALL occurrences of from and to
      const fromIndices = stops.map((s, i) => s.stop_id === fromId ? i : -1).filter(i => i !== -1)
      const toIndices = stops.map((s, i) => s.stop_id === toId ? i : -1).filter(i => i !== -1)
      
      // Check if any 'from' comes before any 'to'
      let found = false
      for (const f of fromIndices) {
        for (const t of toIndices) {
          if (f < t) {
            found = true
            break
          }
        }
        if (found) break
      }

      if (found) {
        const bus = this.buses.find(b => b.id === busId)
        if (bus) results.push(bus)
      }
    }
    
    return results
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────

export const ndp = new NormalizedDataProcessor()
