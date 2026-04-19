import { BusOperator } from "@/domain/types"

export interface BusPort {
  /** Get all bus operators that directly serve the given segment */
  get(
    busDB: Map<string, BusOperator[]>,
    segment: { from: string; to: string }
  ): BusOperator[]
}
