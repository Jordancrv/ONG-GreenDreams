import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @ApiPropertyOptional({ description: 'Module order position (0-based)' })
  @IsOptional()
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
