import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsInt, Max, Min } from "class-validator";
import { ScenesService } from "./scenes.service";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";

class CompleteDto { @IsInt() @Min(0) @Max(999) mistakes: number }

@Controller("scenes")
export class ScenesController {
  constructor(private scenes: ScenesService) {}
  @Get() list(@CurrentUser() u: AuthUser) { return this.scenes.list(u.id); }
  @Get(":slug") get(@Param("slug") slug: string, @CurrentUser() u: AuthUser) { return this.scenes.get(slug, u.id); }
  @Post(":slug/complete") complete(@Param("slug") slug: string, @Body() dto: CompleteDto, @CurrentUser() u: AuthUser) {
    return this.scenes.complete(slug, u.id, dto.mistakes);
  }
}
