import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';
import { TrackingStatus } from '../entities/course-track.entity';

export class UpdateCourseTrackingDto {
  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Course ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Course ID') })
  courseId: string;

  @ApiProperty({
    description: 'Current status of the course tracking',
    example: TrackingStatus.COMPLETED,
    required: false
  })
  @IsEnum(TrackingStatus, { message: VALIDATION_MESSAGES.COMMON.ENUM('Status') })
  @IsOptional()
  @Type(() => String)
  status?: TrackingStatus;

  @ApiProperty({
    description: 'Number of completed lessons',
    example: 10,
    required: false
  })
  @IsNumber({}, { message: VALIDATION_MESSAGES.COMMON.NUMBER('Completed lessons') })
  @IsOptional()
  @Type(() => Number)
  completedLessons?: number;

  @ApiProperty({ 
    description: 'Whether to mark the course as completed',
    example: false,
    required: false,
    default: false
  })
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Completed') })
  @IsOptional()
  @Type(() => Boolean)
  completed?: boolean = false;

}