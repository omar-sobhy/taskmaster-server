import { IsOptional, IsString } from 'class-validator';
import IsValidRgbString from '../decorators/IsValidRgbString.dto';

class UpdateTagDto {
  @IsString()
  @IsOptional()
  public name!: string;

  @IsString()
  @IsOptional()
  @IsValidRgbString()
  public colour!: string;
}

export default UpdateTagDto;
