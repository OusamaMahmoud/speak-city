import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import { Db, InjectDb } from "../db/db.module";
import { users } from "../db/schema";
import { LoginDto, RegisterDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(@InjectDb() private db: Db, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) throw new ConflictException("This email already has an account.");
    const [res] = await this.db.insert(users).values({ email, name: dto.name.trim(), passwordHash: await bcrypt.hash(dto.password, 10) }).$returningId();
    return this.token(res.id, email);
  }

  async login(dto: LoginDto) {
    const [user] = await this.db.select().from(users).where(eq(users.email, dto.email.toLowerCase().trim()));
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException("Wrong email or password.");
    return this.token(user.id, user.email);
  }

  private async token(id: number, email: string) {
    return { token: await this.jwt.signAsync({ sub: id, email }) };
  }
}
