import { ApiProperty, PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
  ValidateIf,
  Matches,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';
import { LessonFormat, LessonSubFormat, AttemptsGradeMethod } from '../entities/lesson.entity';
import { LessonStatus } from '../entities/lesson.entity';
import { CreateLessonDto } from './create-lesson.dto';

// Inherits all fields from CreateLessonDto as optional, except for format which shouldn't be updatable
export class UpdateLessonDto extends PartialType(
  OmitType(CreateLessonDto, ['format'] as const)
) {  

  @ApiProperty({
    description: 'Lesson format',
    example: LessonFormat.VIDEO,
    required: false
  })
  @IsOptional()
  @IsEnum(LessonFormat, { message: VALIDATION_MESSAGES.COMMON.ENUM('Format') })
  format?: LessonFormat;
  
  @ApiProperty({
    description: 'Media content source',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    required: false
  })
  @ValidateIf((o) => o.format && o.format !== LessonFormat.DOCUMENT)
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Media content source') })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Source') })
  mediaContentSource?: string;

  @ApiProperty({
    description: 'Media content path',
    example: '/course/uuid.pdf',
    required: true
  })
  @ValidateIf((o) => o.format && o.format === LessonFormat.DOCUMENT)
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Media content path') })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Path') })
  mediaContentPath?: string;

  @ApiProperty({
    description: 'Media content sub-format',
    example: 'youtube',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Media content sub-format') })
  @IsEnum(LessonSubFormat, { message: VALIDATION_MESSAGES.COMMON.ENUM('Media content sub-format') })  
  mediaContentSubFormat?: LessonSubFormat;

  @ApiProperty({
    description: 'User ID who checked out the lesson',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Checked out user ID') })
  checkedOut?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.TITLE,
    example: 'Introduction to Machine Learning',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Title') })
  @MinLength(3, { message: VALIDATION_MESSAGES.COMMON.MIN_LENGTH('Title', 3) })
  @MaxLength(255, { message: VALIDATION_MESSAGES.COMMON.MAX_LENGTH('Title', 255) })  
  title?: string;

  @ApiProperty({
    description: 'Lesson alias/URL slug',
    example: 'intro-machine-learning',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Alias') })
  alias?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.STATUS,
    example: LessonStatus.PUBLISHED,
    required: false,
    enum: LessonStatus,
  })
  @IsOptional()
  @IsEnum(LessonStatus, { message: VALIDATION_MESSAGES.COMMON.ENUM('Status') })
  status?: LessonStatus;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.DESCRIPTION,
    example: 'Learn the basics of machine learning algorithms',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Description') })
  description?: string;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.IMAGE,
    example: '/images/lesson-thumbnail.jpg'
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Image') })
  @Matches(/\.(jpg|jpeg|png)$/i, { message: VALIDATION_MESSAGES.COMMON.IMAGE_FORMAT })
  image?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.COURSE.START_DATE,
    example: '2024-06-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('Start datetime') })
  startDatetime?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.COURSE.END_DATE,
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @ValidateIf(o => o.startDatetime != null)
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('End datetime') })
  endDatetime?: string;

  @ApiProperty({
    description: 'Storage type',
    example: 'local',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Storage') })
  storage?: string;

  @ApiProperty({
    description: 'Number of attempts allowed',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Number of attempts') })
  @Min(1, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Number of attempts') })
  @Type(() => Number)
  noOfAttempts?: number;

  @ApiProperty({
    description: 'Grade calculation method',
    example: 'HIGHEST',
    required: false,
    enum: ['FIRST_ATTEMPT', 'LAST_ATTEMPT', 'AVERAGE', 'HIGHEST'],
  })
  @IsOptional()
  @IsEnum(AttemptsGradeMethod, { message: VALIDATION_MESSAGES.COMMON.ENUM('Grade calculation method') })
  attemptsGrade?: AttemptsGradeMethod;

  @ApiProperty({
    description: 'Eligibility criteria',
    example: 'COMPLETE_PREVIOUS',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Eligibility criteria') })
  eligibilityCriteria?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.DURATION,
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Ideal time') })
  @Min(1, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Ideal time') })
  @Type(() => Number)
  idealTime?: number;

  @ApiProperty({
    description: 'Whether lesson can be resumed',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Resume') })
  @Type(() => Boolean)
  resume?: boolean;

  @ApiProperty({
    description: 'Total marks',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Total marks') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Total marks') })
  @Type(() => Number)
  totalMarks?: number;

  @ApiProperty({
    description: 'Passing marks',
    example: 60,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Passing marks') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Passing marks') })
  @Type(() => Number)
  passingMarks?: number;

  @ApiProperty({
    description: VALIDATION_MESSAGES.COURSE.PARAMS,
    example: '{"difficulty": "beginner", "keywords": ["ml", "ai"]}',
    required: false,
  })
  @IsOptional()
  params?: any;

  @ApiProperty({
    description: 'User who updated the lesson',
    example: 'user-123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Updated by') })
  updatedBy?: string;

  @ApiProperty({
    description: 'Order of the lesson in the course/module',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Ordering') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Ordering') })
  @Type(() => Number)
  ordering?: number;
}
