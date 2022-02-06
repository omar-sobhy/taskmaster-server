import { IsString } from 'class-validator';

class CreateTagDto {
  @IsString()
  public name!: string;
}

export default CreateTagDto;
