import {
  IsEmail, IsString, MaxLength, MinLength,
} from 'class-validator';

class CreateUserDto {
  @IsString()
  @MinLength(4)
  @MaxLength(65)
  public username!: string;

  @IsString()
  @MaxLength(255)
  public password!: string;

  @IsString()
  @IsEmail()
  @MaxLength(255)
  public email!: string;
}

export default CreateUserDto;
