import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type DB = ReturnType<typeof drizzle>;

export default async function startDatabase(
    databaseUrl?: string,
): Promise<{ db: DB; pool: Pool }> {
    let db: DB | undefined;

    if (!databaseUrl) {
        console.error("Database URL is not valid.");
        throw new Error(
            "Database URL is not valid: \
            expected env variables POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB.",
        );
    }

    if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
    ) {
        databaseUrl = databaseUrl.replace("db", "localhost");
    }
    const pool = new Pool({ connectionString: databaseUrl });

    let connected = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!connected && attempts < maxAttempts) {
        try {
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
                await pool.end();
                throw error;
            }
            console.warn(
                `Connection attempt failed (${attempts}/${maxAttempts}). Retrying in 2 seconds...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    if (!db) {
        console.error("Database connection was not established.");
        throw new Error("Database connection was not established.");
    }

    try {
        await migrate(db, { migrationsFolder: "drizzle" });
        console.log("Database migration successful.");
    } catch (error: unknown) {
        if ((error as any).cause?.code === "42P07") {
            console.log("Migration skipped: already exists.");
        } else {
            console.error("Error during database migration:", error);
            await pool.end();
            throw error;
        }
    }

    return { db, pool };
}
