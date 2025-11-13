module.exports = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    coverageReporters: ["json", "lcov", "text", "clover"],
    collectCoverage: true,
    collectCoverageFrom: [
        "src/**/*.{ts,js}",
        "!src/db/**",
        "!src/DTO/**",
        "!src/app.ts",
        "!src/routes.ts",
    ],
    testMatch: ["**/test/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
    },
};
