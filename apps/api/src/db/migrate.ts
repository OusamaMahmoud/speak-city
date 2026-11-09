import "dotenv/config";
import * as path from "path";
import * as mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

/** Applies pending SQL migrations from ./drizzle. Run before starting the API. */
async function main() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: true });
  await migrate(drizzle(conn), { migrationsFolder: path.join(__dirname, "..", "..", "drizzle") });
  await conn.end();
  console.log("migrations applied");
}
main().catch((e) => { console.error(e); process.exit(1); });
