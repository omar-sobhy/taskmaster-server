import {
  IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';
import IsValidRgbString from '../decorators/IsValidRgbString.dto';

class UpdateSectionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  public name!: string;

  @IsString()
  @IsOptional()
  @IsValidRgbString()
  public colour!: string;

  @IsString()
  @IsOptional()
  public icon!: string;
}

export default UpdateSectionDto;
