import { eq } from "drizzle-orm";
import type { DB } from "../db/drizzle.js";
import { folders, users_own_folders } from "../db/schema.js";
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
