import { pgTable, serial, timestamp, varchar, integer, pgEnum, primaryKey  } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["todo", "doing", "done"]);
export const permissionEnum = pgEnum("permission", ["owner", "read", "write"]);

export const users = pgTable("users", {
    id: serial("id").primaryKey().notNull(),
    email: varchar("email", { length: 60 }).unique().notNull(),
    first_name: varchar("first_name", { length: 30 }).notNull(),
    last_name: varchar("last_name", { length: 30 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    revocation_timestamp: timestamp("revocation_timestamp").notNull(),
});

export const has_contact = pgTable(
    "has_contact",
    {
        user_id_1: integer("user_id_1")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        user_id_2: integer("user_id_2")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
    },
    (t) => [
        primaryKey({ columns: [t.user_id_1, t.user_id_2] }),
    ],
);

export const tasks = pgTable("tasks", {
    id: serial("id").primaryKey().notNull(),
    folder_id: integer("folder_id").references(() => folders.id, { onDelete: "set null"}),
    responsible_user: integer("responsible_user").references(() => users.id, { onDelete: "set null"}),
    title: varchar("title", { length: 60}).notNull(),
    description: varchar("description", { length: 255}),
    due_date: timestamp("due_date"),
    status: statusEnum("status").notNull().default("todo"),
    priority: integer("priority").notNull().default(1),
});

export const users_own_tasks = pgTable(
    "users_own_tasks",
    {
        user_id: integer("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        task_id: integer("task_id")
            .notNull()
            .references(() => tasks.id, { onDelete: "cascade" }),
        permission: permissionEnum("permission").notNull().default("owner"),
    },
    (t) => [
        primaryKey({ columns: [t.user_id, t.task_id] }),
    ],
);

export const folders = pgTable("folders", {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", {length: 60}).notNull(),
});

export const users_own_folders = pgTable(
    "users_own_folders",
    {
        user_id: integer("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        folder_id: integer("folder_id")
            .notNull()
            .references(() => folders.id, { onDelete: "cascade" }),
        permission: permissionEnum("permission").notNull().default("owner"),
    },
    (t) => [
        primaryKey({ columns: [t.user_id, t.folder_id] }),
    ],
);