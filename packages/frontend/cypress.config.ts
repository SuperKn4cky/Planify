import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        baseUrl: "http://localhost:3000",
        video: false,
        defaultCommandTimeout: 8000,
        requestTimeout: 10000,
        setupNodeEvents(on, config) {
            return config;
        },
    },
});
