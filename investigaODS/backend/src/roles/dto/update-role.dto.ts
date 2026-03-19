import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'MENTOR' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z_]+$/, { message: 'code must contain only uppercase letters and underscores' })
  code?: string;

  @ApiPropertyOptional({ example: 'Mentor' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
}
