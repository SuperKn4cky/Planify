import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type DB = ReturnType<typeof drizzle>;

export default async function startDatabase(
    databaseUrl?: string,
): Promise<{ db: DB; pool: Pool }> {
    let db: DB | undefined;

    if (!databaseUrl) {
        console.error("Database URL is not valid.");
        throw new Error("Database URL is not valid or missing.");
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

    return { db, pool };
}
