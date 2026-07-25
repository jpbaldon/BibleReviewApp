/**
 * Points awarded for a correct answer based on how many prior wrong attempts
 * the user made on this question (0 = first try).
 */
export function pointsForAttempt(basePoints: number, attempts: number): number {
  switch (attempts) {
    case 0:
      return basePoints;
    case 1:
      return basePoints * 0.4;
    case 2:
      return basePoints * 0.2;
    default:
      return 0;
  }
}
