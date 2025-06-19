import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsArray, ArrayMinSize, ValidateIf, Validate } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';

export enum ModuleType {
  MODULE = 'module',
  LESSON = 'lesson',
}

// Custom validator function to check for unique IDs
function validateUniqueIds(ids: string[]): boolean {
  if (!Array.isArray(ids)) return false;
  const uniqueIds = new Set(ids);
  return uniqueIds.size === ids.length;
}

export class SaveOrderDto {
  @ApiProperty({
    description: 'Type of items to save order for (modules or lessons)',
    enum: ModuleType,
    example: ModuleType.MODULE,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Module type') })
  @IsEnum(ModuleType, { message: VALIDATION_MESSAGES.COMMON.ENUM('Module type') })
  moduleType: ModuleType;

  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Course ID') })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Course ID') })
  courseId: string;

  @ApiPropertyOptional({
    description: 'Module ID (required only if moduleType is lesson)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((o) => o.moduleType === ModuleType.LESSON)
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Module ID') })
  @IsUUID('4', { message: VALIDATION_MESSAGES.COMMON.UUID('Module ID') })
  moduleId?: string;

  @ApiProperty({
    description: 'Array of UUIDs in the desired order (either module or lesson IDs)',
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-b456-426614174000'],
    type: [String],
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('IDs array') })
  @IsArray({ message: VALIDATION_MESSAGES.COMMON.ARRAY('IDs') })
  @ArrayMinSize(1, { message: VALIDATION_MESSAGES.COMMON.MIN_ARRAY_LENGTH('IDs', 1) })
  @IsUUID('4', { each: true, message: VALIDATION_MESSAGES.COMMON.UUID('ID') })
  @Validate(validateUniqueIds, { message: 'IDs array must contain unique values' })
  ids: string[];
}