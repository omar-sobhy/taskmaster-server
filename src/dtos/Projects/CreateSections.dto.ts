import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import CreateSectionDataDto from './CreateSectionData.dto';

class CreateSectionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDataDto)
  public sections!: CreateSectionsDto[];
}

export default CreateSectionsDto;
