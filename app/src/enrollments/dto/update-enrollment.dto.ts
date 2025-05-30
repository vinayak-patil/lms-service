import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';
import { EnrollmentStatus } from '../entities/user-enrollment.entity';

export class UpdateEnrollmentDto {
  @ApiProperty({
    description: 'Enrollment status',
    example: EnrollmentStatus.PUBLISHED,
    required: false,
    enum: EnrollmentStatus,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { message: VALIDATION_MESSAGES.COMMON.ENUM('Status') })
  status?: EnrollmentStatus;

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
    description: 'Whether before expiry mail is sent',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Before expiry mail') })
  @Type(() => Boolean)
  beforeExpiryMail?: boolean;

  @ApiProperty({
    description: 'Whether after expiry mail is sent',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('After expiry mail') })
  @Type(() => Boolean)
  afterExpiryMail?: boolean;

  @ApiProperty({
    description: 'Additional parameters as JSON',
    example: '{"priority": "high", "notes": "VIP student"}',
    required: false,
  })
  @IsOptional()
  params?: any;
}
