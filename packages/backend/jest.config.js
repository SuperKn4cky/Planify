export default {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    // This mapping tells Jest to use the .ts/.tsx file when it sees a .js import.
    // It's necessary for ESM projects where TypeScript requires you to use the .js extension in imports.
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
    },
};
