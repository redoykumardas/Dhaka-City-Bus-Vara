import { BusOperator } from "@/domain/types"
import { segmentKey } from "@/domain/types"
import { BusPort } from "./bus.port"

export const staticBusAdapter: BusPort = {
  get(busDB: Map<string, BusOperator[]>, segment: { from: string; to: string }): BusOperator[] {
    const key = segmentKey(segment.from, segment.to)
    return busDB.get(key) ?? []
  },
}
