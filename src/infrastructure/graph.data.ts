import { Graph, BusOperator, segmentKey } from "@/domain/types"
import { instance as dp } from "./dataProcessor"
import { ALIASES } from "@/domain/stopNormalizer"

/**
 * Returns the graph using Stop IDs as nodes.
 */
let cachedGraph: Graph | null = null
let cachedBusDB: Map<string, BusOperator[]> | null = null
let cachedStops: string[] | null = null

/**
 * Returns the graph using Stop IDs as nodes.
 */
export function getGraph(): Graph {
  if (cachedGraph) return cachedGraph

  const innerGraph = dp.buildGraph()
  const graph: Graph = {}
  
  // Optimization: use a map for stop lookup
  const stopLookup = new Map<number, string>()
  dp.stops.forEach(s => stopLookup.set(s.stop_id, s.stop_name))

  Object.entries(innerGraph).forEach(([fromId, edges]) => {
    const fromName = stopLookup.get(Number(fromId))
    if (!fromName) return
    
    if (!graph[fromName]) graph[fromName] = []
    
    edges.forEach(edge => {
      const toName = stopLookup.get(edge.to)
      if (!toName) return

      graph[fromName].push({
        to: toName,
        cost: edge.cost,
        routeId: edge.routeId
      })
    })
  })

  cachedGraph = graph
  return graph
}

/**
 * Returns the Bus DB using normalized stop names.
 */
export function getBusDB(): Map<string, BusOperator[]> {
  if (cachedBusDB) return cachedBusDB

  const db = new Map<string, BusOperator[]>()
  const stopLookup = new Map<number, string>()
  dp.stops.forEach(s => stopLookup.set(s.stop_id, s.stop_name))

  // Group stops by route
  const routeGroups = new Map<number, number[]>()
  dp.routeStops.forEach(rs => {
    if (!routeGroups.has(rs.route_id)) routeGroups.set(rs.route_id, [])
    routeGroups.get(rs.route_id)!.push(rs.stop_id)
  })

  routeGroups.forEach((stopIds, routeId) => {
    const routeBus = dp.routeBusList.find(rb => rb.route_id === routeId)
    const bus = dp.buses.find(b => b.bus_id === routeBus?.bus_id)
    if (!bus) return

    const op: BusOperator = {
      name: bus.bus_name,
      name_bn: "", 
    }

    // All pairs (i, j) are reachable on the same route
    for (let i = 0; i < stopIds.length; i++) {
      const fromName = stopLookup.get(stopIds[i])
      if (!fromName) continue

      for (let j = 0; j < stopIds.length; j++) {
        if (i === j) continue
        
        const toName = stopLookup.get(stopIds[j])
        if (!toName) continue

        const key = segmentKey(fromName, toName)
        let list = db.get(key)
        if (!list) {
          list = []
          db.set(key, list)
        }
        
        if (!list.find(x => x.name === op.name)) {
          list.push(op)
        }
      }
    }
  })

  cachedBusDB = db
  return db
}

export function expandRoutePath(routeId: number, fromName: string, toName: string): string[] {
  const fromId = dp.getStopIdByName(fromName)
  const toId = dp.getStopIdByName(toName)
  if (fromId === undefined || toId === undefined) return [fromName, toName]
  
  const ids = dp.getStopsForRoute(routeId, fromId, toId)
  return ids.map(id => dp.getStopNameById(id) || "").filter(Boolean)
}

export function getFareForRoute(routeId: number, fromName: string, toName: string): number {
  const fromId = dp.getStopIdByName(fromName)
  const toId = dp.getStopIdByName(toName)
  if (fromId === undefined || toId === undefined) return 10
  return (dp as any).findFare(routeId, fromId, toId)
}

export function getAllStops(): string[] {
  if (cachedStops) return cachedStops
  
  const stopSet = new Set<string>()
  dp.stops.forEach(s => {
    stopSet.add(s.stop_name)
    
    // Also add Bengali aliases for bilingual search support
    const aliases = ALIASES[s.stop_name] || []
    const bengali = aliases.find(a => /[\u0980-\u09FF]/.test(a))
    if (bengali) {
      stopSet.add(bengali)
    }
  })
  
  cachedStops = Array.from(stopSet).sort()
  return cachedStops
}
