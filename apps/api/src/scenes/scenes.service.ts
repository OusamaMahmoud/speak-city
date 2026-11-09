import { Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, count, eq } from "drizzle-orm";
import { Db, InjectDb } from "../db/db.module";
import { scenes, sceneWords, userScenes, userWords, words } from "../db/schema";

@Injectable()
export class ScenesService {
  constructor(@InjectDb() private db: Db) {}

  /** The map: every scene with how many of its words this user has found. */
  async list(userId: number) {
    const all = await this.db.select({ id: scenes.id, slug: scenes.slug, order: scenes.order, title: scenes.title, titleAr: scenes.titleAr, page: scenes.page }).from(scenes).orderBy(asc(scenes.order));
    const totals = await this.db.select({ sceneId: sceneWords.sceneId, n: count() }).from(sceneWords).groupBy(sceneWords.sceneId);
    const found = await this.db
      .select({ sceneId: sceneWords.sceneId, n: count() })
      .from(sceneWords)
      .innerJoin(userWords, and(eq(userWords.wordId, sceneWords.wordId), eq(userWords.userId, userId)))
      .groupBy(sceneWords.sceneId);
    const done = await this.db.select().from(userScenes).where(eq(userScenes.userId, userId));
    return all.map((s) => ({
      slug: s.slug, order: s.order, title: s.title, titleAr: s.titleAr, page: s.page,
      words: totals.find((t) => t.sceneId === s.id)?.n ?? 0,
      found: found.find((f) => f.sceneId === s.id)?.n ?? 0,
      completed: !!done.find((d) => d.sceneId === s.id)?.completedAt,
    }));
  }

  private async bySlug(slug: string) {
    const [scene] = await this.db.select().from(scenes).where(eq(scenes.slug, slug));
    if (!scene) throw new NotFoundException("No scene with that name.");
    return scene;
  }

  async get(slug: string, userId: number) {
    const scene = await this.bySlug(slug);
    const found = await this.db
      .select({ text: words.text })
      .from(sceneWords)
      .innerJoin(words, eq(words.id, sceneWords.wordId))
      .innerJoin(userWords, and(eq(userWords.wordId, sceneWords.wordId), eq(userWords.userId, userId)))
      .where(eq(sceneWords.sceneId, scene.id));
    const [us] = await this.db.select().from(userScenes).where(and(eq(userScenes.userId, userId), eq(userScenes.sceneId, scene.id)));
    return { content: scene.content, foundWords: found.map((f) => f.text), completed: !!us?.completedAt };
  }

  async complete(slug: string, userId: number, mistakes: number) {
    const scene = await this.bySlug(slug);
    const [prev] = await this.db.select().from(userScenes).where(and(eq(userScenes.userId, userId), eq(userScenes.sceneId, scene.id)));
    const best = prev?.bestMistakes == null ? mistakes : Math.min(prev.bestMistakes, mistakes);
    if (prev) {
      await this.db.update(userScenes).set({ completedAt: prev.completedAt ?? new Date(), bestMistakes: best, plays: prev.plays + 1 })
        .where(and(eq(userScenes.userId, userId), eq(userScenes.sceneId, scene.id)));
    } else {
      await this.db.insert(userScenes).values({ userId, sceneId: scene.id, completedAt: new Date(), bestMistakes: mistakes, plays: 1 });
    }
    return { ok: true, bestMistakes: best };
  }
}
