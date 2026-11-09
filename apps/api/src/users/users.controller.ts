import { Controller, Get } from "@nestjs/common";
import { and, count, eq, lte } from "drizzle-orm";
import { BOOK_TOTAL } from "@speak-city/shared";
import { Db, InjectDb } from "../db/db.module";
import { users, userWords } from "../db/schema";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";

@Controller("me")
export class UsersController {
  constructor(@InjectDb() private db: Db) {}

  @Get()
  async me(@CurrentUser() u: AuthUser) {
    const [user] = await this.db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, u.id));
    const [[found], [due]] = await Promise.all([
      this.db.select({ n: count() }).from(userWords).where(eq(userWords.userId, u.id)),
      this.db.select({ n: count() }).from(userWords).where(and(eq(userWords.userId, u.id), lte(userWords.dueAt, new Date()))),
    ]);
    return { ...user, stats: { wordsFound: found.n, due: due.n, bookTotal: Number(process.env.BOOK_TOTAL ?? BOOK_TOTAL) } };
  }
}
