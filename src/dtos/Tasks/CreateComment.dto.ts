import { IsString } from 'class-validator';

class CreateCommentDto {
  @IsString()
  public text!: string;
}

export default CreateCommentDto;
