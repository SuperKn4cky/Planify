import { WebApp } from "../app.js";

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://root:root@db:5432/Planify";

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
