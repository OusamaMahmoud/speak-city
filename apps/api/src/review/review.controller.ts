import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { IsIn } from "class-validator";
import { and, asc, count, eq, inArray, lte } from "drizzle-orm";
import { Grade, nextReview } from "@speak-city/shared";
import { Db, InjectDb } from "../db/db.module";
import { scenes, sceneWords, userWords, words } from "../db/schema";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";

class GradeDto { @IsIn(["again", "hard", "good"]) grade: Grade }

@Controller("review")
export class ReviewController {
  constructor(@InjectDb() private db: Db) {}

  /** Words due now, oldest first, plus how many words sit in each Leitner box. */
  @Get()
  async due(@CurrentUser() u: AuthUser, @Query("limit") limit = "30") {
    const rows = await this.db
      .select({ wordId: words.id, text: words.text, ar: words.ar, example: words.example, box: userWords.box })
      .from(userWords)
      .innerJoin(words, eq(words.id, userWords.wordId))
      .where(and(eq(userWords.userId, u.id), lte(userWords.dueAt, new Date())))
      .orderBy(asc(userWords.dueAt))
      .limit(Math.min(100, Number(limit) || 30));
    const where = rows.length
      ? await this.db.select({ wordId: sceneWords.wordId, title: scenes.title }).from(sceneWords).innerJoin(scenes, eq(scenes.id, sceneWords.sceneId)).where(inArray(sceneWords.wordId, rows.map((r) => r.wordId)))
      : [];
    const boxes = await this.db.select({ box: userWords.box, n: count() }).from(userWords).where(eq(userWords.userId, u.id)).groupBy(userWords.box);
    return {
      items: rows.map((r) => ({ ...r, scene: where.find((w) => w.wordId === r.wordId)?.title ?? null })),
      boxes: Object.fromEntries(boxes.map((b) => [b.box, b.n])),
    };
  }

  @Post(":wordId")
  async grade(@Param("wordId", ParseIntPipe) wordId: number, @Body() dto: GradeDto, @CurrentUser() u: AuthUser) {
    const key = and(eq(userWords.userId, u.id), eq(userWords.wordId, wordId));
    const [row] = await this.db.select().from(userWords).where(key);
    if (!row) throw new NotFoundException("You haven't found this word yet.");
    const { box, dueAt } = nextReview(row.box, dto.grade);
    await this.db.update(userWords).set({ box, dueAt, reviews: row.reviews + 1, lapses: row.lapses + (dto.grade === "again" ? 1 : 0) }).where(key);
    return { box, dueAt };
  }
}
