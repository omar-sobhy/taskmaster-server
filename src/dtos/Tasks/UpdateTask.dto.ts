import { IsOptional, IsString } from 'class-validator';
import { IsValidDateString } from '../decorators/IsValidDateString.dto';

class UpdateTaskDto {
  @IsString()
  @IsOptional()
  public name!: string;

  @IsString()
  @IsOptional()
  @IsValidDateString()
  public dueDate!: string;

  @IsString()
  @IsOptional()
  public tag!: string;
}

export default UpdateTaskDto;
