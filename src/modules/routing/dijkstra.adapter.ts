import { Graph } from "@/domain/types"
import { RoutingPort } from "./routing.port"

/**
 * Yen's K-Shortest Paths (simplified BFS variant for Dhaka bus graph).
 * 
 * Uses BFS with path tracking to find multiple shortest paths between stops.
 * Limits search depth to prevent exponential blow-up on large graphs.
 */
export const dijkstraAdapter: RoutingPort = {
  findAll(graph: Graph, from: string, to: string, maxPaths = 3): string[][] {
    if (!graph[from] || !graph[to]) return []
    if (from === to) return [[from]]

    const results: string[][] = []
    const MAX_DEPTH = 8 // Max stops in a path (prevents infinite loops)

    // BFS queue: [currentPath]
    const queue: string[][] = [[from]]
    // Track shortest path length found so far (allow slightly longer paths)
    let shortestFound = Infinity

    while (queue.length > 0 && results.length < maxPaths) {
      const path = queue.shift()!
      const current = path[path.length - 1]

      // Prune: don't explore paths longer than shortest + 2 extra stops
      if (path.length > Math.min(MAX_DEPTH, shortestFound + 2)) continue

      const neighbors = graph[current] ?? []

      for (const neighbor of neighbors) {
        // Skip visited stops to prevent cycles
        if (path.includes(neighbor)) continue

        const newPath = [...path, neighbor]

        if (neighbor === to) {
          results.push(newPath)
          if (newPath.length < shortestFound) {
            shortestFound = newPath.length
          }
        } else {
          queue.push(newPath)
        }
      }
    }

    // Sort by path length (fewest stops first = fewest transfers)
    results.sort((a, b) => a.length - b.length)
    return results.slice(0, maxPaths)
  },
}
