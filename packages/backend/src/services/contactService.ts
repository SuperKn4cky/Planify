import { and, eq, or } from "drizzle-orm";
import type { DB } from "../db/drizzle.js"; // adapte au type DB réel
import { users, has_contact } from "../db/schema.js";
import AppError from "../middlewares/errorHandler.js";
import z from "zod";
import MailService from "./mailService.js";

export default class ContactService {
    private db: DB;
    private mailService: MailService;
    private emailSchema = z.email().trim().toLowerCase();

    public constructor(db: DB, mailService: MailService) {
        this.db = db;
        this.mailService = mailService;
    }

    private normalizePair(a: number, b: number): [number, number] {
        return a < b ? [a, b] : [b, a];
    }

    public async listContacts(userId: number) {
        const rows = await this.db
            .select({
                id: users.id,
                email: users.email,
                first_name: users.first_name,
                last_name: users.last_name,
            })
            .from(has_contact)
            .innerJoin(
                users,
                or(
                    and(
                        eq(has_contact.user_id_1, userId),
                        eq(users.id, has_contact.user_id_2),
                    ),
                    and(
                        eq(has_contact.user_id_2, userId),
                        eq(users.id, has_contact.user_id_1),
                    ),
                ),
            );

        return rows;
    }

    public async addContact(currentUserId: number, email: string) {
        const parsedEmail = this.emailSchema.safeParse(email);

        if (!parsedEmail.success) {
            throw new AppError("Invalid email", 400);
        }
        const contactEmail = parsedEmail.data;

        const result = await this.db
            .select()
            .from(users)
            .where(eq(users.email, contactEmail))
            .limit(1);

        if (result.length === 0) {
            throw new AppError("User not found", 404);
        }

        const target = result[0];

        if (target.id === currentUserId) {
            throw new AppError("You cannot add yourself as a contact", 400);
        }

        const [u1, u2] = this.normalizePair(currentUserId, target.id);

        const existing = await this.db
            .select()
            .from(has_contact)
            .where(and(eq(has_contact.user_id_1, u1), eq(has_contact.user_id_2, u2)))
            .limit(1);

        if (existing.length === 0) {
            await this.db.insert(has_contact).values({ user_id_1: u1, user_id_2: u2 });
        }

        return {
            id: target.id,
            email: target.email,
            first_name: target.first_name,
            last_name: target.last_name,
        };
    }

    public async removeContact(currentUserId: number, contactId: number): Promise<void> {
        const [u1, u2] = this.normalizePair(currentUserId, contactId);

        const deleted = await this.db
            .delete(has_contact)
            .where(and(eq(has_contact.user_id_1, u1), eq(has_contact.user_id_2, u2)))
            .returning({ user_id_1: has_contact.user_id_1 });

        if (deleted.length === 0) {
            throw new AppError("Contact not found", 404);
        }
    }

    public async assertIsContact(currentUserId: number, contactId: number): Promise<void> {
        const [u1, u2] = this.normalizePair(currentUserId, contactId);

        const existing = await this.db
            .select()
            .from(has_contact)
            .where(and(eq(has_contact.user_id_1, u1), eq(has_contact.user_id_2, u2)))
            .limit(1);

        if (existing.length === 0) {
            throw new AppError("User is not in your contacts", 403);
        }
    }
}
