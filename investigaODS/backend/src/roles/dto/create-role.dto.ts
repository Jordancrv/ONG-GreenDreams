import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'MENTOR' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z_]+$/, { message: 'code must contain only uppercase letters and underscores' })
  code!: string;

  @ApiProperty({ example: 'Mentor' })
  @IsString()
  @Length(2, 100)
  name!: string;
}
