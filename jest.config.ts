import type { Config } from "jest";

const config: Config = {
  // ── ts-jest preset with config inline (not under deprecated globals) ──────
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },

  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  verbose: true,
  // runInBand: true,

  // ── Coverage ──────────────────────────────────────────────────────────────
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/app.ts",
    "!src/types/**/*.ts",
    "!src/config/db.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "lcov", "html"],
  testTimeout: 10000,
};

export default config;
