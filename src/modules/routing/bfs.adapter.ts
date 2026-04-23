/**
 * BFS (Breadth-First Search) Routing Adapter
 *
 * Finds routes with the FEWEST TRANSFERS (not cheapest fare).
 *
 * Algorithm:
 *   Each BFS node tracks: current stop, current route, path so far, transfers.
 *   Visited state = (stop, routeId) to allow the same stop via different routes.
 *   The first time we reach the destination is the minimum-transfer path.
 *   We continue until we have collected `maxPaths` alternative routes.
 *
 * Complexity: O(V + E) per search — very fast for this dataset size.
 */

import { Graph, PathStep } from "@/domain/types"
import { RoutingPort } from "./routing.port"

export const bfsAdapter: RoutingPort = {
  findAll(graph: Graph, from: string, to: string, maxPaths = 3): PathStep[][] {
    if (!graph[from] || !graph[to]) return []
    if (from === to) return [[{ stop: from, routeId: 0 }]]

    const results: PathStep[][] = []

    // BFS queue entries
    interface QueueEntry {
      stop:          string
      path:          PathStep[]
      currentRoute:  number        // 0 = not on any route yet
      transfers:     number
    }

    const queue: QueueEntry[] = [
      { stop: from, path: [{ stop: from, routeId: 0 }], currentRoute: 0, transfers: 0 },
    ]

    // Visited: "stop|routeId" → minimum transfers seen so far
    // Allowing slight extra transfers to discover alternative routes
    const visited = new Map<string, number>()

    // Track minimum transfers to destination so we don't wander too far
    let minTransfersFound = Infinity
    const MAX_EXTRA_TRANSFERS = 1   // allow at most 1 extra transfer beyond best

    while (queue.length > 0 && results.length < maxPaths) {
      const node = queue.shift()!

      // Prune: too many transfers above best found
      if (node.transfers > minTransfersFound + MAX_EXTRA_TRANSFERS) continue

      // Destination reached
      if (node.stop === to) {
        results.push(node.path)
        minTransfersFound = Math.min(minTransfersFound, node.transfers)
        continue
      }

      const neighbors = graph[node.stop] ?? []

      for (const next of neighbors) {
        // Avoid cycles in current path
        if (node.path.some(p => p.stop === next.to)) continue

        const isTransfer = node.currentRoute !== 0 && node.currentRoute !== next.routeId
        const newTransfers = node.transfers + (isTransfer ? 1 : 0)

        // Prune excessive transfer paths
        if (newTransfers > minTransfersFound + MAX_EXTRA_TRANSFERS) continue

        const stateKey = `${next.to}|${next.routeId}`
        const prevBest = visited.get(stateKey) ?? Infinity

        // Allow re-visiting if this path uses fewer (or equal + 1) transfers
        if (newTransfers > prevBest + 1) continue
        visited.set(stateKey, Math.min(prevBest, newTransfers))

        queue.push({
          stop:         next.to,
          path:         [...node.path, { stop: next.to, routeId: next.routeId }],
          currentRoute: next.routeId,
          transfers:    newTransfers,
        })
      }
    }

    // Sort by transfers first, then path length (fewer stops = better)
    results.sort((a, b) => {
      const tA = countTransfers(a)
      const tB = countTransfers(b)
      if (tA !== tB) return tA - tB
      return a.length - b.length
    })

    return results.slice(0, maxPaths)
  },
}

function countTransfers(path: PathStep[]): number {
  let transfers = 0
  for (let i = 2; i < path.length; i++) {
    if (path[i].routeId !== path[i - 1].routeId && path[i].routeId !== 0) {
      transfers++
    }
  }
  return transfers
}
