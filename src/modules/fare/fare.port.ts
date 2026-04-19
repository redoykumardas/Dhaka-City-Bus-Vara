export interface FarePort {
  /** Calculate fare in BDT for a given segment */
  calculate(fareTable: Map<string, number>, segment: { from: string; to: string }): number
}
