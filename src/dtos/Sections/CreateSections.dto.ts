import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import CreateSectionDataDto from './CreateSectionData.dto';

class CreateSectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDataDto)
  public sectionData!: CreateSectionsDto[];
}

export default CreateSectionsDto;
