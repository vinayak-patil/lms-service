import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CourseStatus } from '../entities/course.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Course } from '../entities/course.entity';

export class SearchCourseDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search keyword to match in title, description, or short description' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by cohort ID' })
  @IsOptional()
  @IsString()
  cohortId?: string;

  @ApiPropertyOptional({ enum: CourseStatus, description: 'Filter by course status' })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ description: 'Filter by featured status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter by free/paid status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  free?: boolean;

  @ApiPropertyOptional({ description: 'Filter by start date (from)', type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  startDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter by start date (to)', type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  startDateTo?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date (from)', type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  endDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date (to)', type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  endDateTo?: Date;

  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

export class SearchCourseResponseDto {
  @ApiProperty({ description: 'List of courses matching the search criteria', type: [Course] })
  courses: Course[];

  @ApiProperty({ description: 'Total number of courses matching the criteria', example: 1 })
  @IsNumber()
  totalElements: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  @IsNumber()
  totalPages: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  @IsNumber()
  currentPage: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  @IsNumber()
  size: number;
} 