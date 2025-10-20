import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey().notNull(),
    email: varchar("email", { length: 60 }).unique().notNull(),
    first_name: varchar("first_name", { length: 30 }).notNull(),
    last_name: varchar("last_name", { length: 30 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    revocation_timestamp: timestamp("revocation_timestamp")
        .defaultNow()
        .notNull(),
});
