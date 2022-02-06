import { Type } from 'class-transformer';
import { IsArray } from 'class-validator';

class GetUsersDto {
  @IsArray()
  @Type(() => String)
  public userIds!: string[];
}

export default GetUsersDto;
