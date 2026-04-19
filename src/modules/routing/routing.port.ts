import { Graph } from "@/domain/types"

export interface RoutingPort {
  /**
   * Find up to `maxPaths` paths from `from` to `to` through the graph.
   * Returns ordered arrays of stop names.
   */
  findAll(graph: Graph, from: string, to: string, maxPaths?: number): string[][]
}
