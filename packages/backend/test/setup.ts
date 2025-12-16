import { WebApp } from "../src/app.js";
import {
    users,
    tasks as tasksTable,
    users_own_tasks,
    folders,
    users_own_folders,
    has_contact,
} from "../src/db/schema.js";

beforeAll(async () => {
    if (global.__INITED__) return;

    const webAppInstance = new WebApp();
    await webAppInstance.init();

    global.webAppInstance = webAppInstance;
    global.app = webAppInstance.getApp();
    global.db = webAppInstance.getDb();
    global.pool = webAppInstance.getPool();

    await global.db.delete(users_own_tasks);
    await global.db.delete(tasksTable);
    await global.db.delete(users_own_folders);
    await global.db.delete(folders);
    await global.db.delete(users);
    await global.db.delete(has_contact);

    global.__INITED__ = true;
});

afterAll(async () => {
    if (global.webAppInstance) {
        await global.pool.end();
    }
});

const validPassword = "Secure123456@";
const uniqueEmail = (prefix: string = "user") => {
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}.${random}@example.com`;
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

Object.assign(global, {
    validPassword,
    uniqueEmail,
    newUser,
});
