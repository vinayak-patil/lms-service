import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  IsNotEmpty,
  MaxLength,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';
import { LessonStatus, LessonSubFormat } from '../entities/lesson.entity';
import { LessonFormat, AttemptsGradeMethod } from '../entities/lesson.entity';
import { HelperUtil } from 'src/common/utils/helper.util';


export class CreateLessonDto {
  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.TITLE,
    example: 'Introduction to HTML Tags',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Title') })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Title') })
  @MaxLength(255, { message: VALIDATION_MESSAGES.COMMON.MAX_LENGTH('Title', 255) })
  title: string;

  @ApiProperty({
    description: 'Lesson alias/slug',
    example: 'intro-html-tags',
    required: true
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Alias') })
  alias?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.TYPE,
    enum: LessonFormat,
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Format') })
  @IsEnum(LessonFormat, { message: VALIDATION_MESSAGES.COMMON.ENUM('Format') })
  format: LessonFormat;

  @ApiProperty({
    description: 'Media content source',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    required: true
  })
  @ValidateIf((o) => o.format != LessonFormat.DOCUMENT)
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Source') })
  mediaContentSource: string;

  @ApiProperty({
    description: 'Media content path',
    example: '/course/uuid.pdf',
    required: true
  })
  @ValidateIf((o) => o.format === LessonFormat.DOCUMENT)
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Path') })
  mediaContentPath: string;

  @ApiProperty({
    description: 'Media content sub-format',
    example: 'youtube',
    required: true
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Media content sub-format') })
  @IsEnum(LessonSubFormat, { message: VALIDATION_MESSAGES.COMMON.ENUM('Media content sub-format') })  
  mediaContentSubFormat: LessonSubFormat;

  @ApiPropertyOptional({ 
    description: VALIDATION_MESSAGES.COURSE.IMAGE,
    example: '/images/course-thumbnail.jpg'
  })
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'User ID who checked out the lesson',
    format: 'uuid',
    required: false
  })
  @IsOptional()
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Checked out user ID') })
  checkedOut?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.STATUS,
    example: LessonStatus.PUBLISHED,
    required: false,
    enum: LessonStatus,
    default: LessonStatus.PUBLISHED
  })
  @IsOptional()
  @IsEnum(LessonStatus, { message: VALIDATION_MESSAGES.COMMON.ENUM('Status') })
  status?: LessonStatus = LessonStatus.PUBLISHED;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.DESCRIPTION,
    example: 'Learn the basics of HTML tags and their usage',
    required: true
  })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Description') })
  description?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.COURSE.START_DATE,
    example: '2024-06-01T00:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('Start datetime') })
  startDatetime?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.COURSE.END_DATE,
    example: '2024-12-31T23:59:59Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('End datetime') })
  @ValidateIf((o) => o.startDatetime)
  @Validate(HelperUtil.validateDatetimeConstraints, {
    message: 'Invalid datetime constraints. Start date must be in the future, end date must follow start date, and duration must be between 1 day and 1 year.'
  })
  endDatetime?: string;

  @ApiProperty({
    description: 'Storage type',
    example: 'local',
    required: false
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Storage') })
  storage?: string;

  @ApiProperty({
    description: 'Number of attempts allowed',
    example: 3,
    required: false,
    default: 1
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Number of attempts') })
  @Min(1, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Number of attempts') })
  @Type(() => Number)
  noOfAttempts?: number = 1;

  @ApiProperty({
    description: 'Grade calculation method',
    example: AttemptsGradeMethod.HIGHEST,
    required: false,
    enum: AttemptsGradeMethod,
    default: AttemptsGradeMethod.HIGHEST
  })
  @IsOptional()
  @IsEnum(AttemptsGradeMethod, { message: VALIDATION_MESSAGES.COMMON.ENUM('Grade calculation method') })
  attemptsGrade?: AttemptsGradeMethod = AttemptsGradeMethod.HIGHEST;

  @ApiProperty({
    description: 'Eligibility criteria',
    example: 'COMPLETE_PREVIOUS',
    required: false
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Eligibility criteria') })
  eligibilityCriteria?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.DURATION,
    example: 30,
    required: false
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Ideal time') })
  @Min(1, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Ideal time') })
  @Type(() => Number)
  idealTime?: number;

  @ApiProperty({
    description: 'Whether lesson can be resumed',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Resume') })
  @Type(() => Boolean)
  resume?: boolean;

  @ApiProperty({
    description: 'Total marks',
    example: 100,
    required: false
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Total marks') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Total marks') })
  @Type(() => Number)
  totalMarks?: number;

  @ApiProperty({
    description: 'Passing marks',
    example: 60,
    required: false
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Passing marks') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Passing marks') })
  @Type(() => Number)
  passingMarks?: number;

  @ApiProperty({
    description: VALIDATION_MESSAGES.COURSE.PARAMS,
    example: { difficulty: 'beginner', keywords: ['html', 'tags'] },
    required: false
  })
  @IsOptional()
  params?: Record<string, any>;

  /* Course Association Fields */
  
  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.COURSE_ID,
    format: 'uuid',
    required: false,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Course ID') })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Course ID') })
  courseId?: string;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.MODULE_ID,
    format: 'uuid',
    required: false,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Module ID') })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Module ID') })
  moduleId?: string;

  @ApiProperty({
    description: 'Whether this is a free lesson',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Free lesson') })
  @Type(() => Boolean)
  sampleLesson?: boolean = false;

  @ApiProperty({
    description: 'Whether to consider this lesson for passing',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Consider for passing') })
  @Type(() => Boolean)
  considerForPassing?: boolean = true;

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
