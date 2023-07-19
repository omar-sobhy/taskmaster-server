import { IsString, MinLength } from 'class-validator';

class CreateUserDto {
  @IsString()
  @MinLength(4)
  public username!: string;

  @IsString()
  public password!: string;

  @IsString()
  public email!: string;
}

export default CreateUserDto;
