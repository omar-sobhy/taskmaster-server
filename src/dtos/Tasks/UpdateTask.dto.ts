import { IsOptional, IsString } from 'class-validator';

class UpdateTaskDto {
  @IsString()
  @IsOptional()
  public name!: string;

  @IsString()
  @IsOptional()
  public dueDate!: string;
}

export default UpdateTaskDto;
