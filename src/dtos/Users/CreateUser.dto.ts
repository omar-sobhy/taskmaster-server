import { IsString } from 'class-validator';

class CreateUserDto {
  @IsString()
  public username!: string;

  @IsString()
  public password!: string;

  @IsString()
  public email!: string;
}

export default CreateUserDto;
