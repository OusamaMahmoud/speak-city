import { Body, Controller, Post } from "@nestjs/common";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from "class-validator";
import { count, eq, inArray, sql } from "drizzle-orm";
import { Db, InjectDb } from "../db/db.module";
import { userWords, words } from "../db/schema";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";

class FoundDto { @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsString({ each: true }) words: string[] }

@Controller("progress")
export class ProgressController {
  constructor(@InjectDb() private db: Db) {}

  /** Marks words as found. Found words enter spaced repetition, due right away. */
  @Post("words")
  async found(@Body() dto: FoundDto, @CurrentUser() u: AuthUser) {
    const ws = await this.db.select({ id: words.id }).from(words).where(inArray(words.text, dto.words));
    const [{ n: before }] = await this.db.select({ n: count() }).from(userWords).where(eq(userWords.userId, u.id));
    if (ws.length) {
      await this.db.insert(userWords).values(ws.map((w) => ({ userId: u.id, wordId: w.id, foundAt: new Date(), dueAt: new Date() }))).onDuplicateKeyUpdate({ set: { userId: sql`user_id` } });
    }
    const [{ n: total }] = await this.db.select({ n: count() }).from(userWords).where(eq(userWords.userId, u.id));
    return { added: total - before, total };
  }
}
