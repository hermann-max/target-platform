/**
 * Applies database migrations and creates the first admin account.
 * Runs before every build (see package.json) and can be run by hand with `npm run db:migrate`.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { existsSync, readFileSync } from "node:fs";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  loadDotEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "\n✖ DATABASE_URL is not set.\n" +
        "  On Vercel: open the project → Storage → Create Database → Neon, connect it to this project, then redeploy.\n" +
        "  Locally: copy .env.example to .env and fill it in.\n",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });

  console.log("Applying database migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
  if (count === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
      await db.insert(schema.users).values({
        email,
        name: process.env.ADMIN_NAME?.trim() || email.split("@")[0],
        role: "admin",
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
      });
      console.log(`Created the first admin account for ${email}.`);
    } else {
      console.warn("⚠ No users exist yet. Set ADMIN_EMAIL and ADMIN_PASSWORD and redeploy to create the first admin.");
    }
  }

  await db.insert(schema.foundation).values({ id: 1 }).onConflictDoNothing();
  await pool.end();
  console.log("Database ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
