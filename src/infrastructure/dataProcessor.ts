import { Bus, StopRecord, RouteRecord, RouteStop, RouteBus, FareSegment } from "@/domain/types"
import { normalizeStop, extractEnglishName } from "@/domain/stopNormalizer"
import busListRaw from "./data/dhaka_bus_list.json"
import fareData1 from "./data/fare_chart_data1.json"
import fareData2 from "./data/fare_chart_data2.json"
import fareData3 from "./data/fare_chart_data3.json"
import fareData4 from "./data/fare_chart_data4.json"
import fareData5 from "./data/fare_chart_data5.json"

export class DataProcessor {
  public buses: Bus[] = []
  public stops: StopRecord[] = []
  public routes: RouteRecord[] = []
  public routeStops: RouteStop[] = []
  public routeBusList: RouteBus[] = []
  public fareSegments: FareSegment[] = []

  private stopMap = new Map<string, number>() // normalized name -> id
  private stopByIdMap = new Map<number, Stop>() // id -> Stop object
  private busCounter = 0
  private routeCounter = 0
  private stopCounter = 0

  private routeStopsCache = new Map<number, RouteStop[]>() // routeId -> sorted RouteStops
  private stopOrderCache = new Map<string, number>() // "routeId-stopId" -> stop_order

  constructor() {
    this.process()
  }

  private getStopId(rawName: string): number {
    const normalized = normalizeStop(rawName)
    if (this.stopMap.has(normalized)) return this.stopMap.get(normalized)!
    
    const id = ++this.stopCounter
    const stop = { id, stop_id: id, stop_name: normalized }
    this.stopMap.set(normalized, id)
    this.stopByIdMap.set(id, stop)
    this.stops.push(stop)
    return id
  }

  private process() {
    const rawBuses = busListRaw as any[]

    // 1. Process Bus & Routes from dhaka_bus_list.json
    for (const raw of rawBuses) {
      const busId = ++this.busCounter
      const routeId = ++this.routeCounter
      const firstStop = raw.stops[0]?.en || ''
      const lastStop = raw.stops[raw.stops.length - 1]?.en || ''
      const generatedRouteName = firstStop && lastStop ? `${firstStop} - ${lastStop}` : raw.operator

      this.buses.push({ id: busId, bus_id: busId, bus_name: raw.operator })
      this.routes.push({ id: routeId, route_name: generatedRouteName }) 
      this.routeBusList.push({ route_id: routeId, bus_id: busId })

      raw.stops.forEach((stop: any, index: number) => {
        const stopId = this.getStopId(stop.en)
        this.routeStops.push({
          route_id: routeId,
          stop_id: stopId,
          stop_order: index + 1
        })
      })
    }

    // 2. Process Fare Segments from the 5 fare JSONs
    const allFareData = [fareData1, fareData2, fareData3, fareData4, fareData5]
    
    allFareData.forEach((data: any) => {
      const matrices = this.extractFareMatrices(data)
      matrices.forEach(item => {
        const routeId = ++this.routeCounter
        this.routes.push({ 
          id: routeId, 
          route_name: item.route_name,
          route_number: item.route_number
        })

        item.segments.forEach((segment: any) => {
          this.fareSegments.push({
            route_id: routeId,
            from_stop: this.getStopId(segment.from),
            to_stop: this.getStopId(segment.to),
            fare: segment.fare
          })
        })
      })
    })

    // 3. Populate Caches
    this.routeStops.forEach(rs => {
      if (!this.routeStopsCache.has(rs.route_id)) this.routeStopsCache.set(rs.route_id, [])
      this.routeStopsCache.get(rs.route_id)!.push(rs)
      this.stopOrderCache.set(`${rs.route_id}-${rs.stop_id}`, rs.stop_order)
    })

    this.routeStopsCache.forEach((stops) => {
      stops.sort((a, b) => a.stop_order - b.stop_order)
    })
  }

