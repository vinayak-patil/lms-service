import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsUUID, IsObject, IsDateString, MinLength, MaxLength, Matches, ValidateIf, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../entities/course.entity';
import { HelperUtil } from '../../common/utils/helper.util';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';

export class CreateCourseDto {
  @ApiPropertyOptional({ 
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Course ID') })
  id?: string;

  @ApiProperty({ 
    description: VALIDATION_MESSAGES.COURSE.TITLE,
    example: 'Introduction to Web Development',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Title') })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Title') })
  @MinLength(3, { message: VALIDATION_MESSAGES.COMMON.MIN_LENGTH('Title', 3) })
  @MaxLength(255, { message: VALIDATION_MESSAGES.COMMON.MAX_LENGTH('Title', 255) })
  title: string;

  @ApiProperty({ 
    description: VALIDATION_MESSAGES.COURSE.ALIAS,
    example: 'intro-web-dev',
  })
  @IsOptional()
  alias: string;

  @ApiProperty({ 
    description: VALIDATION_MESSAGES.COURSE.START_DATE,
    example: '2024-01-01T00:00:00Z',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Start date') })
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('Start date') })
  startDatetime: string;

  @ApiProperty({ 
    description: VALIDATION_MESSAGES.COURSE.END_DATE,
    example: '2024-12-31T23:59:59Z',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('End date') })
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('End date') })
  @ValidateIf((o) => o.startDatetime)
  @Validate(HelperUtil.validateDatetimeConstraints, {
    message: 'Invalid datetime constraints. Start date must be in the future, end date must follow start date, and duration must be between 1 day and 1 year.'
  })
  endDatetime: string;

  @ApiProperty({ 
    description: VALIDATION_MESSAGES.COURSE.SHORT_DESCRIPTION,
    example: 'A brief intro to web development',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Short description') })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Short description') })
  @MinLength(3, { message: VALIDATION_MESSAGES.COMMON.MIN_LENGTH('Short description', 3) })
  @MaxLength(255, { message: VALIDATION_MESSAGES.COMMON.MAX_LENGTH('Short description', 255) })
  shortDescription: string;

  @ApiProperty({ 
    description: VALIDATION_MESSAGES.COURSE.DESCRIPTION,
    example: 'Learn the fundamentals of web development',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Description') })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Description') })
  description: string;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.IMAGE,
    example: 'https://example.com/images/course-thumbnail.jpg'
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Image') })
  @Matches(/\.(jpg|jpeg|png)$/i, { message: VALIDATION_MESSAGES.COMMON.IMAGE_FORMAT })
  image?: string;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.FEATURED,
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Featured') })
  @Type(() => Boolean)
  featured?: boolean = false;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.FREE,
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Free') })
  @Type(() => Boolean)
  free?: boolean = false;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.STATUS,
    enum: CourseStatus,
    example: CourseStatus.UNPUBLISHED,
    default: CourseStatus.UNPUBLISHED
  })
  @IsOptional()
  @IsEnum(CourseStatus, { message: VALIDATION_MESSAGES.COMMON.ENUM('Status') })
  status?: CourseStatus = CourseStatus.UNPUBLISHED;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.ADMIN_APPROVAL,
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Admin approval') })
  @Type(() => Boolean)
  adminApproval?: boolean = false;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.AUTO_ENROLL,
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Auto enroll') })
  @Type(() => Boolean)
  autoEnroll?: boolean = false;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.CERTIFICATE_TERM,
    example: { term: 'completion' }
  })
  @IsOptional()
  @IsObject({ message: VALIDATION_MESSAGES.COMMON.OBJECT('Certificate term') })
  certificateTerm?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.CERTIFICATE_ID,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Certificate ID') })
  certificateId?: string;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.PARAMS,
    example: {
      difficulty: 'intermediate',
      prerequisites: ['basic-programming'],
      learningOutcomes: ['outcome1', 'outcome2']
    }
  })
  @IsOptional()
  @IsObject({ message: VALIDATION_MESSAGES.COMMON.OBJECT('Additional parameters') })
  params?: Record<string, any>;
}