import request from "supertest";
import { users, tasks as tasksTable, users_own_tasks, folders, users_own_folders } from "../db/schema.js";

describe("POST /tasks", () => {
    beforeEach(async () => {
        await global.db.delete(users_own_tasks);
        await global.db.delete(tasksTable);
        await global.db.delete(users_own_folders);
        await global.db.delete(folders);
        await global.db.delete(users);
    });

    it("retourne 401 si non authentifié", async () => {
        const res = await request(global.app).post("/tasks").send({ title: "A faire" });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Token is missing");
    });

    it("retourne 422 si title manquant", async () => {
        const userData = { first_name: "John", last_name: "Doe", email: "john@example.com", password: "Password123!" };
        const reg = await request(global.app).post("/auth/register").send(userData).expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app).post("/tasks").set("Cookie", cookie).send({});
        expect(res.status).toBe(422);
        expect(res.body.error.messages).toContain("Title is required");
    });

    it("retourne 201 et crée la tâche", async () => {
        const userData = { first_name: "Jane", last_name: "Doe", email: "jane@example.com", password: "Password123!" };
        const reg = await request(global.app).post("/auth/register").send(userData).expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app).post("/tasks").set("Cookie", cookie).send({
            title: "Nouvelle tâche",
            description: "Texte",
            status: "todo",
            priority: 2,
        });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({ title: "Nouvelle tâche", status: "todo", priority: 2 });
        expect(res.body.data).toHaveProperty("id");
    });

    it("retourne 403 si dossier sans droit d'écriture", async () => {
        const userData = { first_name: "Jim", last_name: "Beam", email: "jim@example.com", password: "Password123!" };
        const reg = await request(global.app).post("/auth/register").send(userData).expect(201);
        const cookie = reg.headers["set-cookie"];

        const insertedFolders = await global.db.insert(folders).values({ name: "Dossier A" }).returning();
        const folderId = insertedFolders[0].id;

        const res = await request(global.app).post("/tasks").set("Cookie", cookie).send({
            title: "Essai",
            folder_id: folderId,
        });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toBe("You do not have permission on this folder");
    });
});
