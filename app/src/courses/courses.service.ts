import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, Equal, ILike, IsNull, In } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { Module, ModuleStatus } from '../modules/entities/module.entity';
import { Lesson, LessonStatus } from '../lessons/entities/lesson.entity';
import { CourseTrack, TrackingStatus } from '../tracking/entities/course-track.entity';
import { LessonTrack } from '../tracking/entities/lesson-track.entity';
import { ModuleTrack } from '../tracking/entities/module-track.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { HelperUtil } from '../common/utils/helper.util';
import { CreateCourseDto } from './dto/create-course.dto';
import { SearchCourseDto } from './dto/search-course.dto';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private readonly cache_ttl_default: number;
  private readonly cache_ttl_user: number;
  private readonly cache_prefix_course: string;
  private readonly cache_prefix_module: string;
  private readonly cache_prefix_lesson: string;
  private readonly cache_enabled: boolean;

  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(CourseTrack)
    private readonly courseTrackRepository: Repository<CourseTrack>,
    @InjectRepository(LessonTrack)
    private readonly lessonTrackRepository: Repository<LessonTrack>,
    @InjectRepository(ModuleTrack)
    private readonly moduleTrackRepository: Repository<ModuleTrack>,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.cache_enabled = this.configService.get('CACHE_ENABLED') === true;
    this.cache_ttl_default = parseInt(this.configService.get('CACHE_DEFAULT_TTL') || '3600', 10);
    this.cache_ttl_user = parseInt(this.configService.get('CACHE_USER_TTL') || '600', 10);
    this.cache_prefix_course = this.configService.get('CACHE_COURSE_PREFIX') || 'course';
    this.cache_prefix_module = this.configService.get('CACHE_MODULE_PREFIX') || 'module';
    this.cache_prefix_lesson = this.configService.get('CACHE_LESSON_PREFIX') || 'lesson';
  }

  /**
   * Create a new course
   */
  async create(
    createCourseDto: CreateCourseDto,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<Course> {
    this.logger.log(`Creating course: ${JSON.stringify(createCourseDto)}`);

    // Generate a simple alias from the title if none provided
    if (!createCourseDto.alias) {
      createCourseDto.alias = await HelperUtil.generateUniqueAliasWithRepo(
        createCourseDto.title,
        this.courseRepository,
        tenantId,
        organisationId
      );
    } else {
      // Check if the alias already exists
      const existingCourse = await this.courseRepository.findOne({
        where: { 
          alias: createCourseDto.alias, 
          tenantId,
          organisationId,
          status: Not(CourseStatus.ARCHIVED)
        } as FindOptionsWhere<Course>,
      });

      if (existingCourse) {
        const originalAlias = createCourseDto.alias;
        createCourseDto.alias = await HelperUtil.generateUniqueAliasWithRepo(
          originalAlias,
          this.courseRepository,
          tenantId,
          organisationId
        );
        this.logger.log(`Alias '${originalAlias}' already exists. Generated new alias: ${createCourseDto.alias}`);
      }
    }
    
    // Create courseData with only fields that exist in the entity
    const courseData = {
      title: createCourseDto.title,
      alias: createCourseDto.alias,
      description: createCourseDto.description,
      shortDescription: createCourseDto.shortDescription,
      image: createCourseDto.image,
      startDatetime: createCourseDto.startDatetime,
      endDatetime: createCourseDto.endDatetime,
      status: createCourseDto.status,
      params: createCourseDto.params || {},
      featured: createCourseDto.featured !== undefined ? createCourseDto.featured : false,
      free: createCourseDto.free !== undefined ? createCourseDto.free : false,
      adminApproval: createCourseDto.adminApproval !== undefined ? createCourseDto.adminApproval : false,
      autoEnroll: createCourseDto.autoEnroll !== undefined ? createCourseDto.autoEnroll : false,
      certificateTerm: createCourseDto.certificateTerm ? { term: createCourseDto.certificateTerm } : undefined,
      certificateId: createCourseDto.certificateId,
      tenantId,
      organisationId,
      createdBy: userId,
      updatedBy: userId,
    };
    
    const course = this.courseRepository.create(courseData);
    const savedCourse = await this.courseRepository.save(course);
    const result = Array.isArray(savedCourse) ? savedCourse[0] : savedCourse;
    
    if (this.cache_enabled) {
      // Invalidate and set new cache values
      const entityCacheKey = this.cacheService.generateKey(this.cache_prefix_course, result.courseId, tenantId, organisationId);
      const searchCacheKey = this.cacheService.generateKey(this.cache_prefix_course, 'search', tenantId, organisationId);
      const hierarchyCacheKey = this.cacheService.generateKey(this.cache_prefix_course, 'hierarchy', result.courseId, tenantId, organisationId);

      // Invalidate existing caches
      await Promise.all([
        this.cacheService.del(searchCacheKey),
        this.cacheService.del(hierarchyCacheKey),
        this.cacheService.set(entityCacheKey, result, this.cache_ttl_default),
      ]);
    }
    
    return result;
  }

  /**
   * Search courses with filters and keyword search
   */
  async search(
    filters: Omit<SearchCourseDto, keyof PaginationDto>,
    paginationDto: PaginationDto,
    tenantId: string,
    organisationId: string,
  ): Promise<{ items: Course[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const cacheKey = this.cacheService.generateKey(this.cache_prefix_course, 'search', tenantId, organisationId);

    if (this.cache_enabled) {
      // Try to get from cache first
      const cachedResult = await this.cacheService.get<{ items: Course[]; total: number }>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const skip = (page - 1) * limit;

    const whereClause: any = { 
      tenantId,
      organisationId,
      status: filters?.status || Not(CourseStatus.ARCHIVED),
    };

    // Add boolean filters if provided
    if (filters?.featured !== undefined) {
      whereClause.featured = filters.featured;
    }
    if (filters?.free !== undefined) {
      whereClause.free = filters.free;
    }
    if (filters?.createdBy) {
      whereClause.createdBy = filters.createdBy;
    }

    // Add date range filters for start date
    if (filters?.startDateFrom || filters?.startDateTo) {
      whereClause.startDatetime = {};
      if (filters.startDateFrom) {
        whereClause.startDatetime.gte = filters.startDateFrom;
      }
      if (filters.startDateTo) {
        whereClause.startDatetime.lte = filters.startDateTo;
      }
    }

    // Add date range filters for end date
    if (filters?.endDateFrom || filters?.endDateTo) {
      whereClause.endDatetime = {};
      if (filters.endDateFrom) {
        whereClause.endDatetime.gte = filters.endDateFrom;
      }
      if (filters.endDateTo) {
        whereClause.endDatetime.lte = filters.endDateTo;
      }
    }

    // Add keyword search if provided
    if (filters?.keyword) {
      whereClause.title = ILike(`%${filters.keyword}%`);
    }

    const [items, total] = await this.courseRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    const result = { items, total };

    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, result, this.cache_ttl_default);
    }

    return result;
  }

  /**
   * Find a course by ID
   */
  async findOne(
    courseId: string, 
    tenantId: string, 
    organisationId: string
  ): Promise<Course> {
    const cacheKey = this.cacheService.generateKey(
      this.cache_prefix_course,
      courseId,
      tenantId || '',
      organisationId || ''
    );

    if (this.cache_enabled) {
      const cachedCourse = await this.cacheService.get<Course>(cacheKey);
      if (cachedCourse) {
        return cachedCourse;
      }
    }

    const course = await this.courseRepository.findOne({
      where: {
        courseId,
        tenantId,
        organisationId,
        status: Not(CourseStatus.ARCHIVED),
      } as FindOptionsWhere<Course>,
    });

    if (!course) {
      throw new NotFoundException(RESPONSE_MESSAGES.COURSE_NOT_FOUND);
    }

    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, course, this.cache_ttl_default);
    }

    return course;
  }

  /**
   * Find course hierarchy
   */
  async findCourseHierarchy(
    courseId: string,
    tenantId: string,
    organisationId: string
  ): Promise<any> {
    const cacheKey = this.cacheService.generateKey(
      this.cache_prefix_course,
      'hierarchy',
      courseId,
      tenantId || '',
      organisationId || ''
    );

    if (this.cache_enabled) {
      const cachedHierarchy = await this.cacheService.get<any>(cacheKey);
      if (cachedHierarchy) {
        return cachedHierarchy;
      }
    }

    const course = await this.findOne(courseId, tenantId, organisationId);

    const modules = await this.moduleRepository.find({
      where: {
        courseId,
        tenantId,
        organisationId,
        status: Not(ModuleStatus.ARCHIVED),
      },
      order: {
        ordering: 'ASC',
      },
    });

    const hierarchy = {
      ...course,
      modules: await Promise.all(
        modules.map(async (module) => {
          const lessons = await this.lessonRepository.find({
            where: {
              moduleId: module.moduleId,
              tenantId,
              organisationId,
              status: Not(LessonStatus.ARCHIVED),
            },
            order: {
              ordering: 'ASC',
            },
          });

          return {
            ...module,
            lessons,
          };
        })
      ),
    };

    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, hierarchy, this.cache_ttl_default);
    }

    return hierarchy;
  }

  /**
   * Find course hierarchy with tracking information
   */
  async findCourseHierarchyWithTracking(
    courseId: string, 
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<any> {
    const cacheKey = this.cacheService.generateKey(
      this.cache_prefix_course,
      'hierarchy',
      courseId,
      userId,
      tenantId || '',
      organisationId || ''
    );

    if (this.cache_enabled) {
      const cachedHierarchy = await this.cacheService.get<any>(cacheKey);
      if (cachedHierarchy) {
        return cachedHierarchy;
      }
    }

    const hierarchy = await this.findCourseHierarchy(courseId, tenantId, organisationId);

    // Get course tracking
    const courseTrack = await this.courseTrackRepository.findOne({
      where: {
        courseId,
        userId,
        tenantId,
        organisationId,
      },
    });

    // Get module tracking
    const moduleTracks = await this.moduleTrackRepository.find({
      where: {
        moduleId: In(hierarchy.modules.map(m => m.moduleId)),
        userId,
        tenantId,
        organisationId,
      },
    });

    // Get lesson tracking
    const lessonTracks = await this.lessonTrackRepository.find({
      where: {
        courseId,
        userId,
        tenantId,
        organisationId,
      },
    });

    // Enhance hierarchy with tracking information
    const enhancedHierarchy = {
      ...hierarchy,
      tracking: courseTrack || { status: TrackingStatus.INCOMPLETE },
      modules: hierarchy.modules.map((module) => {
        const moduleTrack = moduleTracks.find((mt) => mt.moduleId === module.moduleId);
        return {
          ...module,
          tracking: moduleTrack || { status: TrackingStatus.INCOMPLETE },
          lessons: module.lessons.map((lesson) => {
            const lessonTrack = lessonTracks.find((lt) => lt.lessonId === lesson.lessonId);
            return {
              ...lesson,
              tracking: lessonTrack || { status: TrackingStatus.INCOMPLETE },
            };
          }),
        };
      }),
    };

    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, enhancedHierarchy, this.cache_ttl_user);
    }

    return enhancedHierarchy;
  }

  /**
   * Helper method to find the most recent access time from a collection of tracked items
   */
  private findMostRecentAccess(items: any[]): Date | null {
    const dates = items
      .map(item => item.tracking?.lastAccessed)
      .filter(date => date !== null && date !== undefined);
    
    if (dates.length === 0) return null;
    
    return new Date(Math.max(...dates.map(date => date instanceof Date ? date.getTime() : new Date(date).getTime())));
  }

  /**
   * Update a course
   */
  async update(
    courseId: string,
    updateCourseDto: any,
    userId: string,
    tenantId: string,
    organisationId: string,
    image?: Express.Multer.File,
  ): Promise<Course> {
    const course = await this.findOne(courseId, tenantId, organisationId);

    // Update course fields
    Object.assign(course, {
      ...updateCourseDto,
      updatedBy: userId,
    });

    if (image) {
      course.image = image.path;
    }

    const updatedCourse = await this.courseRepository.save(course);

    if (this.cache_enabled) {
      // Invalidate and update cache
      const entityCacheKey = this.cacheService.generateKey(
        this.cache_prefix_course,
        courseId,
        tenantId,
        organisationId || ''
      );
      const searchCacheKey = this.cacheService.generateKey(
        this.cache_prefix_course,
        'search',
        tenantId,
        organisationId || ''
      );
      const hierarchyCacheKey = this.cacheService.generateKey(
        this.cache_prefix_course,
        'hierarchy',
        courseId,
        tenantId,
        organisationId || ''
      );

      await Promise.all([
        this.cacheService.del(searchCacheKey),
        this.cacheService.del(hierarchyCacheKey),
        this.cacheService.set(entityCacheKey, updatedCourse, this.cache_ttl_default),
      ]);
    }

    return updatedCourse;
  }

  /**
   * Remove a course
   */
  async remove(
    courseId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<{ success: boolean; message: string }> {
    const course = await this.findOne(courseId, tenantId, organisationId);

    // Soft delete by updating status to ARCHIVED
    course.status = CourseStatus.ARCHIVED;
    course.updatedBy = userId;
    await this.courseRepository.save(course);

    if (this.cache_enabled) {
      // Invalidate all related caches
      const entityCacheKey = this.cacheService.generateKey(
        this.cache_prefix_course,
        courseId,
        tenantId || '',
        organisationId || ''
      );
      const searchCacheKey = this.cacheService.generateKey(
        this.cache_prefix_course,
        'search',
        tenantId || '',
        organisationId || ''
      );
      const hierarchyCacheKey = this.cacheService.generateKey(
        this.cache_prefix_course,
        'hierarchy',
        courseId,
        tenantId || '',
        organisationId || ''
      );

      await Promise.all([
        this.cacheService.del(entityCacheKey),
        this.cacheService.del(searchCacheKey),
        this.cacheService.del(hierarchyCacheKey),
      ]);
    }

    return {
      success: true,
      message: RESPONSE_MESSAGES.COURSE_DELETED,
    };
  }

}