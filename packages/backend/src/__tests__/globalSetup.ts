import { WebApp } from "../../dist/app.js";

export default async () => {
    const webAppInstance = new WebApp();
    await webAppInstance.init();

    global.webAppInstance = webAppInstance;
    global.app = webAppInstance.getApp();
    global.db = webAppInstance.getDb();
    global.pool = webAppInstance.getPool();
};
