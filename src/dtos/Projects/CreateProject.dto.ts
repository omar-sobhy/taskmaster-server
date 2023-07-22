import { Type } from 'class-transformer';
import {
  IsArray, IsOptional, IsString, Length, MaxLength, MinLength,
} from 'class-validator';
import CreateSectionDataDto from './CreateSectionData.dto';

class CreateProjectDto {
  @IsString()
  @MinLength(4)
  @MaxLength(255)
  public name!: string;

  @IsString()
  public background!: string;

  @IsArray()
  @IsOptional()
  @Type(() => CreateSectionDataDto)
  public sectionData!: CreateSectionDataDto;
}

export default CreateProjectDto;
