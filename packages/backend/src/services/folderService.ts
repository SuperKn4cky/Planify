import { and, eq } from "drizzle-orm";
import type { DB } from "../db/drizzle.js";
import { folders, users_own_folders, tasks } from "../db/schema.js";
import AppError from "../middlewares/errorHandler.js";

export default class FolderService {
    private db: DB;

    public constructor(db: DB) {
        this.db = db;
    }

    public async createFolder(
        name: string,
        ownerUserId: number,
    ): Promise<{ id: number; name: string }> {
        const trimmed = name.trim();
        if (!trimmed) {
            throw new AppError("Folder name is required", 400);
        }

        const created = await this.db.transaction(async (t) => {
            const inserted = await t
                .insert(folders)
                .values({
                    name: trimmed,
                })
                .returning();

            if (inserted.length === 0) {
                throw new AppError("Folder creation failed", 500);
            }

            const folder = inserted[0];

            await t.insert(users_own_folders).values({
                user_id: ownerUserId,
                folder_id: folder.id,
                permission: "owner",
            });

            return folder;
        });

        return { id: created.id, name: created.name };
    }

    public async deleteFolder(folderId: number, userId: number): Promise<void> {
        const [link] = await this.db
            .select({
                permission: users_own_folders.permission,
            })
            .from(users_own_folders)
            .where(
                and(
                    eq(users_own_folders.folder_id, folderId),
                    eq(users_own_folders.user_id, userId),
                ),
            )
            .limit(1);

        if (!link) {
            throw new AppError(
                "You do not have permission on this folder",
                403,
            );
        }

        if (link.permission !== "owner") {
            throw new AppError("Only the owner can delete this folder", 403);
        }

        await this.db
            .update(tasks)
            .set({ folder_id: null })
            .where(eq(tasks.folder_id, folderId));

        await this.db
            .delete(users_own_folders)
            .where(eq(users_own_folders.folder_id, folderId));

        const deleted = await this.db
            .delete(folders)
            .where(eq(folders.id, folderId))
            .returning();

        if (deleted.length === 0) {
            throw new AppError("Folder not found", 404);
        }
    }

    public async getFoldersForUser(
        userId: number,
    ): Promise<Array<{ id: number; name: string; permission: string }>> {
        const rows = await this.db
            .select({
                id: folders.id,
                name: folders.name,
                permission: users_own_folders.permission,
            })
            .from(folders)
            .innerJoin(
                users_own_folders,
                eq(users_own_folders.folder_id, folders.id),
            )
            .where(eq(users_own_folders.user_id, userId));

        return rows;
    }
}
