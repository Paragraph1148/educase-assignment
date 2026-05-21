import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],

  // Show each test name in output
  verbose: true,

  // Run tests serially — avoids port conflicts in integration tests
  runInBand: true,

  // Coverage config
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/app.ts",           // entry point — covered implicitly by integration tests
    "!src/types/**/*.ts",    // pure type definitions, nothing to test
    "!src/config/db.ts",     // DB pool — mocked in tests
  ],
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  80,
      lines:      80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "lcov", "html"],

  // Map path aliases if you add them later
  moduleNameMapper: {},

  // Timeout per test (ms) — generous for async DB mocks
  testTimeout: 10000,
};

export default config;
