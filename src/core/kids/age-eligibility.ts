/**
 * Pure business rules for age and school-class eligibility (Nursery to Class 5 / ages 3-11).
 * Strictly pure: no database, network or framework dependencies.
 */

export const STANDARD_SCHOOL_CLASSES = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
] as const;

export type SchoolClass = (typeof STANDARD_SCHOOL_CLASSES)[number];

/**
 * Checks whether a child's age falls within the eligible range [minAge, maxAge].
 */
export function isAgeEligible(childAge: number, minAge: number, maxAge: number): boolean {
  if (!Number.isFinite(childAge) || childAge <= 0) return false;
  return childAge >= minAge && childAge <= maxAge;
}

/**
 * Checks whether a child's class is among the eligible classes.
 * If eligibleClasses is empty, class is unrestricted.
 */
export function isClassEligible(childClass: string | null | undefined, eligibleClasses: string[]): boolean {
  if (!eligibleClasses || eligibleClasses.length === 0) return true;
  if (!childClass) return false;
  const normalizedChild = childClass.trim().toLowerCase();
  return eligibleClasses.some((c) => c.trim().toLowerCase() === normalizedChild);
}

/**
 * Calculates a child's approximate age from birth year or YYYY-MM-DD birth date.
 */
export function calculateAge(dobOrYear: string | number | null | undefined, referenceDate: Date = new Date()): number {
  if (!dobOrYear) return 0;
  const currentYear = referenceDate.getFullYear();

  if (typeof dobOrYear === "number") {
    return Math.max(0, currentYear - dobOrYear);
  }

  // Handle YYYY-MM-DD string
  if (typeof dobOrYear === "string") {
    const parts = dobOrYear.split("-");
    if (parts.length >= 1) {
      const year = parseInt(parts[0]!, 10);
      if (!isNaN(year) && year > 1900 && year <= currentYear) {
        if (parts.length === 3) {
          const birthDate = new Date(dobOrYear);
          if (!isNaN(birthDate.getTime())) {
            let age = currentYear - birthDate.getFullYear();
            const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
              age--;
            }
            return Math.max(0, age);
          }
        }
        return Math.max(0, currentYear - year);
      }
    }
  }

  return 0;
}

/**
 * Formats a clean age range label (e.g. "Ages 3–5", "Ages 6–11", "Age 4").
 */
export function formatAgeRange(minAge: number, maxAge: number): string {
  if (minAge === maxAge) return `Age ${minAge}`;
  return `Ages ${minAge}–${maxAge}`;
}

/**
 * Formats eligible classes into a readable string (e.g. "Nursery–Class 2" or "Class 1 to 5").
 */
export function formatClassesList(classes: string[]): string {
  if (!classes || classes.length === 0) return "All Primary Classes (Nursery–Class 5)";
  if (classes.length <= 3) return classes.join(", ");
  return `${classes[0]} to ${classes[classes.length - 1]}`;
}
