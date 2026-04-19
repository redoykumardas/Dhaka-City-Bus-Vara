export interface TimePort {
  /**
   * Estimate travel time in minutes for a segment.
   * timeTable maps segmentKey → minutes (optional pre-computed values).
   */
  estimate(timeTable: Map<string, number>, segment: { from: string; to: string }): number
}
