import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, Equal, ILike } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Media } from './entities/media.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { AssociatedFile } from './entities/associated-file.entity';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly cache_ttl_default: number;
  private readonly cache_prefix_media: string;
  private readonly cache_enabled: boolean;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(AssociatedFile)
    private readonly associatedFileRepository: Repository<AssociatedFile>,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.cache_enabled = this.configService.get('CACHE_ENABLED') || true;
    this.cache_ttl_default = this.configService.get('CACHE_DEFAULT_TTL') || 3600;
    this.cache_prefix_media = this.configService.get('CACHE_MEDIA_PREFIX') || 'media';
  }

  /**
   * Upload media
   */
  async uploadMedia(
    createMediaDto: any,
    file: any,
    userId: string,
    tenantId: string,
  ): Promise<Media> {
    try {
      this.logger.log(`Uploading media: ${JSON.stringify(createMediaDto)}`);

      // Create media record
      const media = this.mediaRepository.create({
        ...createMediaDto,
        path: createMediaDto.path,
        source: createMediaDto.path,
        storage: 'local',
        tenantId,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedMedia = await this.mediaRepository.save(media);
      const result = Array.isArray(savedMedia) ? savedMedia[0] : savedMedia;

      // Invalidate relevant caches
      if (this.cache_enabled) {
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:all:${tenantId}:*`);
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:${result.mediaId}:*`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error uploading media: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all media with pagination and filters
   */
  async findAll(
    paginationDto: PaginationDto,
    filters: any,
    tenantId: string,
  ): Promise<[Media[], number]> {
    try {
      const { page, limit, skip } = paginationDto;
      const { search, type } = filters;

      const cacheKey = `${this.cache_prefix_media}:all:${tenantId}:${page}:${limit}:${search || 'none'}:${type || 'none'}`;

      if (this.cache_enabled) {
        // Try to get from cache first
        const cachedResult = await this.cacheService.get<[Media[], number]>(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      const queryOptions: any = {
        where: { 
          tenantId
        } as FindOptionsWhere<Media>,
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      };

      // Add search condition if provided
      if (search) {
        queryOptions.where = [
          { 
            title: ILike(`%${search}%`),
            tenantId,
          } as FindOptionsWhere<Media>,
          { 
            description: ILike(`%${search}%`),
            tenantId, 
          } as FindOptionsWhere<Media>,
        ];
      }

      // Add type filter if provided
      if (type) {
        if (Array.isArray(queryOptions.where)) {
          // If it's already an array of conditions, add type to each
          queryOptions.where = queryOptions.where.map(cond => ({
            ...cond,
            format: type,
          }));
        } else {
          // Otherwise, add it to the existing condition
          queryOptions.where.format = type;
        }
      }

      const result = await this.mediaRepository.findAndCount(queryOptions);

      // Cache the result if caching is enabled
      if (this.cache_enabled) {
        await this.cacheService.set(cacheKey, result, this.cache_ttl_default);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error finding media: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find one media by ID
   */
  async findOne(
    mediaId: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<Media> {
    const cacheKey = `${this.cache_prefix_media}:${mediaId}:${tenantId || 'global'}:${organisationId || 'global'}`;
    
    if (this.cache_enabled) {
      // Try to get from cache first
      const cachedMedia = await this.cacheService.get<Media>(cacheKey);
      if (cachedMedia) {
        return cachedMedia;
      }
    }

    const media = await this.mediaRepository.findOne({
      where: { mediaId: mediaId } as FindOptionsWhere<Media>,
    });

    if (!media) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.MEDIA_NOT_FOUND);
    }

    // Cache the media if caching is enabled
    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, media, this.cache_ttl_default);
    }

    return media;
  }

  /**
   * Associate media with lesson
   */
  async associateWithLesson(mediaId: string, lessonId: string): Promise<Lesson> {
    try {
      // Find the media
      const media = await this.mediaRepository.findOne({
        where: { mediaId: mediaId } as FindOptionsWhere<Media>,
      });

      if (!media) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.MEDIA_NOT_FOUND);
      }

      // Find the lesson
      const lesson = await this.lessonRepository.findOne({
        where: { lessonId: lessonId } as FindOptionsWhere<Lesson>,
      });

      if (!lesson) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
      }

      // Update the lesson with the media
      lesson.mediaId = mediaId;
      lesson.updatedAt = new Date();
      
      const result = await this.lessonRepository.save(lesson);

      // Invalidate relevant caches
      if (this.cache_enabled) {
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:${mediaId}:*`);
        await this.cacheService.delByPattern(`lessons:${lessonId}:*`);
        await this.cacheService.delByPattern(`lessons:display:${lessonId}:*`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error associating media with lesson: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Remove a media (delete it)
   */
  async remove(mediaId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find the media to remove
      const media = await this.mediaRepository.findOne({
        where: { mediaId: mediaId } as FindOptionsWhere<Media>,
      });

      if (!media) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.MEDIA_NOT_FOUND);
      }

      // Check if media is associated with any lessons
      const lessons = await this.lessonRepository.find({
        where: { mediaId: mediaId } as FindOptionsWhere<Lesson>,
      });

      if (lessons.length > 0) {
        // Remove the association from all lessons
        for (const lesson of lessons) {
          lesson.mediaId = '';
          lesson.updatedAt = new Date();
          await this.lessonRepository.save(lesson);
        }
      }

      // Remove associated files records
      await this.associatedFileRepository.delete({ mediaId: mediaId } as any);

      // Delete the media file if it exists locally
      if (media.path && media.storage === 'local') {
        try {
          const fullPath = path.join(process.cwd(), media.path);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (fileError) {
          this.logger.error(`Error deleting media file: ${fileError.message}`);
          // Continue with deletion even if file removal fails
        }
      }

      // Delete the media record
      await this.mediaRepository.delete({ mediaId: mediaId } as FindOptionsWhere<Media>);

      // Invalidate relevant caches
      if (this.cache_enabled) {
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:${mediaId}:*`);
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:all:*`);
      for (const lesson of lessons) {
        await this.cacheService.delByPattern(`lessons:${lesson.lessonId}:*`);
          await this.cacheService.delByPattern(`lessons:display:${lesson.lessonId}:*`);
        }
      }

      // Invalidate relevant caches if caching is enabled
      if (this.cache_enabled) {
        await this.cacheService.del(`${this.cache_prefix_media}:${mediaId}`);
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:type:${media.format}:*`);
      }

      return { success: true, message: RESPONSE_MESSAGES.MEDIA_DELETED || 'Media deleted successfully' };
    } catch (error) {
      this.logger.error(`Error removing media: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Remove media association from lesson
   */
  async removeAssociation(mediaId: string, lessonId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find the lesson
      const lesson = await this.lessonRepository.findOne({
        where: { lessonId: lessonId } as FindOptionsWhere<Lesson>,
      });

      if (!lesson) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
      }

      // Check if the lesson is associated with the specified media
      if (lesson.mediaId !== mediaId) {
        throw new BadRequestException('The specified lesson is not associated with this media');
      }

      // Remove the association
      lesson.mediaId = '';
      lesson.updatedAt = new Date();
      await this.lessonRepository.save(lesson);

      // Invalidate relevant caches
      if (this.cache_enabled) {
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:${mediaId}:*`);
        await this.cacheService.delByPattern(`lessons:${lessonId}:*`);
        await this.cacheService.delByPattern(`lessons:display:${lessonId}:*`);
      }

      return { 
        success: true, 
        message: 'Media association removed successfully' 
      };
    } catch (error) {
      this.logger.error(`Error removing media association: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}