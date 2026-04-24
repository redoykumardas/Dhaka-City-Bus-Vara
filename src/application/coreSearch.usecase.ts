import { ndp } from "@/infrastructure/normalizedDataProcessor"
import { RouteResult, SegmentResult, PathStep, BusOperator } from "@/domain/types"

/**
 * Core Search Logic implementation as provided by the user.
 * Adapted for the project's data structures and types.
 */

interface GraphNode {
  stop: number
  route: number
}

function buildGraph() {
  const graph: Record<number, GraphNode[]> = {}
  
  // Mapping for merging duplicate stops (e.g. Abdullahpur Uttara and Abdullahpur)
  const mergeMap: Record<number, number> = {
    21: 20, // Abdullahpur (Uttara) -> Abdullahpur
  }

  // Ensure routeStops are sorted by route and sequence
  const sorted = [...ndp.routeStops].sort((a, b) => 
    a.route_id - b.route_id || a.sequence - b.sequence
  )

  for (let i = 0; i < sorted.length - 1; i++) {
    let a = sorted[i]
    let b = sorted[i + 1]

    if (a.route_id === b.route_id) {
      const aId = mergeMap[a.stop_id] || a.stop_id
      const bId = mergeMap[b.stop_id] || b.stop_id

      // Skip self-loops if both stops merged to same ID
      if (aId === bId) continue

      if (!graph[aId]) graph[aId] = []
      graph[aId].push({
        stop: bId,
        route: a.route_id
      })

      // Add reverse edge for bidirectional travel
      if (!graph[bId]) graph[bId] = []
      graph[bId].push({
        stop: aId,
        route: a.route_id
      })
    }
  }

  return graph
}

interface BFSNode {
  stop: number
  path: number[]
  routes: number[]
  currentRoute: number | null
  transfers: number
}

function findRoutes(graph: Record<number, GraphNode[]>, source: number, destination: number) {
  let queue0: BFSNode[] = []
  let queue1: BFSNode[] = []
  let results: BFSNode[] = []
  let bestTransfers = new Map<string, number>()

  queue0.push({
    stop: source,
    path: [source],
    routes: [],
    currentRoute: null,
    transfers: 0
  })

  while (queue0.length > 0 || queue1.length > 0) {
    let node = queue0.length > 0 ? queue0.shift()! : queue1.shift()!

    if (node.stop === destination) {
      results.push(node)
      // Stop if we found a good number of results to keep it fast
      if (results.length > 20) break 
      continue
    }

    for (let next of graph[node.stop] || []) {
      let isTransfer =
        node.currentRoute !== null &&
        node.currentRoute !== next.route

      let newTransfers = node.transfers + (isTransfer ? 1 : 0)

      // Max 1 transfer as per user rule
      if (newTransfers > 1) continue

      let key = `${next.stop}-${next.route}`
      let prevTransfers = bestTransfers.get(key)
      
      if (prevTransfers !== undefined && prevTransfers <= newTransfers) {
        continue
      }

      bestTransfers.set(key, newTransfers)

      const nextNode = {
        stop: next.stop,
        path: [...node.path, next.stop],
        routes: [...node.routes, next.route],
        currentRoute: next.route,
        transfers: newTransfers
      }

      if (newTransfers === 0) {
        queue0.push(nextNode)
      } else {
        queue1.push(nextNode)
      }
    }
  }

  return results
}

function getFareDistance(path: number[]) {
  let totalFare = 0
  let totalDistance = 0

  // Note: path in the user logic is the full stop path
  // But wait, the user's findRoutes path is the sequence of stops visited by the BFS
  // If BFS visits A -> B -> C on route R1, path is [A, B, C]
  // Fare is calculated between each consecutive stop in the path
  
  for (let i = 0; i < path.length - 1; i++) {
    // We don't have the routeId here, but ndp.getFare can handle it or use a default
    // The user's getFareDistance uses routeFares.find without route_id? 
    // Actually, user's logic in section 4: x.from_stop_id === path[i] && x.to_stop_id === path[i+1]
    // In our case, we can use ndp.getFare(0, path[i], path[i+1]) which finds best fare across routes
    const fare = ndp.getFare(0, path[i], path[i+1])
    totalFare += fare
    // Distance estimate based on fare (2.45 BDT/km)
    totalDistance += fare / 2.45
  }

  return { totalFare, totalDistance }
}

function getStopsBetween(routeId: number, from: number, to: number) {
  return ndp.getStopsForRoute(routeId, from, to)
}

