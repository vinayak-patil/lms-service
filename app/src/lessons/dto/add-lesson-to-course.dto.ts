import { ApiProperty } from '@nestjs/swagger';
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttemptsGradeMethod } from '../entities/lesson.entity';
import { CourseLessonStatus } from '../entities/course-lesson.entity';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';

export class AddLessonToCourseDto {
  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.ORDER,
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.COMMON.NUMBER('Sequence') })
  @Min(0, { message: VALIDATION_MESSAGES.COMMON.POSITIVE('Sequence') })
  @Type(() => Number)
  sequence?: number;

  @ApiProperty({
    description: 'Lesson ID',
    format: 'uuid',
  })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Lesson ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Lesson ID') })
  lessonId: string;

  @ApiProperty({
    description: 'Whether the lesson is free',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Free lesson') })
  @Type(() => Boolean)
  freeLesson?: boolean = false;

  @ApiProperty({
    description: 'Whether to consider this lesson for course passing',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.COMMON.BOOLEAN('Consider for passing') })
  @Type(() => Boolean)
  considerForPassing?: boolean = true;

  @ApiProperty({
    description: VALIDATION_MESSAGES.LESSON.STATUS,
    example: CourseLessonStatus.PUBLISHED,
    required: false,
    enum: CourseLessonStatus,
    default: CourseLessonStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(CourseLessonStatus, { message: VALIDATION_MESSAGES.COMMON.ENUM('Status') })
  status?: CourseLessonStatus = CourseLessonStatus.PUBLISHED;

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
  @ValidateIf(o => o.startDatetime != null)
  @IsDateString({}, { message: VALIDATION_MESSAGES.COMMON.DATE('End datetime') })
  endDatetime?: string;

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
  @IsEnum(AttemptsGradeMethod, { message: VALIDATION_MESSAGES.COMMON.ENUM('Attempts grade') })
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
}
