import { IsString, MaxLength } from 'class-validator';

class CreateCommentDto {
  @IsString()
  @MaxLength(10000)
  public text!: string;
}

export default CreateCommentDto;