function getBuses(routeId: number, fromId: number, toId: number): BusOperator[] {
  let buses = ndp.getBusesForSegment(fromId, toId)
  
  // Fallback: If exact stop mapping misses (e.g. Uttara vs Azampur), use buses for the BRTA route.
  if (buses.length === 0 && routeId) {
    buses = ndp.getBusesForRoute(routeId)
  }
  
  return buses.map(b => ({
    name: b.name_en,
    name_bn: b.name_bn,
    serviceType: b.service_type
  }))
}

interface EnrichedResult extends RouteResult {
  label?: string
  type: "direct" | "transfer"
}

function buildResult(node: BFSNode): EnrichedResult {

  // Split into steps (by route change)
  let rawSteps: { route: number; from: number; to: number }[] = []
  let start = 0

  if (node.routes.length > 0) {
    for (let i = 1; i < node.routes.length; i++) {
      if (node.routes[i] !== node.routes[i - 1]) {
        rawSteps.push({
          route: node.routes[i - 1],
          from: node.path[start],
          to: node.path[i],
        })
        start = i
      }
    }

    // Last step
    rawSteps.push({
      route: node.routes[node.routes.length - 1],
      from: node.path[start],
      to: node.path[node.path.length - 1]
    })
  }

  // Enrich steps into segments
  const segments: SegmentResult[] = rawSteps.map(step => {
    const stops = getStopsBetween(step.route, step.from, step.to)
    const fromName = ndp.getStopById(step.from)?.name_en || ""
    const toName = ndp.getStopById(step.to)?.name_en || ""
    const fare = ndp.getFare(step.route, step.from, step.to)
    const buses = getBuses(step.route, step.from, step.to)
    const routeInfo = ndp.routes.find(r => r.id === step.route)

    return {
      from: fromName,
      to: toName,
      path: stops.map(id => ndp.getStopById(id)?.name_en || ""),
      buses,
      fare,
      estimatedMinutes: Math.round((fare / 2.45) * 3), // rough estimate
      distanceKm: Number((fare / 2.45).toFixed(1)),
      routeId: step.route,
      routeNumber: routeInfo?.route_number,
      routeName: routeInfo?.name_en
    }
  })

  const path = segments.flatMap((s, i) => i === 0 ? s.path : s.path.slice(1))
  const finalFare = segments.reduce((acc, s) => acc + s.fare, 0)
  const finalDistanceKm = Number(segments.reduce((acc, s) => acc + s.distanceKm, 0).toFixed(1))

  return {
    id: `core-${node.path.join("-")}`,
    type: node.transfers === 0 ? "direct" : "transfer",
    path,
    steps: node.path.map((id, i) => ({ 
      stop: ndp.getStopById(id)?.name_en || "", 
      routeId: i < node.routes.length ? node.routes[i] : 0 
    })),
    segments,
    totalFare: finalFare,
    totalDistanceKm: finalDistanceKm,
    totalTime: segments.reduce((acc, s) => acc + s.estimatedMinutes, 0),
    transfers: node.transfers,
    primaryRouteId: segments[0]?.routeId,
    primaryRouteNumber: segments[0]?.routeNumber
  }
}

function filterResults(results: EnrichedResult[]): EnrichedResult[] {
  let direct = results.filter(r => r.transfers === 0)
  let indirect = results.filter(r => r.transfers > 0)

  let final: EnrichedResult[] = []

  if (direct.length) {
    let bestDirect = direct.sort((a, b) => a.totalFare - b.totalFare)[0]
    bestDirect.label = "Direct Route"
    final.push(bestDirect)

    for (let r of indirect) {
      if (
        r.totalFare < bestDirect.totalFare ||
        r.totalDistanceKm < bestDirect.totalDistanceKm
      ) {
        final.push(r)
      }
    }
  } else {
    final = indirect
      .sort((a, b) => a.totalFare - b.totalFare)
      .slice(0, 3)
  }

  return final
}

export function coreSearchUseCase(fromName: string, toName: string): EnrichedResult[] {
  const fromStop = ndp.getStopByName(fromName)
  const toStop = ndp.getStopByName(toName)

  if (!fromStop || !toStop) return []
  if (fromStop.id === toStop.id) return []

  const graph = buildGraph()
  const raw = findRoutes(graph, fromStop.id, toStop.id)
  const enriched = raw.map(r => buildResult(r))

  return filterResults(enriched)
}
