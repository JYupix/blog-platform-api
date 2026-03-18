module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node",
          esModuleInterop: true
        }
      }
    ]
  },
  setupFiles: ["<rootDir>/tests/setup/env.cjs"],
  moduleFileExtensions: ["ts", "js"],
  clearMocks: true
}
