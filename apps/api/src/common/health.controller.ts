import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { Public } from "./public.decorator";
import { Db, InjectDb } from "../db/db.module";

@Controller("health")
export class HealthController {
  constructor(@InjectDb() private db: Db) {}
  @Public()
  @Get()
  async health() {
    await this.db.execute(sql`SELECT 1`);
    return { ok: true };
  }
}
