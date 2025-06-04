import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';

export class StartLessonTrackingDto {

  @ApiProperty({
    description: 'Course ID (optional - if tracking within a course)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Course ID') })
  @IsOptional()
  courseId?: string;

  @ApiProperty({ 
    description: 'Current progress percentage (0-100)',
    example: 0,
    required: false,
    default: 0
  })
  @IsNumber({}, { message: VALIDATION_MESSAGES.COMMON.NUMBER('Progress') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.MIN_VALUE('Progress', 0) })
  @Max(100, { message: VALIDATION_MESSAGES.COMMON.MAX_VALUE('Progress', 100) })
  @IsOptional()
  @Type(() => Number)
  progress?: number = 0;

}