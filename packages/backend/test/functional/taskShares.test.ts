import request from "supertest";
import { eq } from "drizzle-orm";
import { users, has_contact } from "../../src/db/schema.js";

async function getUserIdByEmail(email: string): Promise<number> {
    const rows = await global.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (rows.length === 0) {
        throw new Error("User not found in DB: " + email);
    }

    return rows[0].id;
}

async function makeContacts(userAId: number, userBId: number) {
    const user_id_1 = Math.min(userAId, userBId);
    const user_id_2 = Math.max(userAId, userBId);

    await global.db.insert(has_contact).values({ user_id_1, user_id_2 });
}

describe("Task shares - permissions", () => {
    it("Owner partage en read: le user shared peut GET la tâche mais ne peut pas DELETE", async () => {
        const owner = newUser({ email_prefix: "share-owner-read" });
        const shared = newUser({ email_prefix: "share-target-read" });

        const regOwner = await request(global.app)
            .post("/auth/register")
            .send(owner)
            .expect(201);
        const ownerCookie = regOwner.headers["set-cookie"];

        const regShared = await request(global.app)
            .post("/auth/register")
            .send(shared)
            .expect(201);
        const sharedCookie = regShared.headers["set-cookie"];

        const ownerUserId = await getUserIdByEmail(owner.email);
        const sharedUserId = await getUserIdByEmail(shared.email);

        await makeContacts(ownerUserId, sharedUserId);

        const created = await request(global.app)
            .post("/tasks")
            .set("Cookie", ownerCookie)
            .send({ title: "Tâche partagée read", priority: 2, status: "todo" })
            .expect(201);

        const taskId = created.body.data.id as number;

        await request(global.app)
            .post(`/tasks/${taskId}/shares`)
            .set("Cookie", ownerCookie)
            .send({ userId: sharedUserId, permission: "read" })
            .expect(201);

        // read -> OK en lecture
        const getTask = await request(global.app)
            .get(`/tasks/${taskId}`)
            .set("Cookie", sharedCookie)
            .expect(200);

        expect(getTask.body?.data?.id).toBe(taskId);

        // read -> interdit de supprimer
        const del = await request(global.app)
            .delete(`/tasks/${taskId}`)
            .set("Cookie", sharedCookie);

        expect(del.status).toBe(403);
        expect(del.body?.error?.message).toBe(
            "Task is read-only for this user",
        );
    });

    it("Owner partage en write: le user shared voit la tâche en scope=shared et peut DELETE", async () => {
        const owner = newUser({ email_prefix: "share-owner-write" });
        const shared = newUser({ email_prefix: "share-target-write" });

        const regOwner = await request(global.app)
            .post("/auth/register")
            .send(owner)
            .expect(201);
        const ownerCookie = regOwner.headers["set-cookie"];

        const regShared = await request(global.app)
            .post("/auth/register")
            .send(shared)
            .expect(201);
        const sharedCookie = regShared.headers["set-cookie"];

        const ownerUserId = await getUserIdByEmail(owner.email);
        const sharedUserId = await getUserIdByEmail(shared.email);

        await makeContacts(ownerUserId, sharedUserId);

        const created = await request(global.app)
            .post("/tasks")
            .set("Cookie", ownerCookie)
            .send({
                title: "Tâche partagée write",
                priority: 2,
                status: "todo",
            })
            .expect(201);

        const taskId = created.body.data.id as number;

        await request(global.app)
            .post(`/tasks/${taskId}/shares`)
            .set("Cookie", ownerCookie)
            .send({ userId: sharedUserId, permission: "write" })
            .expect(201);

        // apparait dans scope=shared (car permission != owner)
        const listShared = await request(global.app)
            .get("/tasks?scope=shared")
            .set("Cookie", sharedCookie)
            .expect(200);

        const ids = (listShared.body.items ?? []).map((t: any) => t.id);
        expect(ids).toContain(taskId);

        // write -> peut supprimer
        await request(global.app)
            .delete(`/tasks/${taskId}`)
            .set("Cookie", sharedCookie)
            .expect(200);
    });

    it("Non-owner ne peut pas gérer la collaboration (list/add/revoke)", async () => {
        const owner = newUser({ email_prefix: "share-owner-guard" });
        const writer = newUser({ email_prefix: "share-writer-guard" });

        const regOwner = await request(global.app)
            .post("/auth/register")
            .send(owner)
            .expect(201);
        const ownerCookie = regOwner.headers["set-cookie"];

        const regWriter = await request(global.app)
            .post("/auth/register")
            .send(writer)
            .expect(201);
        const writerCookie = regWriter.headers["set-cookie"];

        const ownerUserId = await getUserIdByEmail(owner.email);
        const writerUserId = await getUserIdByEmail(writer.email);

        await makeContacts(ownerUserId, writerUserId);

        const created = await request(global.app)
            .post("/tasks")
            .set("Cookie", ownerCookie)
            .send({ title: "Tâche guard", priority: 2, status: "todo" })
            .expect(201);

        const taskId = created.body.data.id as number;

        // owner -> donne write à writer
        await request(global.app)
            .post(`/tasks/${taskId}/shares`)
            .set("Cookie", ownerCookie)
            .send({ userId: writerUserId, permission: "write" })
            .expect(201);

        // writer -> ne peut pas lister
        const list = await request(global.app)
            .get(`/tasks/${taskId}/shares`)
            .set("Cookie", writerCookie);

        expect(list.status).toBe(403);
        expect(list.body?.error?.message).toBe(
            "Only the owner can manage collaboration",
        );

        // writer -> ne peut pas ajouter
        const add = await request(global.app)
            .post(`/tasks/${taskId}/shares`)
            .set("Cookie", writerCookie)
            .send({ userId: writerUserId, permission: "read" });

        expect(add.status).toBe(403);
        expect(add.body?.error?.message).toBe(
            "Only the owner can manage collaboration",
        );

        // writer -> ne peut pas révoquer
        const revoke = await request(global.app)
            .delete(`/tasks/${taskId}/shares/${writerUserId}`)
            .set("Cookie", writerCookie);

        expect(revoke.status).toBe(403);
        expect(revoke.body?.error?.message).toBe(
            "Only the owner can manage collaboration",
        );
    });
});
