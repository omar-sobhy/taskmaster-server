import { IsOptional, IsString } from 'class-validator';

class UpdateSectionDto {
  @IsString()
  @IsOptional()
  public name!: string;

  @IsString()
  @IsOptional()
  public colour!: string;

  @IsString()
  @IsOptional()
  public icon!: string;
}

export default UpdateSectionDto;
