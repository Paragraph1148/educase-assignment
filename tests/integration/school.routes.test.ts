import request from "supertest";
import { app } from "../../src/app";

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests: School Routes
//
// Strategy: mock the DB pool so tests run without a live MySQL instance.
// This lets the CI runner (and any dev) run the full suite with just:
//   npm test
//
// The real DB is exercised by the GitHub Actions service container
// defined in ci.yml — that's where true end-to-end confidence lives.
// ─────────────────────────────────────────────────────────────────────────────

// ── Mock the DB pool ──────────────────────────────────────────────────────────
// Jest replaces pool.execute with a spy we control per test.

jest.mock("../../src/config/db", () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({
      ping: jest.fn(),
      release: jest.fn(),
    }),
  },
}));

import pool from "../../src/config/db";
const mockExecute = pool.execute as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /addSchool
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /addSchool", () => {

  const validPayload = {
    name: "Delhi Public School",
    address: "Sector 45, Noida, UP",
    latitude: 28.5706,
    longitude: 77.3261,
  };

  // ── Success ─────────────────────────────────────────────────────────────────

  it("201 — creates a school and returns insertId", async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 42, affectedRows: 1 }]);

    const res = await request(app)
      .post("/addSchool")
      .send(validPayload)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("School added successfully");
    expect(res.body.data.id).toBe(42);
  });

  it("calls pool.execute with correct parameterised query", async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);

    await request(app).post("/addSchool").send(validPayload);

    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
      [validPayload.name, validPayload.address, validPayload.latitude, validPayload.longitude]
    );
  });

  // ── Validation failures ─────────────────────────────────────────────────────

  it("400 — rejects missing name", async () => {
    const { name, ...rest } = validPayload;
    const res = await request(app).post("/addSchool").send(rest);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.errors).toBeDefined();
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("400 — rejects missing address", async () => {
    const { address, ...rest } = validPayload;
    const res = await request(app).post("/addSchool").send(rest);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("400 — rejects missing latitude", async () => {
    const { latitude, ...rest } = validPayload;
    const res = await request(app).post("/addSchool").send(rest);

    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("400 — rejects missing longitude", async () => {
    const { longitude, ...rest } = validPayload;
    const res = await request(app).post("/addSchool").send(rest);

    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("400 — rejects latitude as string", async () => {
    const res = await request(app)
      .post("/addSchool")
      .send({ ...validPayload, latitude: "not-a-number" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain("latitude must be a number");
  });

  it("400 — rejects latitude out of range (> 90)", async () => {
    const res = await request(app)
      .post("/addSchool")
      .send({ ...validPayload, latitude: 91 });

    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toContain("latitude must be between -90 and 90");
  });

  it("400 — rejects longitude out of range (< -180)", async () => {
    const res = await request(app)
      .post("/addSchool")
      .send({ ...validPayload, longitude: -181 });

    expect(res.status).toBe(400);
  });

  it("400 — rejects empty name", async () => {
    const res = await request(app)
      .post("/addSchool")
      .send({ ...validPayload, name: "" });

    expect(res.status).toBe(400);
  });

  it("400 — rejects whitespace-only name", async () => {
    const res = await request(app)
      .post("/addSchool")
      .send({ ...validPayload, name: "   " });

    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("400 — rejects empty body", async () => {
    const res = await request(app).post("/addSchool").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  // ── DB error handling ───────────────────────────────────────────────────────

  it("500 — returns error when DB throws", async () => {
    mockExecute.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await request(app).post("/addSchool").send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /listSchools
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /listSchools", () => {

  const mockSchools = [
    { id: 1, name: "Noida School",  address: "Noida, UP",     latitude: 28.5706, longitude: 77.3261 },
    { id: 2, name: "Mumbai School", address: "Mumbai, MH",    latitude: 19.0760, longitude: 72.8777 },
    { id: 3, name: "Raipur School", address: "Raipur, CG",    latitude: 21.2514, longitude: 81.6296 },
  ];

  // ── Success ─────────────────────────────────────────────────────────────────

  it("200 — returns schools sorted by distance from user location", async () => {
    mockExecute.mockResolvedValueOnce([mockSchools]);

    // User is in Delhi — Noida should be nearest
    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "28.6139", longitude: "77.2090" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].name).toBe("Noida School");
    expect(res.body.data[res.body.data.length - 1].name).toBe("Mumbai School");
  });

  it("returns distance_km field on each school", async () => {
    mockExecute.mockResolvedValueOnce([mockSchools]);

    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "28.6139", longitude: "77.2090" });

    expect(res.status).toBe(200);
    res.body.data.forEach((school: { distance_km: unknown }) => {
      expect(typeof school.distance_km).toBe("number");
      expect(school.distance_km).toBeGreaterThanOrEqual(0);
    });
  });

  it("200 — returns empty array when no schools in DB", async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "28.6139", longitude: "77.2090" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.message).toContain("0 school(s)");
  });

  it("returns distances in ascending order", async () => {
    mockExecute.mockResolvedValueOnce([mockSchools]);

    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "28.6139", longitude: "77.2090" });

    const distances: number[] = res.body.data.map((s: { distance_km: number }) => s.distance_km);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  it("calls pool.execute with the correct SELECT query", async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    await request(app)
      .get("/listSchools")
      .query({ latitude: "28.6139", longitude: "77.2090" });

    expect(mockExecute).toHaveBeenCalledWith(
      "SELECT id, name, address, latitude, longitude FROM schools"
    );
  });

  // ── Validation failures ─────────────────────────────────────────────────────

  it("400 — rejects missing latitude param", async () => {
    const res = await request(app)
      .get("/listSchools")
      .query({ longitude: "77.2090" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("400 — rejects missing longitude param", async () => {
    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "28.6139" });

    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("400 — rejects non-numeric latitude", async () => {
    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "abc", longitude: "77.20" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("400 — rejects out-of-range latitude (> 90)", async () => {
    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "91", longitude: "77.20" });

    expect(res.status).toBe(400);
  });

  it("400 — rejects out-of-range longitude (> 180)", async () => {
    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "28.61", longitude: "200" });

    expect(res.status).toBe(400);
  });

  it("400 — rejects completely empty query string", async () => {
    const res = await request(app).get("/listSchools");

    expect(res.status).toBe(400);
  });

  // ── DB error handling ───────────────────────────────────────────────────────

  it("500 — returns error when DB throws", async () => {
    mockExecute.mockRejectedValueOnce(new Error("Timeout"));

    const res = await request(app)
      .get("/listSchools")
      .query({ latitude: "28.6139", longitude: "77.2090" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("200 — returns server status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Server is running");
    expect(typeof res.body.uptime).toBe("number");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────────────────────

describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not found");
  });

  it("returns 404 for wrong method on known route", async () => {
    const res = await request(app).delete("/addSchool");

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error handler — branch coverage for NODE_ENV="production"
// ─────────────────────────────────────────────────────────────────────────────

describe("Global error handler", () => {
  it("returns generic message in production mode (hides internal error)", async () => {
    // Simulate production env for this test only
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    mockExecute.mockRejectedValueOnce(new Error("secret db internals"));

    const res = await request(app).post("/addSchool").send({
      name: "Test School",
      address: "Test Address Here",
      latitude: 28.5706,
      longitude: 77.3261,
    });

    process.env.NODE_ENV = original; // restore

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Internal server error");
    // Should NOT leak the real error message in production
    expect(res.body.message).not.toContain("secret db internals");
  });

  it("returns real error message in development mode", async () => {
    process.env.NODE_ENV = "development";

    mockExecute.mockRejectedValueOnce(new Error("real dev error"));

    const res = await request(app).post("/addSchool").send({
      name: "Test School",
      address: "Test Address Here",
      latitude: 28.5706,
      longitude: 77.3261,
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("real dev error");
  });
});
