import {
  IsDateString, IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';

class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  public name!: string;

  @IsDateString()
  @IsOptional()
  public dueDate!: string;

  @IsString()
  @IsOptional()
  public assignee!: string;
}

export default CreateTaskDto;
