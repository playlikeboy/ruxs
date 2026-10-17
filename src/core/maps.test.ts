import { describe, it, expect } from "bun:test";
import { directionsUrl, isShortMapsLink, parseMapsCoordinates } from "./maps";

describe("Google Maps links", () => {
  it("prefers the place pin over the map centre", () => {
    const url = "https://www.google.com/maps/place/Lalpur/@23.37,85.33,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d23.3747!4d85.3349";
    expect(parseMapsCoordinates(url)).toEqual({ latitude: 23.3747, longitude: 85.3349 });
  });

  it("reads the @lat,lng centre", () => {
    expect(parseMapsCoordinates("https://www.google.com/maps/@23.3602,85.325,16z")).toEqual({ latitude: 23.3602, longitude: 85.325 });
  });

  it("reads q= and ll= params and plain text", () => {
    expect(parseMapsCoordinates("https://maps.google.com/?q=23.4,85.3")).toEqual({ latitude: 23.4, longitude: 85.3 });
    expect(parseMapsCoordinates("https://maps.google.com/?ll=12.9121,77.6446&z=14")).toEqual({ latitude: 12.9121, longitude: 77.6446 });
    expect(parseMapsCoordinates("23.3747, 85.3349")).toEqual({ latitude: 23.3747, longitude: 85.3349 });
  });

  it("rejects links without coordinates or with impossible ones", () => {
    expect(parseMapsCoordinates("https://www.google.com/maps/place/Ranchi")).toBeNull();
    expect(parseMapsCoordinates("123, 456")).toBeNull();
    expect(parseMapsCoordinates("0,0")).toBeNull();
  });

  it("spots short links and builds directions", () => {
    expect(isShortMapsLink("https://maps.app.goo.gl/AbC123")).toBe(true);
    expect(isShortMapsLink("https://www.google.com/maps/@1,2,3z")).toBe(false);
    expect(directionsUrl({ latitude: 23.1, longitude: 85.2 })).toBe("https://www.google.com/maps/dir/?api=1&destination=23.1,85.2");
  });
});
