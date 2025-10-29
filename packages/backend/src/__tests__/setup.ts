import { WebApp } from "../app.js";

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.POSTGRES_DB = "Planify";
    process.env.POSTGRES_USER = "root";
    process.env.POSTGRES_PASSWORD = "root";

    const webAppInstance = new WebApp();
    await webAppInstance.init();

    global.webAppInstance = webAppInstance;
    global.app = webAppInstance.getApp();
    global.db = webAppInstance.getDb();
    global.pool = webAppInstance.getPool();
});

afterAll(async () => {
    await global.webAppInstance.close();

    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
});
