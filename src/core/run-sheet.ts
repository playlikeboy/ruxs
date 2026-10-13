export interface RunStop {
  society: string;
  tower: string;
  floor: string | number;
  flat: string;
  [key: string]: unknown;
}

/**
 * Natural comparator for strings containing numbers (e.g. "A-2" < "A-10").
 */
function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Parses floor to number for descending numerical sort.
 */
function parseFloor(floor: string | number): number {
  if (typeof floor === "number") return floor;
  const match = floor.match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Sorts delivery stops for optimal building traversal:
 * 1. Society (Alphabetical ascending)
 * 2. Tower (Natural ascending: Tower 2 before Tower 10)
 * 3. Floor (Descending: Top floor first so driver works down from elevator)
 * 4. Flat (Natural ascending: A-2 before A-10)
 */
export function sortRunSheet<T extends RunStop>(stops: T[]): T[] {
  return [...stops].sort((a, b) => {
    // 1. Society ASC
    const socDiff = a.society.localeCompare(b.society);
    if (socDiff !== 0) return socDiff;

    // 2. Tower ASC (natural)
    const towerDiff = naturalCompare(a.tower, b.tower);
    if (towerDiff !== 0) return towerDiff;

    // 3. Floor DESC (top floor first)
    const floorA = parseFloor(a.floor);
    const floorB = parseFloor(b.floor);
    if (floorA !== floorB) return floorB - floorA;

    // 4. Flat ASC (natural)
    return naturalCompare(a.flat, b.flat);
  });
}
