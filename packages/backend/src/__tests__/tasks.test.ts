import request from "supertest";
import {
    users,
    tasks as tasksTable,
    users_own_tasks,
    folders,
    users_own_folders,
} from "../db/schema.js";

describe("POST /tasks", () => {
    beforeEach(async () => {
        await global.db.delete(users_own_tasks);
        await global.db.delete(tasksTable);
        await global.db.delete(users_own_folders);
        await global.db.delete(folders);
        await global.db.delete(users);
    });

    it("retourne 401 si non authentifié", async () => {
        const res = await request(global.app)
            .post("/tasks")
            .send({ title: "A faire" });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Token is missing");
    });

    it("retourne 422 si title manquant", async () => {
        const userData = newUser();
        const reg = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app)
            .post("/tasks")
            .set("Cookie", cookie)
            .send({});

        if (res.status !== 422) {
            console.log("Failing test response body:", res.body);
        }

        expect(res.status).toBe(422);
        expect(res.body.error.messages).toContain("Title is required");
    });

    it("retourne 201 et crée la tâche", async () => {
        const userData = newUser();
        const reg = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app)
            .post("/tasks")
            .set("Cookie", cookie)
            .send({
                title: "Nouvelle tâche",
                description: "Texte",
                status: "todo",
                priority: 2,
            });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({
            title: "Nouvelle tâche",
            status: "todo",
            priority: 2,
        });
        expect(res.body.data).toHaveProperty("id");
    });

    it("retourne 403 si dossier sans droit d'écriture", async () => {
        const userData = newUser();
        const reg = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const insertedFolders = await global.db
            .insert(folders)
            .values({ name: "Dossier A" })
            .returning();
        const folderId = insertedFolders[0].id;

        const res = await request(global.app)
            .post("/tasks")
            .set("Cookie", cookie)
            .send({
                title: "Essai",
                folder_id: folderId,
            });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toBe(
            "You do not have permission on this folder",
        );
    });
});

describe("DELETE /tasks/:id", () => {
    beforeEach(async () => {
        await global.db.delete(users_own_tasks);
        await global.db.delete(tasksTable);
        await global.db.delete(users_own_folders);
        await global.db.delete(folders);
        await global.db.delete(users);
    });

    it("retourne 401 si non authentifié", async () => {
        const res = await request(global.app).delete("/tasks/1");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Token is missing");
    });

    it("retourne 400 si id invalide", async () => {
        const userData = newUser();
        const reg = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app)
            .delete("/tasks/abc")
            .set("Cookie", cookie);
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe("Invalid task id");
    });

    it("retourne 404 si la tâche n'existe pas", async () => {
        const userData = newUser();
        const reg = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const res = await request(global.app)
            .delete("/tasks/999999")
            .set("Cookie", cookie);
        expect(res.status).toBe(404);
        expect(res.body.error.message).toBe("Task not found");
    });

    it("supprime la tâche et retourne 200", async () => {
        const userData = newUser();
        const reg = await request(global.app)
            .post("/auth/register")
            .send(userData)
            .expect(201);
        const cookie = reg.headers["set-cookie"];

        const create = await request(global.app)
            .post("/tasks")
            .set("Cookie", cookie)
            .send({ title: "A faire" })
            .expect(201);

        const id = create.body.data.id as number;

        const del = await request(global.app)
            .delete(`/tasks/${id}`)
            .set("Cookie", cookie);
        expect(del.status).toBe(200);
        expect(del.body.message).toBe("Task deleted successfully");

        const delAgain = await request(global.app)
            .delete(`/tasks/${id}`)
            .set("Cookie", cookie);
        expect(delAgain.status).toBe(404);
        expect(delAgain.body.error.message).toBe("Task not found");
    });

    it("retourne 403 si l'utilisateur n'a pas de permission sur la tâche", async () => {
        const a = newUser({ email_prefix: "a" });
        const b = newUser({ email_prefix: "b" });

        const regA = await request(global.app)
            .post("/auth/register")
            .send(a)
            .expect(201);
        const cookieA = regA.headers["set-cookie"];

        const created = await request(global.app)
            .post("/tasks")
            .set("Cookie", cookieA)
            .send({ title: "Tâche A" })
            .expect(201);

        const taskId = created.body.data.id as number;

        const regB = await request(global.app)
            .post("/auth/register")
            .send(b)
            .expect(201);
        const cookieB = regB.headers["set-cookie"];

        const res = await request(global.app)
            .delete(`/tasks/${taskId}`)
            .set("Cookie", cookieB);
        expect(res.status).toBe(403);
        expect(res.body.error.message).toBe(
            "You do not have permission on this task",
        );
    });
});
