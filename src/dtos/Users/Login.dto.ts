import { IsString, MaxLength, MinLength } from 'class-validator';

class LoginDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  public username!: string;

  @IsString()
  @MaxLength(255)
  public password!: string;
}

export default LoginDto;
