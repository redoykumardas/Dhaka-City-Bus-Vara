import { Graph, segmentKey } from "@/domain/types"
import { BusOperator } from "@/domain/types"
import { normalizeStop } from "@/domain/stopNormalizer"
import busListRaw from "./data/dhaka_bus_list.json"

interface RawStop { en: string; bn: string }
interface RawBus {
  operator: string
  operator_bn: string
  stops: RawStop[]
  starting_time?: string
  closing_time?: string
  service_type?: string
}

const busList = busListRaw as RawBus[]

// ─── Graph ────────────────────────────────────────────────────────────────────
// Each bus route creates bidirectional edges between CONSECUTIVE stops only.
// stop → [reachable stops via direct edge]

let _graph: Graph | null = null

export function getGraph(): Graph {
  if (_graph) return _graph
  const graph: Graph = {}

  const addEdge = (a: string, b: string) => {
    if (!graph[a]) graph[a] = []
    if (!graph[b]) graph[b] = []
    if (!graph[a].includes(b)) graph[a].push(b)
    if (!graph[b].includes(a)) graph[b].push(a)
  }

  for (const bus of busList) {
    const stops = bus.stops.map((s) => normalizeStop(s.en))
    for (let i = 0; i < stops.length - 1; i++) {
      addEdge(stops[i], stops[i + 1])
    }
  }

  _graph = graph
  return graph
}

// ─── Bus DB ───────────────────────────────────────────────────────────────────
// segmentKey(A, B) → list of bus operators that cover that segment directly

let _busDB: Map<string, BusOperator[]> | null = null

export function getBusDB(): Map<string, BusOperator[]> {
  if (_busDB) return _busDB
  const db = new Map<string, BusOperator[]>()

  const addBus = (a: string, b: string, op: BusOperator) => {
    const key = segmentKey(a, b)
    const existing = db.get(key) ?? []
    if (!existing.find((x) => x.name === op.name)) {
      existing.push(op)
    }
    db.set(key, existing)
    // bidirectional
    const rkey = segmentKey(b, a)
    const rexisting = db.get(rkey) ?? []
    if (!rexisting.find((x) => x.name === op.name)) {
      rexisting.push(op)
    }
    db.set(rkey, rexisting)
  }

  for (const bus of busList) {
    const stops = bus.stops.map((s) => normalizeStop(s.en))
    const op: BusOperator = {
      name: bus.operator,
      name_bn: bus.operator_bn,
      serviceType: bus.service_type,
      startTime: bus.starting_time,
      endTime: bus.closing_time,
    }
    for (let i = 0; i < stops.length - 1; i++) {
      addBus(stops[i], stops[i + 1], op)
    }
  }

  _busDB = db
  return db
}

/** Get all canonical stop names */
export function getAllStops(): string[] {
  const graph = getGraph()
  return Object.keys(graph).sort()
}
