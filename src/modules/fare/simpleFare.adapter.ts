import { FarePort } from "./fare.port"
import { estimateFare } from "@/infrastructure/fare.data"

export const simpleFareAdapter: FarePort = {
  calculate(fareTable: Map<string, number>, segment: { from: string; to: string }): number {
    return estimateFare(fareTable, segment.from, segment.to)
  },
}
