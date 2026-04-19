import { Graph, PathStep } from "@/domain/types"

export interface RoutingPort {
  /**
   * Find paths from A to B.
   * Returns an array of paths, where each path is a sequence of PathSteps.
   */
  findAll(graph: Graph, from: string, to: string, maxPaths?: number): PathStep[][]
}
