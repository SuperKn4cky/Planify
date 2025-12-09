import { and, eq, or } from "drizzle-orm";
import type { DB } from "../db/drizzle.js";
import { users, has_contact } from "../db/schema.js";
import AppError from "../middlewares/errorHandler.js";
import z from "zod";
import MailService from "./mailService.js";
import type { JWTPayload } from "jose";
import AuthService from "./authService.js";

type InvitePayload = JWTPayload & {
  type: "contact-invite";
  inviter_id: number;
  invitee_id: number;
};

export default class ContactService {
  private db: DB;
  private mailService: MailService;
  private emailSchema = z.email().trim().toLowerCase();
  private authService: AuthService;

  public constructor(db: DB, mailService: MailService, authService: AuthService) {
    this.db = db;
    this.mailService = mailService;
    this.authService = authService;
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

    const inviteeArr = await this.db
      .select()
      .from(users)
      .where(eq(users.email, contactEmail))
      .limit(1);

    if (inviteeArr.length === 0) {
      throw new AppError("User not found", 404);
    }

    const invitee = inviteeArr[0];

    if (invitee.id === currentUserId) {
      throw new AppError("You cannot add yourself as a contact", 400);
    }

    const inviterArr = await this.db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    if (inviterArr.length === 0) {
      throw new AppError("Inviter user not found", 404);
    }

    const inviter = inviterArr[0];

    const payload: InvitePayload = {
      type: "contact-invite",
      inviter_id: currentUserId,
      invitee_id: invitee.id,
    };

    const token = await this.authService.generateToken(payload, "1d");

    await this.mailService.sendContactInvitation({
      invitee: {
        email: invitee.email,
        first_name: invitee.first_name,
        last_name: invitee.last_name,
      },
      inviter: {
        email: inviter.email,
        first_name: inviter.first_name,
        last_name: inviter.last_name,
      },
      token,
    });

    return {
      message: "Invitation sent",
    };
  }

  public async acceptInvitation(
    currentUserId: number,
    token: string,
  ): Promise<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }> {
    if (!token) {
      throw new AppError("Token is required", 400);
    }

    const rawPayload = await this.authService.verifyToken(token);
    const payload = rawPayload as InvitePayload;

    if (
        payload.type !== "contact-invite" ||
        typeof payload.inviter_id !== "number" ||
        typeof payload.invitee_id !== "number"
    ) {
        throw new AppError("Invalid invitation token", 400);
    }

    const inviterId = payload.inviter_id;
    const inviteeId = payload.invitee_id;

    if (currentUserId !== inviteeId) {
      throw new AppError("This invitation is not for this user", 403);
    }

    const inviterArr = await this.db
      .select()
      .from(users)
      .where(eq(users.id, inviterId))
      .limit(1);

    if (inviterArr.length === 0) {
      throw new AppError("Inviter user not found", 404);
    }

    const inviter = inviterArr[0];

    const [u1, u2] = this.normalizePair(inviterId, inviteeId);

    const existing = await this.db
      .select()
      .from(has_contact)
      .where(and(eq(has_contact.user_id_1, u1), eq(has_contact.user_id_2, u2)))
      .limit(1);

    if (existing.length === 0) {
      await this.db.insert(has_contact).values({
        user_id_1: u1,
        user_id_2: u2,
      });
    }

    return {
      id: inviter.id,
      email: inviter.email,
      first_name: inviter.first_name,
      last_name: inviter.last_name,
    };
  }

  public async removeContact(currentUserId: number, contactId: number) {
    const [u1, u2] = this.normalizePair(currentUserId, contactId);

    const deleted = await this.db
      .delete(has_contact)
      .where(and(eq(has_contact.user_id_1, u1), eq(has_contact.user_id_2, u2)))
      .returning({ user_id_1: has_contact.user_id_1 });

    if (deleted.length === 0) {
      throw new AppError("Contact not found", 404);
    }
  }

  public async assertIsContact(currentUserId: number, contactId: number) {
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
