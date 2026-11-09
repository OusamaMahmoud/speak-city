import { mysqlTable, int, varchar, text, json, datetime, primaryKey, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const now = () => datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`);

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  name: varchar("name", { length: 60 }).notNull(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  createdAt: now(),
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

/** One scene = one page of the vocabulary book. `content` holds the full SceneDef JSON. */
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull(),
  order: int("sort_order").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  titleAr: varchar("title_ar", { length: 120 }).notNull(),
  page: int("page").notNull(),
  content: json("content").notNull(),
}, (t) => [uniqueIndex("scenes_slug_uq").on(t.slug)]);

/** The book's dictionary. A word can appear in several scenes but is learned once. */
export const words = mysqlTable("words", {
  id: int("id").autoincrement().primaryKey(),
  text: varchar("text", { length: 120 }).notNull(),
  ar: varchar("ar", { length: 191 }).notNull(),
  example: text("example").notNull(),
}, (t) => [uniqueIndex("words_text_uq").on(t.text)]);

export const sceneWords = mysqlTable("scene_words", {
  sceneId: int("scene_id").notNull().references(() => scenes.id, { onDelete: "cascade" }),
  wordId: int("word_id").notNull().references(() => words.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.sceneId, t.wordId] })]);

/** A word the user has found, with its spaced-repetition state (Leitner box). */
export const userWords = mysqlTable("user_words", {
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  wordId: int("word_id").notNull().references(() => words.id, { onDelete: "cascade" }),
  foundAt: datetime("found_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  box: int("box").notNull().default(1),
  dueAt: datetime("due_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  reviews: int("reviews").notNull().default(0),
  lapses: int("lapses").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.wordId] }), index("user_words_due_idx").on(t.userId, t.dueAt)]);

export const userScenes = mysqlTable("user_scenes", {
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sceneId: int("scene_id").notNull().references(() => scenes.id, { onDelete: "cascade" }),
  completedAt: datetime("completed_at", { mode: "date" }),
  bestMistakes: int("best_mistakes"),
  plays: int("plays").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.sceneId] })]);
