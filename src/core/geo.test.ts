import { describe, it, expect } from "bun:test";
import {
  haversineDistanceKm,
  resolveCoordinates,
  findNearestLocality,
  isWithinGeofence,
} from "./geo";

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
    const coords = resolveCoordinates("Bengaluru", "HSR Layout Sector 2");
    expect(coords.latitude).toBeCloseTo(12.9121, 2);
    expect(coords.longitude).toBeCloseTo(77.6446, 2);
  });

  it("resolves coordinates by city name fallback", () => {
    const coords = resolveCoordinates("Mumbai", "Unknown Society");
    expect(coords.latitude).toBeCloseTo(19.1176, 0);
  });

  it("identifies nearest locality from GPS coordinates", () => {
    // Near Bellandur lake (12.9310, 77.6790)
    const { locality, distanceKm } = findNearestLocality(12.931, 77.679);
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
