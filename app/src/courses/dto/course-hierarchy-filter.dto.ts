import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';

export enum HierarchyFilterType {
  MODULE = 'module',
  LESSON = 'lesson',
}

export class CourseHierarchyFilterDto {
  @ApiProperty({
    description: 'Filter type for course hierarchy response',
    enum: HierarchyFilterType,
    required: false,
    example: 'module'
  })
  @IsOptional()
  @IsEnum(HierarchyFilterType, { 
    message: 'Type must be either "module" or "lesson"' 
  })
  type?: HierarchyFilterType;

  @ApiProperty({
    description: 'Module ID required when type is "lesson"',
    format: 'uuid',
    required: false,
    example: 'fd127860-5efa-4b4b-b8ae-d855fc71158f'
  })
  @IsOptional()
  @IsUUID('4', { message: 'Module ID must be a valid UUID' })
  moduleId?: string;
} 