  private extractFareMatrices(data: any): { route_name?: string, route_number?: string, segments: any[] }[] {
    const results: { route_name?: string, route_number?: string, segments: any[] }[] = []

    if (data.fare_chart_data?.fare_matrix) {
      const segments: any[] = []
      data.fare_chart_data.fare_matrix.forEach((entry: any) => {
        const to = extractEnglishName(entry.stop_name)
        for (const [fromRaw, fare] of Object.entries(entry.fares_taka || {})) {
          segments.push({ from: extractEnglishName(fromRaw), to, fare })
        }
      })
      results.push({
        route_name: data.fare_chart_data.route,
        route_number: data.fare_chart_data.route_number,
        segments
      })
    }

    const charts = data.fare_charts || data.bus_fare_charts || []
    charts.forEach((chart: any) => {
      const stops = chart.stops || chart.major_stops || []
      const segments: any[] = []
      for (let i = 0; i < stops.length; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          const from = extractEnglishName(stops[i].stop_name)
          const to = extractEnglishName(stops[j].stop_name)
          const fareB = stops[j].fare_from_start ?? stops[j].fare_from_start_taka ?? 0
          const fareA = stops[i].fare_from_start ?? stops[i].fare_from_start_taka ?? 0
          segments.push({ from, to, fare: Math.max(fareB - fareA, 10) })
        }
      }
      results.push({
        route_name: chart.route || chart.route_name,
        route_number: chart.route_number || chart.route_id,
        segments
      })
    })

    return results
  }

  /**
   * Builds a sparse graph: only adjacent stops on a route are connected.
   * This ensures Dijkstra remains fast (O(E log V)) instead of O(N^2).
   */
  public buildGraph() {
    const graph: Record<number, { to: number, cost: number, routeId: number }[]> = {}

    this.routeStopsCache.forEach((stops, routeId) => {
      for (let i = 0; i < stops.length - 1; i++) {
        const from = stops[i].stop_id
        const to = stops[i + 1].stop_id
        
        // Edge cost is the REAL fare between adjacent stops
        const fare = this.findFare(routeId, from, to)
        
        if (!graph[from]) graph[from] = []
        graph[from].push({ to, cost: fare, routeId })

        // Backward
        if (!graph[to]) graph[to] = []
        graph[to].push({ to: from, cost: fare, routeId })
      }
    })

    return graph
  }

  public findFare(routeId: number, fromId: number, toId: number): number {
    // 1. Check exact match for this route
    const exact = this.fareSegments.find(fs => 
      fs.route_id === routeId && fs.from_stop === fromId && fs.to_stop === toId)
    if (exact) return exact.fare

    // 2. Check symmetric match for this route (reverse direction)
    const exactRev = this.fareSegments.find(fs => 
      fs.route_id === routeId && fs.from_stop === toId && fs.to_stop === fromId)
    if (exactRev) return exactRev.fare

    // 3. Fallback: Find ANY known fare between these two stops from other routes
    const any = this.fareSegments.find(fs => 
      (fs.from_stop === fromId && fs.to_stop === toId) || 
      (fs.from_stop === toId && fs.to_stop === fromId))
    if (any) return any.fare

    // 4. Final fallback: Estimate based on stop distance (stop count)
    const fromOrder = this.stopOrderCache.get(`${routeId}-${fromId}`)
    const toOrder = this.stopOrderCache.get(`${routeId}-${toId}`)

    if (fromOrder !== undefined && toOrder !== undefined) {
      const stopCount = Math.abs(fromOrder - toOrder)
      // 2.45 BDT/km * ~1.5km/stop = ~3.7 BDT/stop. We use 4 for rounding/simplicity.
      return Math.max(stopCount * 4, 10)
    }

    return 10
  }

  public getStopsForRoute(routeId: number, fromStopId: number, toStopId: number): number[] {
    const stops = this.routeStopsCache.get(routeId)
    if (!stops) return [fromStopId, toStopId]
    
    const fromIdx = stops.findIndex(s => s.stop_id === fromStopId)
    const toIdx = stops.findIndex(s => s.stop_id === toStopId)

    if (fromIdx === -1 || toIdx === -1) return [fromStopId, toStopId]

    if (fromIdx < toIdx) {
      return stops.slice(fromIdx, toIdx + 1).map(s => s.stop_id)
    } else {
      return stops.slice(toIdx, fromIdx + 1).map(s => s.stop_id).reverse()
    }
  }

  public getStopIdByName(name: string): number | undefined {
    const normalized = normalizeStop(name)
    return this.stopMap.get(normalized)
  }

  public getStopNameById(id: number): string | undefined {
    return this.stopByIdMap.get(id)?.stop_name
  }
}


export const instance = new DataProcessor()
