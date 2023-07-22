import { IsString, MaxLength, MinLength } from 'class-validator';
import IsValidRgbString from '../decorators/IsValidRgbString.dto';

class CreateSectionDataDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  public name!: string;

  @IsString()
  @IsValidRgbString()
  public colour!: string;

  @IsString()
  @MaxLength(255)
  public icon!: string;
}

export default CreateSectionDataDto;
