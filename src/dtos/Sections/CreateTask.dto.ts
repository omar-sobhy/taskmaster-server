import { IsDateString, IsOptional, IsString } from 'class-validator';

class CreateTaskDto {
  @IsString()
  public name!: string;

  @IsDateString()
  @IsOptional()
  public dueDate!: string;

  @IsString()
  @IsOptional()
  public assignee!: string;
}

export default CreateTaskDto;
