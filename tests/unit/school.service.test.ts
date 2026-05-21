import { haversineDistance } from "../../src/services/school.service";

// ─── Haversine Unit Tests ─────────────────────────────────────────────────────
// Full test suite written in Phase 4.
// Skeleton here confirms Jest + ts-jest wiring works correctly.

describe("haversineDistance()", () => {
  it("returns 0 when both coordinates are identical", () => {
    expect(haversineDistance(28.6139, 77.2090, 28.6139, 77.2090)).toBe(0);
  });

  it("calculates approximate distance between Delhi and Mumbai (~1150 km)", () => {
    const dist = haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });

  it("is always a non-negative number", () => {
    const dist = haversineDistance(0, 0, 10, 10);
    expect(dist).toBeGreaterThanOrEqual(0);
  });
});
