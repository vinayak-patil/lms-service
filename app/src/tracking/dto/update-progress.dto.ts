import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';

export class UpdateProgressDto {
  @ApiProperty({
    description: 'Completion percentage (0-100)',
    example: 65,
    required: true
  })
  @IsNumber({}, { message: VALIDATION_MESSAGES.COMMON.NUMBER('Completion percentage') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.MIN_VALUE('Completion percentage', 0) })
  @Max(100, { message: VALIDATION_MESSAGES.COMMON.MAX_VALUE('Completion percentage', 100) })
  @Type(() => Number)
  completionPercentage: number;

  @ApiProperty({
    description: 'Current section ID',
    example: 'section_3',
    required: false
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Current section') })
  currentSection?: string;
} 