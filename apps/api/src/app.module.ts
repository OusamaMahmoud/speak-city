import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DbModule } from "./db/db.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { UsersModule } from "./users/users.module";
import { ScenesModule } from "./scenes/scenes.module";
import { ProgressModule } from "./progress/progress.module";
import { ReviewModule } from "./review/review.module";
import { HealthController } from "./common/health.controller";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, AuthModule, UsersModule, ScenesModule, ProgressModule, ReviewModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
