import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

export class RegisterDto {
  @IsString() @MinLength(1) @MaxLength(60) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(100) password: string;
}
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
