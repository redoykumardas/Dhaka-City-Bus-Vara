import { Graph, PathStep } from "@/domain/types"
import { RoutingPort } from "./routing.port"
import { PriorityQueue } from "@/shared/utils/priorityQueue"

/**
 * Dijkstra's Algorithm for finding the cheapest path.
 */
export const dijkstraAdapter: RoutingPort = {
  findAll(graph: Graph, from: string, to: string, maxPaths = 3): PathStep[][] {
    if (!graph[from] || !graph[to]) return []
    if (from === to) return [[{ stop: from, routeId: 0 }]]

    const results: PathStep[][] = []
    const pq = new PriorityQueue<{ path: PathStep[], cost: number }>()
    
    pq.push({ path: [{ stop: from, routeId: 0 }], cost: 0 }, 0)
    const minCosts = new Map<string, number>() // "stop|||routeId" -> cost

    while (!pq.isEmpty() && results.length < maxPaths) {
      const { path, cost } = pq.pop()!
      const lastStep = path[path.length - 1]
      const current = lastStep.stop
      
      if (current === to) {
        results.push(path) // Keep the full path including the starting dummy step for buildRoutesUseCase
        continue
      }

      const stateKey = `${current}|||${lastStep.routeId}`
      if (minCosts.has(stateKey) && minCosts.get(stateKey)! < cost) continue
      minCosts.set(stateKey, cost)

      const neighbors = graph[current] ?? []
      for (const neighbor of neighbors) {
        // Avoid cycles in the current path
        if (path.some(p => p.stop === neighbor.to)) continue
        
        let edgeCost = neighbor.cost
        
        // Transfer penalty: Changing routes is costly in time/inconvenience.
        // We set it to 10 (equivalent to a 10-stop distance) to prioritize direct routes.
        if (lastStep.routeId !== 0 && lastStep.routeId !== neighbor.routeId) {
          edgeCost += 10
        }

        const nextCost = cost + edgeCost 
        const nextStateKey = `${neighbor.to}|||${neighbor.routeId}`

        if (!minCosts.has(nextStateKey) || minCosts.get(nextStateKey)! > nextCost) {
            // We don't set minCosts here yet, we let the pop handle it to allow exploring multiple routes to same stop
            pq.push({ 
              path: [...path, { stop: neighbor.to, routeId: neighbor.routeId }], 
              cost: nextCost 
            }, nextCost)
        }
      }
    }

    return results.slice(0, maxPaths)
  },
}


