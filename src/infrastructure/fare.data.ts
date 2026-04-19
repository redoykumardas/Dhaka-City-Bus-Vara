import { segmentKey } from "@/domain/types"
import { instance as dp } from "./dataProcessor"

const MIN_FARE = 10

export function getFareTable(): Map<string, number> {
  const table = new Map<string, number>()
  const graph = dp.buildGraph() // Use the raw graph from Processor

  Object.entries(graph).forEach(([fromId, edges]) => {
    const fromName = dp.getStopNameById(Number(fromId))
    if (!fromName) return

    edges.forEach(edge => {
      const toName = dp.getStopNameById(edge.to)
      if (!toName) return

      const key = segmentKey(fromName, toName)
      const existing = table.get(key) || 0
      // If we find multiple routes for the same segment, use the higher fare for safety (or average)
      // but usually we want to match what the graph uses
      if (edge.cost > existing) {
        table.set(key, edge.cost)
      }
    })
  })

  return table
}

export function estimateFare(fareTable: Map<string, number>, from: string, to: string): number {
  const key = segmentKey(from, to)
  return fareTable.get(key) ?? MIN_FARE
}
