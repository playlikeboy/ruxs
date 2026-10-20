/**
 * Pure rules for workshop capacity, seat availability, and enrollment deadlines.
 */

export interface WorkshopAvailabilityResult {
  available: boolean;
  remainingSeats: number;
  isFull: boolean;
  isAlmostFull: boolean;
  label: string;
}

/**
 * Calculates current capacity status for a workshop.
 */
export function calculateWorkshopAvailability(
  capacity: number,
  enrolledCount: number
): WorkshopAvailabilityResult {
  const safeCapacity = Math.max(1, capacity);
  const safeEnrolled = Math.max(0, enrolledCount);
  const remainingSeats = Math.max(0, safeCapacity - safeEnrolled);
  const isFull = remainingSeats === 0;
  const isAlmostFull = remainingSeats > 0 && remainingSeats <= 3;

  let label = `${remainingSeats} seats available`;
  if (isFull) label = "Workshop Full";
  else if (remainingSeats === 1) label = "Only 1 seat left!";
  else if (isAlmostFull) label = `Only ${remainingSeats} seats left!`;

  return {
    available: !isFull,
    remainingSeats,
    isFull,
    isAlmostFull,
    label,
  };
}

/**
 * Validates whether enrollment is currently permitted.
 */
export function canEnrollInWorkshop(
  capacity: number,
  enrolledCount: number,
  deadline: Date,
  now: Date = new Date()
): { canEnroll: boolean; reason?: string } {
  if (now > deadline) {
    return {
      canEnroll: false,
      reason: "Enrollment deadline for this workshop has passed.",
    };
  }

  const { isFull } = calculateWorkshopAvailability(capacity, enrolledCount);
  if (isFull) {
    return {
      canEnroll: false,
      reason: "Workshop has reached maximum capacity.",
    };
  }

  return { canEnroll: true };
}
