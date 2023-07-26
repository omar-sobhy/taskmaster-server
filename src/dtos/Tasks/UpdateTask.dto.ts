import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import IsValidDateString from '../decorators/IsValidDateString.dto';
import IsValidTagId from '../../validation/tag/ValidTagIdDecorator';

class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  public name!: string;

  @IsString()
  @IsOptional()
  @IsValidDateString(true)
  public dueDate!: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IsValidTagId)
  public tags!: string[];

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  public description!: string;
}

export default UpdateTaskDto;
