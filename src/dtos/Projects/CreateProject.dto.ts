import { Type } from 'class-transformer';
import {
  IsArray, IsOptional, IsString, Length,
} from 'class-validator';
import CreateSectionDataDto from './CreateSectionData.dto';

class CreateProjectDto {
  @IsString()
  @Length(4)
  public name!: string;

  @IsString()
  public background!: string;

  @IsArray()
  @IsOptional()
  @Type(() => CreateSectionDataDto)
  public sectionData!: CreateSectionDataDto;
}

export default CreateProjectDto;
