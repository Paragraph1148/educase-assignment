import { createSchoolSchema, listSchoolsSchema } from "../../src/validators/school.validator";

// ─────────────────────────────────────────────────────────────────────────────
// Unit Tests: Zod Validators
// No DB, no HTTP — purely testing input validation logic.
// ─────────────────────────────────────────────────────────────────────────────

describe("createSchoolSchema", () => {

  const valid = {
    name: "Delhi Public School",
    address: "Sector 45, Noida, UP",
    latitude: 28.5706,
    longitude: 77.3261,
  };

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("accepts a fully valid payload", () => {
    const result = createSchoolSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and address", () => {
    const result = createSchoolSchema.safeParse({
      ...valid,
      name: "  Trimmed School  ",
      address: "  Some Address  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Trimmed School");
      expect(result.data.address).toBe("Some Address");
    }
  });

  it("accepts boundary lat/lon values (-90, -180)", () => {
    const result = createSchoolSchema.safeParse({ ...valid, latitude: -90, longitude: -180 });
    expect(result.success).toBe(true);
  });

  it("accepts boundary lat/lon values (90, 180)", () => {
    const result = createSchoolSchema.safeParse({ ...valid, latitude: 90, longitude: 180 });
    expect(result.success).toBe(true);
  });

  // ── Missing fields ──────────────────────────────────────────────────────────

  it("rejects when name is missing", () => {
    const { name, ...rest } = valid;
    const result = createSchoolSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when address is missing", () => {
    const { address, ...rest } = valid;
    const result = createSchoolSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when latitude is missing", () => {
    const { latitude, ...rest } = valid;
    const result = createSchoolSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when longitude is missing", () => {
    const { longitude, ...rest } = valid;
    const result = createSchoolSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // ── Wrong types ─────────────────────────────────────────────────────────────

  it("rejects when latitude is a string", () => {
    const result = createSchoolSchema.safeParse({ ...valid, latitude: "not-a-number" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("latitude must be a number");
    }
  });

  it("rejects when longitude is a string", () => {
    const result = createSchoolSchema.safeParse({ ...valid, longitude: "not-a-number" });
    expect(result.success).toBe(false);
  });

  // ── Out-of-range values ─────────────────────────────────────────────────────

  it("rejects latitude > 90", () => {
    const result = createSchoolSchema.safeParse({ ...valid, latitude: 91 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("latitude must be between -90 and 90");
    }
  });

  it("rejects latitude < -90", () => {
    const result = createSchoolSchema.safeParse({ ...valid, latitude: -91 });
    expect(result.success).toBe(false);
  });

  it("rejects longitude > 180", () => {
    const result = createSchoolSchema.safeParse({ ...valid, longitude: 181 });
    expect(result.success).toBe(false);
  });

  it("rejects longitude < -180", () => {
    const result = createSchoolSchema.safeParse({ ...valid, longitude: -181 });
    expect(result.success).toBe(false);
  });

  // ── String length constraints ───────────────────────────────────────────────

  it("rejects name shorter than 2 characters", () => {
    const result = createSchoolSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("at least 2 characters");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = createSchoolSchema.safeParse({ ...valid, name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects address shorter than 5 characters", () => {
    const result = createSchoolSchema.safeParse({ ...valid, address: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects address longer than 255 characters", () => {
    const result = createSchoolSchema.safeParse({ ...valid, address: "A".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects empty name string", () => {
    const result = createSchoolSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name (trimmed to empty)", () => {
    const result = createSchoolSchema.safeParse({ ...valid, name: "   " });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("listSchoolsSchema", () => {

  // Query params arrive as strings — schema transforms them to numbers

  it("accepts valid string lat/lon and transforms to numbers", () => {
    const result = listSchoolsSchema.safeParse({ latitude: "28.61", longitude: "77.20" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.latitude).toBe("number");
      expect(typeof result.data.longitude).toBe("number");
      expect(result.data.latitude).toBe(28.61);
    }
  });

  it("accepts boundary values as strings", () => {
    expect(listSchoolsSchema.safeParse({ latitude: "-90", longitude: "-180" }).success).toBe(true);
    expect(listSchoolsSchema.safeParse({ latitude: "90",  longitude: "180"  }).success).toBe(true);
  });

  it("rejects when latitude is missing", () => {
    const result = listSchoolsSchema.safeParse({ longitude: "77.20" });
    expect(result.success).toBe(false);
  });

  it("rejects when longitude is missing", () => {
    const result = listSchoolsSchema.safeParse({ latitude: "28.61" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric latitude string", () => {
    const result = listSchoolsSchema.safeParse({ latitude: "abc", longitude: "77.20" });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range latitude string > 90", () => {
    const result = listSchoolsSchema.safeParse({ latitude: "91", longitude: "77.20" });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range longitude string > 180", () => {
    const result = listSchoolsSchema.safeParse({ latitude: "28.61", longitude: "181" });
    expect(result.success).toBe(false);
  });
});
