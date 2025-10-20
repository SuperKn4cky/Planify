import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export let db: ReturnType<typeof drizzle>;
export let pool: Pool;

export default async function startDatabase(
    databaseUrl?: string,
): Promise<ReturnType<typeof drizzle>> {
    let DATABASE_URL = databaseUrl || null;

    if (!DATABASE_URL) {
        console.error("DATABASE_URL is not defined in environment variables.");
        throw new Error(
            "DATABASE_URL is not defined in environment variables.",
        );
    }

    let connected = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!connected && attempts < maxAttempts) {
        try {
            pool = new Pool({ connectionString: DATABASE_URL });
            db = drizzle(pool);
            await db.execute("select 1");
            connected = true;
            console.log("Connected to the database.");
        } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                console.error(
                    "Error connecting to database after 5 attempts:",
                    error,
                );
                throw error;
            }
            console.warn(
                `Connection attempt failed (${attempts}/${maxAttempts}). Retrying in 2 seconds...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    try {
        await migrate(db, { migrationsFolder: "drizzle" });
        console.log("Database migration successful.");
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "42710") {
            console.log("Migration skipped: already exists.");
        } else {
            console.error("Error during database migration:", error);
            throw error;
        }
    }

    return db;
}
