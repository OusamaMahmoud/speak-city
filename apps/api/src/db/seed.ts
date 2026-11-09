import "dotenv/config";
import * as mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { loadScenes } from "@speak-city/shared/dist/node";
import * as schema from "./schema";

/** Loads every scene file from packages/shared/content/scenes. Safe to re-run. */
async function main() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  const db = drizzle(conn, { schema, mode: "default" });
  for (const s of loadScenes()) {
    const row = { slug: s.slug, order: s.order, title: s.title, titleAr: s.titleAr, page: s.page, content: s };
    await db.insert(schema.scenes).values(row).onDuplicateKeyUpdate({ set: { order: row.order, title: row.title, titleAr: row.titleAr, page: row.page, content: row.content } });
    const [scene] = await db.select({ id: schema.scenes.id }).from(schema.scenes).where(eq(schema.scenes.slug, s.slug));
    for (const w of s.words) {
      await db.insert(schema.words).values({ text: w.en, ar: w.ar, example: w.example }).onDuplicateKeyUpdate({ set: { text: sql`text` } });
      const [word] = await db.select({ id: schema.words.id }).from(schema.words).where(eq(schema.words.text, w.en));
      await db.insert(schema.sceneWords).values({ sceneId: scene.id, wordId: word.id }).onDuplicateKeyUpdate({ set: { sceneId: sql`scene_id` } });
    }
    console.log(`seeded ${s.slug}: ${s.words.length} words`);
  }
  await conn.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
