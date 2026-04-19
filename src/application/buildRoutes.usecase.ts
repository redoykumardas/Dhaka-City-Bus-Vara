import { RouteResult, SegmentResult, SortKey } from "@/domain/types"
import { Graph } from "@/domain/types"
import { RoutingPort } from "@/modules/routing/routing.port"
import { BusPort } from "@/modules/buses/bus.port"
import { FarePort } from "@/modules/fare/fare.port"
import { TimePort } from "@/modules/time/time.port"
import { BusOperator } from "@/domain/types"

interface BuildRoutesInput {
  routing: RoutingPort
  bus: BusPort
  fare: FarePort
  time: TimePort
  graph: Graph
  busDB: Map<string, BusOperator[]>
  fareTable: Map<string, number>
  timeTable: Map<string, number>
  from: string
  to: string
  maxPaths?: number
  sortBy?: SortKey
  expandPath: (routeId: number, from: string, to: string) => string[]
  getFare: (routeId: number, from: string, to: string) => number
}

export function buildRoutesUseCase(input: BuildRoutesInput): RouteResult[] {
  const { routing, bus, fare, time, graph, busDB, fareTable, timeTable, from, to, maxPaths = 3, sortBy = "fare", expandPath, getFare } =
    input

  if (!from || !to || from === to) return []

  const paths = routing.findAll(graph, from, to, maxPaths)

  if (paths.length === 0) return []

  const routes: RouteResult[] = paths.map((pathSteps, idx) => {
    const segments: SegmentResult[] = []
    
    if (pathSteps.length > 1) {
      let currentRouteId = pathSteps[1].routeId
      let currentSegmentStops = [pathSteps[0].stop]

      for (let i = 1; i < pathSteps.length; i++) {
        const step = pathSteps[i]
        const prevStep = pathSteps[i - 1]

        if (step.routeId === currentRouteId) {
          // Expand the path from previous stop to current stop on this route
          const subPath = expandPath(currentRouteId, prevStep.stop, step.stop)
          currentSegmentStops.push(...subPath.slice(1)) 
        } else {
          // Close segment
          const segBuses = bus.get(busDB, { from: currentSegmentStops[0], to: currentSegmentStops[currentSegmentStops.length - 1] })
          segments.push(createSegment(currentRouteId, currentSegmentStops, segBuses, fare, fareTable, time, timeTable, getFare))
          
          // Start next segment from where we left off
          const startSubPath = expandPath(step.routeId, prevStep.stop, step.stop)
          currentSegmentStops = startSubPath
          currentRouteId = step.routeId
        }
      }
      // Last segment
      const lastSegBuses = bus.get(busDB, { from: currentSegmentStops[0], to: currentSegmentStops[currentSegmentStops.length - 1] })
      segments.push(createSegment(currentRouteId, currentSegmentStops, lastSegBuses, fare, fareTable, time, timeTable, getFare))
    }

    const path = segments.flatMap((s, i) => i === 0 ? s.path : s.path.slice(1))

    const totalFare = segments.reduce((acc, s) => acc + s.fare, 0)
    const totalTime = segments.reduce((acc, s) => acc + (s.estimatedMinutes || 0), 0)
    const totalDistanceKm = segments.reduce((acc, s) => acc + (s.distanceKm || 0), 0)
    const transfers = segments.length - 1

    return {
      id: `${from}-${to}-${idx}`,
      path,
      steps: pathSteps,
      segments,
      totalFare,
      totalTime,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      transfers,
    }
  })


  // Sort results
  return routes.sort((a, b) => {
    if (sortBy === "fare") return a.totalFare - b.totalFare
    if (sortBy === "time") return a.totalTime - b.totalTime
    return a.transfers - b.transfers
  })
}

function createSegment(
  routeId: number,
  stops: string[], 
  buses: BusOperator[], 
  fare: FarePort, 
  fareTable: Map<string, number>,
  time: TimePort,
  timeTable: Map<string, number>,
  getFare: (routeId: number, from: string, to: string) => number
): SegmentResult {
  const from = stops[0]
  const to = stops[stops.length - 1]
  
  // Use getFare directly for maximum accuracy if available
  const segmentFare = getFare(routeId, from, to)

  return {
    from,
    to,
    path: stops,
    buses,
    fare: segmentFare,
    estimatedMinutes: time.estimate(timeTable, { from, to, stopCount: stops.length }),
    distanceKm: Number((segmentFare / 2.45).toFixed(1))
  }
}
