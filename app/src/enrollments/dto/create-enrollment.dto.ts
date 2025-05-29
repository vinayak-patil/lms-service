import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';
import { EnrollmentStatus } from '../entities/user-enrollment.entity';

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Course ID') })
  courseId: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Tenant ID') })
  tenantId: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('User ID') })
  userId: string;

  @ApiProperty({
    description: 'Enrollment end time',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('End time') })
  endTime?: string;

  @ApiProperty({
    description: 'Whether the plan is unlimited',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Unlimited plan') })
  @Type(() => Boolean)
  unlimitedPlan?: boolean;

  @ApiProperty({
    description: 'Additional parameters as JSON',
    example: '{"priority": "high", "notes": "VIP student"}',
    required: false,
  })
  @IsOptional()
  params?: any;

  @ApiProperty({
    description: 'User who enrolled the student',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Enrolled by') })
  enrolledBy?: string;
}
