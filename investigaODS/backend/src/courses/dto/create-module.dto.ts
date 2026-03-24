import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  position!: number;

  @ApiPropertyOptional({ deprecated: true, description: 'Use position instead' })
  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;
}
