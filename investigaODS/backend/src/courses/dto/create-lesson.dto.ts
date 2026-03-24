import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonDto {
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
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  durationMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  resources?: Record<string, unknown>;
}
