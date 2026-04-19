export interface TimePort {
  /** Estimate travel time in minutes for a given segment */
  estimate(timeTable: Map<string, number>, segment: { from: string; to: string; stopCount: number }): number
}
