import { WebApp } from "../app.js";

const validPassword = "Secure123456@";
const uniqueEmail = (prefix: string = "user") => {
    const ts = Date.now();
    return `${prefix}.${ts}@example.com`;
};

type NewUserOptions = {
    first_name?: string;
    last_name?: string;
    email_prefix?: string;
};

const newUser = ({
    first_name = "John",
    last_name = "Doe",
    email_prefix,
}: NewUserOptions = {}) => {
    return {
        first_name,
        last_name,
        email: uniqueEmail(email_prefix),
        password: validPassword,
    };
};

beforeAll(async () => {
    const webAppInstance = new WebApp();
    await webAppInstance.init();

    global.webAppInstance = webAppInstance;
    global.app = webAppInstance.getApp();
    global.db = webAppInstance.getDb();
    global.pool = webAppInstance.getPool();

    Object.assign(global, {
        validPassword,
        uniqueEmail,
        newUser,
    });
});

afterAll(async () => {
    await global.webAppInstance.close();

    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
});
