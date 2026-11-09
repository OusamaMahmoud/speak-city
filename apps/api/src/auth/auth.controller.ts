import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Public } from "../common/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}
  @Public() @Post("register") register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Public() @HttpCode(200) @Post("login") login(@Body() dto: LoginDto) { return this.auth.login(dto); }
}
