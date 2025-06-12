import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMimeType, IsOptional, IsString } from 'class-validator';

export class GetPresignedUrlDto {
  @ApiProperty({
    description: 'Type of upload (course, module, lesson, lessonMedia, lessonAssociatedMedia)',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'MIME type of the file to upload',
    example: 'image/jpeg',
  })
  @IsMimeType()
  mimeType: string;

  @ApiProperty({
    description: 'Optional custom file name',
    required: false,
  })
  @IsOptional()
  @IsString()
  fileName?: string;
} 