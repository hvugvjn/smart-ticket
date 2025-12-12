import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:Vishal%40123@localhost:5432/smart_ticket',
});

const db = drizzle(pool, { schema });

async function runMigrations() {
    try {
        console.log("Running migrations...");
        await migrate(db, { migrationsFolder: "migrations" });
        console.log("Migrations completed successfully");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
