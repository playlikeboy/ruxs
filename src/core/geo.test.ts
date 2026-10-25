import { describe, it, expect } from "bun:test";
import {
  storeReach,
  searchRadiusKm,
  searchRadiusOptions,
  haversineDistanceKm,
  resolveCoordinates,
  findNearestLocality,
  isWithinGeofence,
} from "./geo";

const LOCALITIES = [
  { id: "blr-hsr", name: "HSR Layout", city: "Bengaluru", state: "Karnataka", latitude: 12.9121, longitude: 77.6446 },
  { id: "blr-bel", name: "Bellandur", city: "Bengaluru", state: "Karnataka", latitude: 12.9304, longitude: 77.6784 },
  { id: "mum-pow", name: "Powai", city: "Mumbai", state: "Maharashtra", latitude: 19.1176, longitude: 72.906 },
];

describe("geo spatial rules", () => {
  it("calculates accurate distance between HSR Layout and Koramangala (~3.5 km)", () => {
    // HSR Layout: 12.9121, 77.6446
    // Koramangala: 12.9352, 77.6245
    const distance = haversineDistanceKm(12.9121, 77.6446, 12.9352, 77.6245);
    expect(distance).toBeGreaterThan(2.5);
    expect(distance).toBeLessThan(4.5);
  });

  it("calculates distance between Bengaluru and Mumbai (~840 km)", () => {
    // blr: 12.9716, 77.5946
    // mum: 19.0760, 72.8777
    const distance = haversineDistanceKm(12.9716, 77.5946, 19.076, 72.8777);
    expect(distance).toBeGreaterThan(800);
    expect(distance).toBeLessThan(900);
  });

  it("resolves coordinates by area name", () => {
    const coords = resolveCoordinates("Bengaluru", "HSR Layout Sector 2", LOCALITIES)!;
    expect(coords.latitude).toBeCloseTo(12.9121, 2);
    expect(coords.longitude).toBeCloseTo(77.6446, 2);
  });

  it("resolves coordinates by city name fallback", () => {
    const coords = resolveCoordinates("Mumbai", "Unknown Society", LOCALITIES)!;
    expect(coords.latitude).toBeCloseTo(19.1176, 0);
  });

  it("returns null when no locality matches or exists", () => {
    expect(resolveCoordinates("Atlantis", "Nowhere", LOCALITIES)).toBeNull();
    expect(findNearestLocality(12.9, 77.6, [])).toBeNull();
  });

  it("identifies nearest locality from GPS coordinates", () => {
    // Near Bellandur lake (12.9310, 77.6790)
    const { locality, distanceKm } = findNearestLocality(12.931, 77.679, LOCALITIES)!;
    expect(locality.name).toBe("Bellandur");
    expect(distanceKm).toBeLessThan(1.0);
  });

  it("checks delivery geofence within 12 km radius", () => {
    // 2 km apart
    const near = isWithinGeofence(12.9121, 77.6446, 12.9304, 77.6784, 10);
    expect(near.isNearby).toBe(true);

    // 50 km apart (Bengaluru to distant town)
    const far = isWithinGeofence(12.9121, 77.6446, 13.34, 77.10, 10);
    expect(far.isNearby).toBe(false);
  });
});

describe("geofence", () => {
  it("hides stores beyond the search radius but still lets them deliver", () => {
    expect(storeReach(10.1, 15, 10)).toEqual({ visible: false, deliverable: true });
    expect(storeReach(10, 15, 10)).toEqual({ visible: true, deliverable: true });
  });

  it("shows but blocks ordering beyond the store's own radius", () => {
    expect(storeReach(7, 5, 10)).toEqual({ visible: true, deliverable: false });
  });

  it("never shows a store when the distance is unknown", () => {
    expect(storeReach(null, 8, 10)).toEqual({ visible: false, deliverable: false });
  });
});

describe("search radius", () => {
  it("uses the household's choice when it is a whole number from 1 to 50 km", () => {
    expect(searchRadiusKm(5, 10)).toBe(5);
    expect(searchRadiusKm(50, 10)).toBe(50);
  });

  it("falls back to the platform default for missing or invalid choices", () => {
    expect(searchRadiusKm(null, 10)).toBe(10);
    expect(searchRadiusKm(0, 10)).toBe(10);
    expect(searchRadiusKm(51, 10)).toBe(10);
    expect(searchRadiusKm(2.5, 10)).toBe(10);
  });

  it("clamps the platform default to 1-50 km", () => {
    expect(searchRadiusKm(null, 80)).toBe(50);
    expect(searchRadiusKm(null, 0)).toBe(1);
  });

  it("lists the fixed steps plus the current value, sorted and unique", () => {
    expect(searchRadiusOptions(10)).toEqual([2, 5, 10, 15, 25, 50]);
    expect(searchRadiusOptions(8)).toEqual([2, 5, 8, 10, 15, 25, 50]);
  });
});
