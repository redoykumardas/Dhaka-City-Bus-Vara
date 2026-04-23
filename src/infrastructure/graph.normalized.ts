/**
 * graph.normalized.ts
 *
 * Builds the in-memory graph and helper functions from the normalized data.
 * This is a drop-in replacement for graph.data.ts but sourced from the
 * clean relational data in data/normalized/.
 */

import { Graph, BusOperator, segmentKey } from "@/domain/types"
import { ndp } from "./normalizedDataProcessor"

// ─── Module-level caches ──────────────────────────────────────────────────────

let _graph:   Graph | null = null
let _busDB:   Map<string, BusOperator[]> | null = null
let _stops:   string[] | null = null

// ─── Graph ────────────────────────────────────────────────────────────────────

/**
 * Returns the adjacency-list Graph keyed by English stop names.
 */
export function getNormalizedGraph(): Graph {
  if (_graph) return _graph

  const rawGraph = ndp.buildGraph()       // stop IDs as keys
  const graph: Graph = {}

  for (const [fromIdStr, edges] of Object.entries(rawGraph)) {
    const fromStop = ndp.getStopById(Number(fromIdStr))
    if (!fromStop) continue

    const fromName = fromStop.name_en
    if (!graph[fromName]) graph[fromName] = []

    for (const edge of edges) {
      const toStop = ndp.getStopById(edge.to)
      if (!toStop) continue

      graph[fromName].push({
        to:      toStop.name_en,
        cost:    edge.cost,
        routeId: edge.routeId,
      })
    }
  }

  _graph = graph
  return _graph
}

// ─── Bus DB ───────────────────────────────────────────────────────────────────

/**
 * Returns a map: segmentKey(from, to) → BusOperator[]
 * Used by the UI to show "which bus" operates a segment.
 */
export function getNormalizedBusDB(): Map<string, BusOperator[]> {
  if (_busDB) return _busDB

  const db = new Map<string, BusOperator[]>()

  for (const route of ndp.routes) {
    const routeStops = ndp.getRouteStops(route.id)
    const nBuses     = ndp.getBusesForRoute(route.id)
    if (nBuses.length === 0 || routeStops.length === 0) continue

    const operators: BusOperator[] = nBuses.map(b => ({
      name:    b.name_en,
      name_bn: b.name_bn,
    }))

    // Connect every pair of stops on this route (both directions)
    for (let i = 0; i < routeStops.length; i++) {
      const fromStop = ndp.getStopById(routeStops[i].stop_id)
      if (!fromStop) continue

      for (let j = 0; j < routeStops.length; j++) {
        if (i === j) continue
        const toStop = ndp.getStopById(routeStops[j].stop_id)
        if (!toStop) continue

        const key = segmentKey(fromStop.name_en, toStop.name_en)
        const existing = db.get(key) ?? []
        for (const op of operators) {
          if (!existing.find(x => x.name === op.name)) existing.push(op)
        }
        if (!db.has(key)) db.set(key, existing)
      }
    }
  }

  _busDB = db
  return _busDB
}

// ─── Stop list ────────────────────────────────────────────────────────────────

/**
 * Returns all English stop names, sorted alphabetically.
 * Used to populate the search autocomplete.
 */
export function getNormalizedStops(): string[] {
  if (_stops) return _stops
  _stops = ndp.getAllStopNames()
  return _stops
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Expand a route segment into the full list of intermediate stop names.
 */
export function expandNormalizedPath(
  routeId: number,
  fromName: string,
  toName: string,
): string[] {
  const fromStop = ndp.getStopByName(fromName)
  const toStop   = ndp.getStopByName(toName)

  if (!fromStop || !toStop) return [fromName, toName]

  const ids = ndp.getStopsForRoute(routeId, fromStop.id, toStop.id)
  return ids
    .map(id => ndp.getStopById(id)?.name_en ?? "")
    .filter(Boolean)
}

/**
 * Get the BRTA fare for a specific route segment.
 */
export function getNormalizedFare(
  routeId: number,
  fromName: string,
  toName: string,
): number {
  const fromStop = ndp.getStopByName(fromName)
  const toStop   = ndp.getStopByName(toName)

  if (!fromStop || !toStop) return 10
  return ndp.getFare(routeId, fromStop.id, toStop.id)
}

/**
 * Build a fare table: segmentKey → fare (BDT).
 * Needed by the simpleFare + simpleTime adapters.
 */
export function buildNormalizedFareTable(): Map<string, number> {
  const table = new Map<string, number>()

  for (const fare of ndp.fares) {
    const fromStop = ndp.getStopById(fare.from_stop_id)
    const toStop   = ndp.getStopById(fare.to_stop_id)
    if (!fromStop || !toStop) continue

    const key = segmentKey(fromStop.name_en, toStop.name_en)
    const existing = table.get(key) ?? Infinity
    if (fare.fare < existing) table.set(key, fare.fare)

    // Symmetric
    const keyR = segmentKey(toStop.name_en, fromStop.name_en)
    const existingR = table.get(keyR) ?? Infinity
    if (fare.fare < existingR) table.set(keyR, fare.fare)
  }

  return table
}

// ─── Route metadata ───────────────────────────────────────────────────────────

/** Route metadata keyed by route ID — used to attach route number/name to segments */
export function getRouteMeta(
  routeId: number,
): { routeNumber: string; routeName: string } | undefined {
  const route = ndp.routes.find(r => r.id === routeId)
  if (!route) return undefined
  return { routeNumber: route.route_number, routeName: route.name_en }
}

/**
 * Returns ALL bus operators for a given route ID (from 5_buses + 6_bus_routes).
 * Used by the detail page to show complete bus list per segment.
 */
export function getRouteBuses(routeId: number): import("@/domain/types").BusOperator[] {
  return ndp.getBusesForRoute(routeId).map(b => ({
    name:        b.name_en,
    name_bn:     b.name_bn,
    serviceType: b.service_type,
  }))
}
