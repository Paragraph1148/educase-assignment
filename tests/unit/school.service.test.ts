import { haversineDistance } from "../../src/services/school.service";

// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests: haversineDistance()
// Pure function — no DB, no mocks needed.
// ─────────────────────────────────────────────────────────────────────────────

describe("haversineDistance()", () => {

  // ── Basic correctness ───────────────────────────────────────────────────────

  it("returns 0 when both coordinates are identical", () => {
    expect(haversineDistance(28.6139, 77.2090, 28.6139, 77.2090)).toBe(0);
  });

  it("calculates Delhi → Mumbai (~1150 km)", () => {
    const dist = haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });

  it("calculates Delhi → Raipur (~900 km)", () => {
    const dist = haversineDistance(28.6139, 77.2090, 21.2514, 81.6296);
    expect(dist).toBeGreaterThan(850);
    expect(dist).toBeLessThan(950);
  });

  it("calculates London → New York (~5500 km)", () => {
    const dist = haversineDistance(51.5074, -0.1278, 40.7128, -74.0060);
    expect(dist).toBeGreaterThan(5400);
    expect(dist).toBeLessThan(5600);
  });

  // ── Properties ─────────────────────────────────────────────────────────────

  it("is always non-negative", () => {
    expect(haversineDistance(0, 0, 10, 10)).toBeGreaterThanOrEqual(0);
    expect(haversineDistance(-45, -90, 45, 90)).toBeGreaterThanOrEqual(0);
  });

  it("is symmetric — A→B equals B→A", () => {
    const ab = haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
    const ba = haversineDistance(19.0760, 72.8777, 28.6139, 77.2090);
    expect(ab).toBe(ba);
  });

  it("returns a number rounded to 2 decimal places", () => {
    const dist = haversineDistance(28.6139, 77.2090, 21.2514, 81.6296);
    const decimalPlaces = (dist.toString().split(".")[1] || "").length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  // ── Edge: boundary coordinates ─────────────────────────────────────────────

  it("handles equator coordinates (0, 0)", () => {
    const dist = haversineDistance(0, 0, 0, 0);
    expect(dist).toBe(0);
  });

  it("handles antipodal points (~20015 km, roughly half Earth circumference)", () => {
    const dist = haversineDistance(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(19000);
    expect(dist).toBeLessThan(21000);
  });

  it("handles negative coordinates (southern hemisphere)", () => {
    // Sydney → Cape Town
    const dist = haversineDistance(-33.8688, 151.2093, -33.9249, 18.4241);
    expect(dist).toBeGreaterThan(11000);
    expect(dist).toBeLessThan(12000);
  });

  // ── Sorting behaviour (used in listSchoolsSortedByDistance) ────────────────

  it("correctly identifies the nearest school when sorted", () => {
    const userLat = 28.6139;
    const userLon = 77.2090;

    const schools = [
      { id: 1, name: "Far School",   latitude: 19.0760, longitude: 72.8777 }, // Mumbai
      { id: 2, name: "Near School",  latitude: 28.5706, longitude: 77.3261 }, // Noida
      { id: 3, name: "Mid School",   latitude: 26.8467, longitude: 80.9462 }, // Lucknow
    ];

    const withDist = schools.map(s => ({
      ...s,
      distance_km: haversineDistance(userLat, userLon, s.latitude, s.longitude)
    }));

    withDist.sort((a, b) => a.distance_km - b.distance_km);

    expect(withDist[0].name).toBe("Near School");
    expect(withDist[withDist.length - 1].name).toBe("Far School");
  });
});
