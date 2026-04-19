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
}

export function buildRoutesUseCase(input: BuildRoutesInput): RouteResult[] {
  const { routing, bus, fare, time, graph, busDB, fareTable, timeTable, from, to, maxPaths = 3, sortBy = "fare" } =
    input

  if (!from || !to || from === to) return []

  const paths = routing.findAll(graph, from, to, maxPaths)

  if (paths.length === 0) return []

  const routes: RouteResult[] = paths.map((path, idx) => {
    const segments: SegmentResult[] = []

    for (let i = 0; i < path.length - 1; i++) {
      const seg = { from: path[i], to: path[i + 1] }
      segments.push({
        ...seg,
        buses: bus.get(busDB, seg),
        fare: fare.calculate(fareTable, seg),
        estimatedMinutes: time.estimate(timeTable, seg),
      })
    }

    const totalFare = segments.reduce((acc, s) => acc + s.fare, 0)
    const totalTime = segments.reduce((acc, s) => acc + s.estimatedMinutes, 0)
    const transfers = Math.max(0, path.length - 2) // number of stops where you might need to change

    return {
      id: `route-${idx}-${path.join("-").replace(/\s+/g, "_").toLowerCase()}`,
      path,
      segments,
      totalFare,
      totalTime,
      transfers,
    }
  })

  // Sort
  return routes.sort((a, b) => {
    if (sortBy === "time") return a.totalTime - b.totalTime
    if (sortBy === "transfers") return a.transfers - b.transfers
    return a.totalFare - b.totalFare // default: cheapest
  })
}
