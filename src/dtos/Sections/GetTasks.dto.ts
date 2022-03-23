import { IsString } from 'class-validator';

class GetTasksDto {
  @IsString()
  public sectionId!: string;
}

export default GetTasksDto;
