import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import * as schema from "./schema";

export const DB = Symbol("DB");
export const POOL = Symbol("POOL");
export type Db = MySql2Database<typeof schema>;
/** Inject the Drizzle database: `constructor(@InjectDb() db: Db)` */
export const InjectDb = () => Inject(DB);

@Global()
@Module({
  providers: [
    {
      provide: POOL,
      useFactory: () => {
        const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10, timezone: "Z" });
        /* keep the server's CURRENT_TIMESTAMP in UTC, like the dates the app writes */
        pool.pool.on("connection", (c) => c.query("SET time_zone = '+00:00'"));
        return pool;
      },
    },
    { provide: DB, inject: [POOL], useFactory: (pool: mysql.Pool) => drizzle(pool, { schema, mode: "default" }) },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private pool: mysql.Pool) {}
  async onApplicationShutdown() {
    await this.pool.end();
  }
}
