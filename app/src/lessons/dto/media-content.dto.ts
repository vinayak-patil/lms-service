import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/response-messages.constant';

export enum MediaFormat {
  VIDEO = 'video',
  EVENT = 'event',
  TEST = 'test',
  DOCUMENT = 'document',
}

export enum MediaSubFormat {
  VIDEO_YOUTUBE = 'video.youtube',
  EVENT = 'event',
  TEST_QUIZ = 'test.quiz',
  DOCUMENT_PDF = 'document.pdf',
}

export class MediaContentDto {
  @ApiProperty({
    description: VALIDATION_MESSAGES.MEDIA.TYPE,
    enum: MediaFormat,
    example: MediaFormat.VIDEO,
    required: true,
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Format') })
  @IsEnum(MediaFormat, { message: VALIDATION_MESSAGES.COMMON.ENUM('Format') })
  format: MediaFormat;

  @ApiProperty({
    description: 'Media sub-format',
    enum: MediaSubFormat,
    example: MediaSubFormat.VIDEO_YOUTUBE,
    required: false,
  })
  @IsOptional()
  @IsEnum(MediaSubFormat, { message: VALIDATION_MESSAGES.COMMON.ENUM('Sub-format') })
  subFormat?: MediaSubFormat;

  @ApiProperty({
    description: VALIDATION_MESSAGES.MEDIA.URL,
    example: 'https://youtube.com/watch?v=example',
    required: false,
  })
  @ValidateIf(o => o.format !== MediaFormat.DOCUMENT)
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Source') })
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Source') })
  source?: string;

  @ApiProperty({
    description: 'Storage type',
    example: 'local',
    required: false,
    default: 'local',
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.COMMON.STRING('Storage') })
  storage?: string = 'local';

  @ApiProperty({
    description: 'Media ID (required for document format)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @ValidateIf(o => o.format === MediaFormat.DOCUMENT)
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COMMON.REQUIRED('Media ID') })
  mediaId?: string;
} 