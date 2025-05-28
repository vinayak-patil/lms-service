import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, Equal, ILike, FindManyOptions, FindOptionsOrder } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Media } from './entities/media.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { AssociatedFile } from './entities/associated-file.entity';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly cache_ttl_default: number;
  private readonly cache_prefix_media: string;
  private readonly cache_prefix_lessons: string;
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
    this.cache_prefix_lessons = this.configService.get('CACHE_LESSONS_PREFIX') || 'lessons';
  }

  /**
   * Upload media
   */
  async uploadMedia(
    createMediaDto: any,
    file: any,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<Media> {
    try {
      this.logger.log(`Uploading media: ${JSON.stringify(createMediaDto)}`);

      // Create media record
      const media = this.mediaRepository.create({
        ...createMediaDto,
        path: createMediaDto.path,
        source: createMediaDto.path,
        storage: createMediaDto.storage || 'local',
        tenantId,
        organisationId,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedMedia = await this.mediaRepository.save(media);
      const result = Array.isArray(savedMedia) ? savedMedia[0] : savedMedia;

      // Invalidate relevant caches
      if (this.cache_enabled) {
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:all:${tenantId}:${organisationId}`);
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
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<[Media[], number]> {
    const cacheKey = `${this.cache_prefix_media}:list:${tenantId}:${organisationId}`;

    if (this.cache_enabled) {
      const cachedResult = await this.cacheService.get<[Media[], number]>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const { page, limit, skip } = paginationDto;
    const { search, type } = filters;

    const queryOptions: FindManyOptions<Media> = {
      where: { 
        tenantId,
        organisationId
      } as FindOptionsWhere<Media>,
      order: { createdAt: 'DESC' } as FindOptionsOrder<Media>,
      skip,
      take: limit,
    };

    // Add search condition if provided
    if (search) {
      queryOptions.where = [
        { 
          title: ILike(`%${search}%`),
          tenantId,
          organisationId
        } as FindOptionsWhere<Media>,
        { 
          description: ILike(`%${search}%`),
          tenantId, 
          organisationId
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
          tenantId,
          organisationId
        }));
      } else {
        // Otherwise, add it to the existing condition
        queryOptions.where = {
          ...queryOptions.where,
          format: type,
          tenantId,
          organisationId
        };
      }
    }

    const result = await this.mediaRepository.findAndCount(queryOptions);

    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, result, this.cache_ttl_default);
    }

    return result;
  }

  /**
   * Find one media by ID
   */
  async findOne(
    mediaId: string,
    userId?: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<Media> {
    const cacheKey = `${this.cache_prefix_media}:${mediaId}:${tenantId}:${organisationId}`;
    
    if (this.cache_enabled) {
      const cachedMedia = await this.cacheService.get<Media>(cacheKey);
      if (cachedMedia) {
        return cachedMedia;
      }
    }

    const media = await this.mediaRepository.findOne({
      where: { mediaId: mediaId, tenantId: tenantId, organisationId: organisationId } as FindOptionsWhere<Media>,
    });

    if (!media) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.MEDIA_NOT_FOUND);
    }

    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, media, this.cache_ttl_default);
    }

    return media;
  }

  /**
   * Associate media with lesson
   */
  async associateWithLesson(mediaId: string, lessonId: string, userId: string, tenantId: string, organisationId: string): Promise<Lesson> {
    try {
      // Find the media
      const media = await this.mediaRepository.findOne({
        where: { mediaId: mediaId, tenantId: tenantId, organisationId: organisationId } as FindOptionsWhere<Media>,
      });

      if (!media) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.MEDIA_NOT_FOUND);
      }

      // Find the lesson
      const lesson = await this.lessonRepository.findOne({
        where: { lessonId: lessonId, tenantId: tenantId, organisationId: organisationId } as FindOptionsWhere<Lesson>,
      });

      if (!lesson) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
      }

      // Check if association already exists
      const existingAssociation = await this.associatedFileRepository.findOne({
        where: { 
          lessonId,
          mediaId,
          tenantId,
          organisationId
        }
      });

      if (existingAssociation) {
        throw new BadRequestException('Media is already associated with this lesson');
      }

      const associatedFile = this.associatedFileRepository.create({
        lessonId,
        mediaId,
        createdBy: userId,
        updatedBy: userId,
        tenantId,
        organisationId
      });
  
      // Save the association
      await this.associatedFileRepository.save(associatedFile);
  
      // Update lesson's updatedAt timestamp
      await this.lessonRepository.update(lessonId, {
        updatedBy: userId,
        updatedAt: new Date()
      });

      // Invalidate relevant caches
      if (this.cache_enabled) {
        await this.cacheService.delByPattern(`${this.cache_prefix_media}:${mediaId}:*`);
        await this.cacheService.delByPattern(`${this.cache_prefix_lessons}:${lessonId}:*`);
        await this.cacheService.delByPattern(`${this.cache_prefix_lessons}:display:${lessonId}:*`);
      }

      return lesson;
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
  async remove(
    mediaId: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find the media to remove
      const media = await this.mediaRepository.findOne({
        where: { mediaId: mediaId, tenantId: tenantId, organisationId: organisationId } as FindOptionsWhere<Media>,
      });

      if (!media) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.MEDIA_NOT_FOUND);
      }

      // Check if media is associated with any lessons
      const lessons = await this.lessonRepository.find({
        where: { mediaId: mediaId, tenantId: tenantId, organisationId: organisationId } as FindOptionsWhere<Lesson>,
      });

      if (lessons.length > 0) {
        throw new BadRequestException(RESPONSE_MESSAGES.ERROR.MEDIA_ASSOCIATED_WITH_LESSON);
      }

      // Check if media is associated with any lessons
      const AssociatedFilelessons = await this.associatedFileRepository.find({
        where: { mediaId: mediaId, tenantId: tenantId, organisationId: organisationId } as FindOptionsWhere<AssociatedFile>,
      });

      if (AssociatedFilelessons.length > 0) {
        throw new BadRequestException(RESPONSE_MESSAGES.ERROR.MEDIA_ASSOCIATED_WITH_ASSOCIATED_FILE);
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

      if (this.cache_enabled) {
        const entityCacheKey = `${this.cache_prefix_media}:${mediaId}:${tenantId}:${organisationId}`;
        const listCacheKey = `${this.cache_prefix_media}:list:${tenantId}:${organisationId}`;

        await Promise.all([
          this.cacheService.del(entityCacheKey),
          this.cacheService.del(listCacheKey)
        ]);
      }

      return { 
        success: true, 
        message: RESPONSE_MESSAGES.MEDIA_DELETED || 'Media deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error removing media: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Remove media association from lesson
   */
  async removeAssociation(mediaId: string, lessonId: string, userId: string, tenantId: string, organisationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find the lesson
      const lesson = await this.lessonRepository.findOne({
        where: { lessonId: lessonId, tenantId: tenantId, organisationId: organisationId } as FindOptionsWhere<Lesson>,
      });

      if (!lesson) {
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
      }

      // Find and delete the associated file record
      const associatedFile = await this.associatedFileRepository.findOne({
        where: { 
          lessonId,
          mediaId,
          tenantId,
          organisationId
        }
      });

      if (!associatedFile) {
        throw new BadRequestException(RESPONSE_MESSAGES.ERROR.MEDIA_NOT_ASSOCIATED_WITH_LESSON);
      }

      // Delete the associated file record
      await this.associatedFileRepository.delete({
        lessonId,
        mediaId,
        tenantId,
        organisationId
      });

      // Update lesson's updatedAt timestamp
      await this.lessonRepository.update(lessonId, {
        updatedBy: userId,
        updatedAt: new Date()
      });

      // Invalidate relevant caches
      if (this.cache_enabled) {
        await this.cacheService.del(`${this.cache_prefix_media}:${mediaId}:*`);
        await this.cacheService.del(`${this.cache_prefix_lessons}:${lessonId}:*`);
        await this.cacheService.del(`${this.cache_prefix_lessons}:display:${lessonId}:*`);
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