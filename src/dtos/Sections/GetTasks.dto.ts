import { IsOptional, IsString } from 'class-validator';

class GetTasksDto {
  @IsString()
  @IsOptional()
  public sectionId!: string;
}

export default GetTasksDto;
