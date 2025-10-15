import { pgTable, serial, integer, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 60 }),
    first_name: varchar("first_name", { length: 30 }),
    last_name: varchar("last_name", { length: 30 }),
    password: varchar("password", { length: 255 }),
});
