import { IsOptional, IsString } from 'class-validator';

class CreateSectionDataDto {
  @IsString()
  public name!: string;

  @IsString()
  public colour!: string;

  @IsString()
  public icon!: string;

  @IsString()
  @IsOptional()
  public project!: string;
}

export default CreateSectionDataDto;
