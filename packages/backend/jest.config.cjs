module.exports = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.ts"],
    globalSetup: "<rootDir>/src/__tests__/globalSetup.ts",
    globalTeardown: "<rootDir>/src/__tests__/globalTeardown.ts",
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { 
            useESM: true,
            tsconfig: "tsconfig.json"
        }],
    },
};
