import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, FindManyOptions, IsNull } from 'typeorm';
import { CourseTrack, TrackingStatus } from './entities/course-track.entity';
import { LessonTrack } from './entities/lesson-track.entity';
import { Course, CourseStatus } from '../courses/entities/course.entity';
import { Lesson, LessonStatus } from '../lessons/entities/lesson.entity';
import { Module, ModuleStatus } from '../modules/entities/module.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { UpdateCourseTrackingDto } from './dto/update-course-tracking.dto';
import { StartLessonTrackingDto } from './dto/start-lesson-tracking.dto';
import { UpdateLessonTrackingDto } from './dto/update-lesson-tracking.dto';
import { LessonStatusDto } from './dto/lesson-status.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly cache_enabled: boolean;
  private readonly cache_ttl_default: number;
  private readonly cache_ttl_user: number;
  private readonly cache_prefix_tracking: string;
  private readonly cache_prefix_course: string;
  private readonly cache_prefix_lesson: string;
  private readonly cache_prefix_module: string;

  constructor(
    @InjectRepository(CourseTrack)
    private readonly courseTrackRepository: Repository<CourseTrack>,
    @InjectRepository(LessonTrack)
    private readonly lessonTrackRepository: Repository<LessonTrack>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.cache_enabled = this.configService.get('CACHE_ENABLED') === 'true';
    this.cache_ttl_default = parseInt(this.configService.get('CACHE_TTL_DEFAULT') || '3600', 10);
    this.cache_ttl_user = parseInt(this.configService.get('CACHE_TTL_USER') || '1800', 10);
    this.cache_prefix_tracking = this.configService.get('CACHE_TRACKING_PREFIX') || 'tracking';
    this.cache_prefix_course = this.configService.get('CACHE_COURSE_PREFIX') || 'course';
    this.cache_prefix_lesson = this.configService.get('CACHE_LESSON_PREFIX') || 'lesson';
    this.cache_prefix_module = this.configService.get('CACHE_MODULE_PREFIX') || 'module';
  }

  /**
   * Start course tracking
   */
  async startCourseTracking(
    courseId: string, 
    userId: string, 
    tenantId: string, 
    organisationId: string): Promise<CourseTrack> {

    // Check if course exists
    const course = await this.courseRepository.findOne({
      where: { 
        courseId,
        tenantId,
        organisationId,
        status: Not(CourseStatus.ARCHIVED as any)
       } as FindOptionsWhere<Course>,
    });

    if (!course) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.COURSE_NOT_FOUND);
    }

    // Check if tracking already exists
    let courseTrack = await this.courseTrackRepository.findOne({
      where: { 
        userId, 
        courseId,
        tenantId,
        organisationId
      } as FindOptionsWhere<CourseTrack>,
    });

    if (!courseTrack) {
      // Count lessons in course
      const lessonCount = await this.lessonRepository.count({
        where: { 
          courseId,
          tenantId,
          organisationId,
          status: Not(LessonStatus.ARCHIVED)
        }
      });

      courseTrack = this.courseTrackRepository.create({
        userId,
        courseId,
        tenantId,
        organisationId,
        status: TrackingStatus.STARTED,
        startDatetime: new Date(),
        noOfLessons: lessonCount,
        completedLessons: 0,
      });
    } else {
      // If track exists but is not completed, update lastAccessedDate
      if (courseTrack.status !== TrackingStatus.COMPLETED) {
        courseTrack.lastAccessedDate = new Date();
      }
    }

    return await this.courseTrackRepository.save(courseTrack);
  }

  /**
   * Update course tracking
   */
  async updateCourseTracking(
    updateCourseTrackingDto: UpdateCourseTrackingDto, 
    courseId: string,
    userId: string, 
    tenantId: string, 
    organisationId: string): Promise<CourseTrack> {
    const { status, completedLessons } = updateCourseTrackingDto;

    const course = await this.courseRepository.findOne({
      where: {
        courseId,
        tenantId,
        organisationId,
        status: Not(CourseStatus.ARCHIVED as any)
      } as FindOptionsWhere<Course>,
    });

    if (!course) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.COURSE_NOT_FOUND);
    }

    const courseTrack = await this.courseTrackRepository.findOne({
      where: {
        userId,
        courseId,
        tenantId,
        organisationId } as FindOptionsWhere<CourseTrack>,
    });

    if (!courseTrack) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.TRACKING_NOT_FOUND);
    }

    if (status === TrackingStatus.COMPLETED) {
      courseTrack.endDatetime = new Date();
      courseTrack.completedLessons = courseTrack.noOfLessons;
    }
    
    if (status !== undefined) {
      courseTrack.status = status as TrackingStatus;
    }

    if (completedLessons !== undefined) {
      courseTrack.completedLessons = completedLessons;
    }

    courseTrack.lastAccessedDate = new Date();

    return await this.courseTrackRepository.save(courseTrack);
  }


  /**
   * Get course tracking
   * @param courseId The course ID
   * @param userId The user ID
   * @param tenantId The tenant ID for data isolation
   * @param orgId The organization ID for data isolation
   */
  async getCourseTracking(
    courseId: string, 
    userId: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<CourseTrack> {
    // Build where clause with required filters
    const whereClause: any = { 
      courseId, 
      userId,
      tenantId,
      organisationId
    };
          
    const courseTrack = await this.courseTrackRepository.findOne({
      where: whereClause,
    });

    if (!courseTrack) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.TRACKING_NOT_FOUND);
    }

    return courseTrack;
  }

  /**
   * Start lesson tracking
   */
  async startLessonTracking(
    startLessonTrackingDto: StartLessonTrackingDto, 
    lessonId: string, 
    userId: string, 
    tenantId: string, 
    organisationId: string
  ): Promise<LessonTrack> {
    const { courseId } = startLessonTrackingDto;

    // Check if lesson exists
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId,
        courseId,
        tenantId,
        organisationId,
        status: Not(LessonStatus.ARCHIVED)
      } as FindOptionsWhere<Lesson>,
    });

    if (!lesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
    }

    // Start or get course tracking if courseId is provided
    let courseTrack: CourseTrack | undefined;
    if (courseId) {
      try {
        courseTrack = await this.getCourseTracking(courseId, userId, tenantId, organisationId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          courseTrack = await this.startCourseTracking(courseId, userId, tenantId, organisationId);
        } else {
          throw error;
        }
      }
    }

    // Check if lesson tracking already exists
    let lessonTrack = await this.lessonTrackRepository.findOne({
      where: { 
        lessonId,
        userId,
        courseId,
        tenantId,
        organisationId
      } as FindOptionsWhere<LessonTrack>,
    });

    if (!lessonTrack) {
      lessonTrack = this.lessonTrackRepository.create({
        lessonId,
        userId,
        courseId,
        courseTrackId: courseTrack?.courseTrackId || undefined,
        status: TrackingStatus.STARTED,
        startDatetime: new Date(),
        attempt: 1,
        totalContent: 0,
        currentPosition: 0,
        timeSpent: 0,
      });
    } else {
      // If track exists but is not completed, update startDatetime
      if (lessonTrack.status !== TrackingStatus.COMPLETED) {
        lessonTrack.startDatetime = new Date();
      }
    }

    return await this.lessonTrackRepository.save(lessonTrack);
  }

  /**
   * Update lesson tracking
   */
  async updateLessonTracking(
    updateLessonTrackingDto: UpdateLessonTrackingDto,
    lessonId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    const { currentPosition, timeSpent, score, status } = updateLessonTrackingDto;

    const lessonTrack = await this.lessonTrackRepository.findOne({
      where: { 
        lessonId,
        userId,
        tenantId,
        organisationId
      } as FindOptionsWhere<LessonTrack>,
    });

    if (!lessonTrack) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.TRACKING_NOT_FOUND);
    }

    if (currentPosition !== undefined) {
      lessonTrack.currentPosition = currentPosition;
    }

    if (timeSpent !== undefined) {
      lessonTrack.timeSpent = timeSpent;
    }

    if (score !== undefined) {
      lessonTrack.score = score;
    }

    if (status !== undefined) {
      lessonTrack.status = status as TrackingStatus;
    }

    // If we have courseId but no courseTrackId, try to find and set it
    if (lessonTrack.courseId && !lessonTrack.courseTrackId) {
      try {
        const courseTrack = await this.getCourseTracking(
          lessonTrack.courseId, 
          lessonTrack.userId,
          tenantId,
          organisationId
        );
        lessonTrack.courseTrackId = courseTrack.courseTrackId;
      } catch (error) {
        this.logger.warn(`Could not find courseTrack for lesson track with id ${lessonId}`);
      }
    }

    const updatedTracking = await this.lessonTrackRepository.save(lessonTrack);
    
    // Also update course tracking if in a course
    if (lessonTrack.courseId) {
      await this.updateCourseAndModuleTracking(updatedTracking);
    }

    return updatedTracking;
  }

  /**
   * Complete lesson tracking
   */
  async completeLessonTracking(
    updateLessonTrackingDto: UpdateLessonTrackingDto,
    lessonId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    const { score } = updateLessonTrackingDto;

    const lessonTrack = await this.lessonTrackRepository.findOne({
      where: { 
        lessonId,
        userId,
        tenantId,
        organisationId
      } as FindOptionsWhere<LessonTrack>,
    });

    if (!lessonTrack) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.TRACKING_NOT_FOUND);
    }

    if (lessonTrack.status === TrackingStatus.COMPLETED) {
      throw new BadRequestException(RESPONSE_MESSAGES.ERROR.LESSON_ALREADY_COMPLETED);
    }

    lessonTrack.status = TrackingStatus.COMPLETED;
    lessonTrack.endDatetime = new Date();
    
    if (score !== undefined) {
      lessonTrack.score = score;
    }

    // If we have courseId but no courseTrackId, try to find and set it
    if (lessonTrack.courseId && !lessonTrack.courseTrackId) {
      try {
        const courseTrack = await this.getCourseTracking(
          lessonTrack.courseId, 
          lessonTrack.userId,
          tenantId,
          organisationId
        );
        lessonTrack.courseTrackId = courseTrack.courseTrackId;
      } catch (error) {
        this.logger.warn(`Could not find courseTrack for lesson track with id ${lessonId}`);
      }
    }

    const updatedTracking = await this.lessonTrackRepository.save(lessonTrack);
    
    // Also update course tracking if in a course
    if (lessonTrack.courseId) {
      await this.updateCourseAndModuleTracking(updatedTracking);
    }

    return updatedTracking;
  }

  /**
   * Get lesson tracking
   * @param lessonId The lesson ID
   * @param userId The user ID
   * @param courseId Optional course ID
   * @param tenantId The tenant ID for data isolation
   * @param orgId The organization ID for data isolation
   */
  async getLessonTracking(
    lessonId: string, 
    userId: string, 
    courseId?: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<LessonTrack> {
    // Build where clause with required filters
    const where: any = {
      lessonId,
      userId,
      tenantId,
      organisationId
    };
    
    if (courseId) {
      where.courseId = courseId;
      
      // If courseId is provided, also try to find the courseTrackId
      try {
        const courseTrack = await this.getCourseTracking(courseId, userId, tenantId, organisationId);
        if (courseTrack) {
          where.courseTrackId = courseTrack.courseTrackId;
        }
      } catch (error) {
        // If courseTrack is not found, just continue with courseId only
        this.logger.warn(`CourseTrack not found for courseId ${courseId} and userId ${userId}`);
      }
    }
    
    // Add tenant and org filters if provided
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (organisationId) {
      where.organisationId = organisationId;
    }
    
    const lessonTracks = await this.lessonTrackRepository.find({
      where,
      order: { attempt: 'DESC' },
      take: 1,
    });

    if (lessonTracks.length === 0) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.TRACKING_NOT_FOUND);
    }

    return lessonTracks[0];
  }

  /**
   * Get lesson tracking history
   * @param lessonId The lesson ID
   * @param userId The user ID
   * @param courseId Optional course ID
   * @param paginationDto Pagination parameters
   * @param tenantId The tenant ID for data isolation
   * @param orgId The organization ID for data isolation
   */
  async getLessonTrackingHistory(
    lessonId: string, 
    userId: string, 
    courseId: string,
    paginationDto: PaginationDto,
    tenantId?: string,
    organisationId?: string
  ): Promise<{ items: LessonTrack[]; total: number }> {    
    const { page = 1, limit = 10 } = paginationDto;
    
    // Build where clause with required filters
    const where: any = {
      lessonId,
      userId,
    };
    
    if (courseId) {
      where.courseId = courseId;
      
      // If courseId is provided, also try to find the courseTrackId
      try {
        const courseTrack = await this.getCourseTracking(courseId, userId, tenantId, organisationId);
        if (courseTrack) {
          where.courseTrackId = courseTrack.courseTrackId;
        }
      } catch (error) {
        // If courseTrack is not found, just continue with courseId only
        this.logger.warn(`CourseTrack not found for courseId ${courseId} and userId ${userId}`);
      }
    }
    
    // Add tenant and org filters if provided
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (organisationId) {
      where.organisationId = organisationId;
    }
    
    const options: FindManyOptions<LessonTrack> = {
      where,
      order: { attempt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };
    
    const [items, total] = await this.lessonTrackRepository.findAndCount(options);
    
    return { items, total };
  }

  /**
   * Helper method to update course and module tracking
   */
  private async updateCourseAndModuleTracking(lessonTrack: LessonTrack): Promise<void> {
    if (!lessonTrack.courseId) {
      return;
    }

    // Get course track
    let courseTrack = await this.courseTrackRepository.findOne({
      where: { 
        courseId: lessonTrack.courseId, 
        userId: lessonTrack.userId,
      } as FindOptionsWhere<CourseTrack>,
    });

    if (!courseTrack) {
      return;
    }

    // Update course track
    courseTrack.lastAccessedDate = new Date();

    // If the lesson is completed, update completed lessons count
    if (lessonTrack.status === TrackingStatus.COMPLETED) {
      // Get all completed lessons for this course
      const completedLessonTracks = await this.lessonTrackRepository.find({
        where: { 
          courseId: lessonTrack.courseId, 
          userId: lessonTrack.userId, 
          status: TrackingStatus.COMPLETED,
        } as FindOptionsWhere<LessonTrack>,
      });

      // Get unique lesson IDs
      const uniqueCompletedLessonIds = [...new Set(completedLessonTracks.map(track => track.lessonId))];
      
      // Update course track
      courseTrack.completedLessons = uniqueCompletedLessonIds.length;
      
      // Check if course is completed
      if (courseTrack.completedLessons >= courseTrack.noOfLessons) {
        courseTrack.status = TrackingStatus.COMPLETED;
        courseTrack.endDatetime = new Date();
        
      } else {
        // Course is not fully completed yet - status remains INCOMPLETE
      }
    }

    await this.courseTrackRepository.save(courseTrack);

    // Find and update module tracking if applicable
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId: lessonTrack.lessonId,
      } as FindOptionsWhere<Lesson>,
    });

    if (lesson && lesson.moduleId) {
      await this.updateModuleTracking(lesson.moduleId, lessonTrack.userId);
    }
  }

  /**
   * Helper method to update module tracking
   */
  private async updateModuleTracking(moduleId: string, userId: string): Promise<void> {
    // This is a stub implementation that would be expanded in a real system
    // For example, calculating completion percentage of modules based on lesson completion
    
    // Get module
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId } as FindOptionsWhere<Module>,
    });
    
    if (module && module.badgeTerm) {
      // In a real implementation, this would generate badges for completed modules
      this.logger.log(`User ${userId} would earn badge for module ${moduleId}`);
    }
  }

  /**
   * Update lesson tracking progress for current attempt
   */
  async trackLesson(
    trackingDto: UpdateLessonTrackingDto,
    lessonId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    const { courseId, currentPosition, timeSpent, score, status } = trackingDto;

    // Get lesson details first
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId,
        tenantId,
        organisationId
      } as FindOptionsWhere<Lesson>,
    });

    if (!lesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
    }

    // Build where clause based on whether courseId is provided
    const whereClause: any = { 
      lessonId, 
      userId
    };

    // For standalone lessons, ensure courseId is null
    if (!courseId) {
      whereClause.courseId = IsNull();
    } else {
      whereClause.courseId = courseId;
    }

    // Find existing track for current attempt
    const existingTrack = await this.lessonTrackRepository.findOne({
      where: whereClause,
      order: { attempt: 'DESC' },
    });

    if (!existingTrack) {
      throw new NotFoundException('No active attempt found for this lesson');
    }

    // Update tracking data
    if (currentPosition !== undefined) {
      existingTrack.currentPosition = currentPosition;
    }

    if (timeSpent !== undefined) {
      existingTrack.timeSpent = timeSpent;
    }

    if (score !== undefined) {
      existingTrack.score = score;
    }

    if (status !== undefined) {
      existingTrack.status = status as TrackingStatus;
      if (status === TrackingStatus.COMPLETED) {
        existingTrack.endDatetime = new Date();
      }
    }

    // For course lessons, ensure courseTrackId is set
    if (courseId) {
      try {
        const courseTrack = await this.getCourseTracking(
          courseId, 
          userId,
          tenantId,
          organisationId
        );
        existingTrack.courseTrackId = courseTrack.courseTrackId;
      } catch (error) {
        this.logger.warn(`Could not find courseTrack for lesson track with id ${lessonId}`);
      }
    }

    const savedTracking = await this.lessonTrackRepository.save(existingTrack);
    
    // Update course tracking if this is a course lesson
    if (courseId) {
      await this.updateCourseAndModuleTracking(savedTracking);
    }

    return savedTracking;
  }

  /**
   * Start a new lesson attempt or get existing incomplete attempt
   */
  async startLessonAttempt(
    startLessonTrackingDto: StartLessonTrackingDto,
    lessonId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    const { courseId } = startLessonTrackingDto;

    // Get lesson details first
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId,
        tenantId,
        organisationId
      } as FindOptionsWhere<Lesson>,
    });

    if (!lesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
    }

    // For standalone lessons (no courseId)
    if (!courseId) {
      // Find existing tracks for standalone lesson
      const existingTracks = await this.lessonTrackRepository.find({
        where: { 
          lessonId, 
          userId,
          courseId: IsNull()
        } as FindOptionsWhere<LessonTrack>,
        order: { attempt: 'DESC' },
        take: 1,
      });

      // If there's an incomplete attempt, return it
      if (existingTracks.length > 0 && existingTracks[0].status !== TrackingStatus.COMPLETED) {
        return existingTracks[0];
      }

      // Check max attempts from lesson settings
      const maxAttempts = lesson.noOfAttempts || 1;
      if (existingTracks.length > 0 && existingTracks[0].attempt >= maxAttempts) {
        throw new BadRequestException('Maximum number of attempts reached for this lesson');
      }

      // Create new attempt
      const lessonTrack = this.lessonTrackRepository.create({
        userId,
        lessonId,
        courseId: undefined,
        attempt: existingTracks.length > 0 ? existingTracks[0].attempt + 1 : 1,
        status: TrackingStatus.STARTED,
        startDatetime: new Date(),
        totalContent: 0,
        currentPosition: 0,
        timeSpent: 0
      });

      return await this.lessonTrackRepository.save(lessonTrack);
    }

    // Course lesson handling
    const courseLesson = await this.lessonRepository.findOne({
      where: { 
        lessonId,
        courseId,
        tenantId,
        organisationId
      } as FindOptionsWhere<Lesson>,
    });

    if (!courseLesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.COURSE_LESSON_NOT_FOUND);
    }

    // Find existing tracks for course lesson
    const existingTracks = await this.lessonTrackRepository.find({
      where: { 
        lessonId, 
        userId,
        courseId
      } as FindOptionsWhere<LessonTrack>,
      order: { attempt: 'DESC' },
      take: 1,
    });

    // If there's an incomplete attempt, return it
    if (existingTracks.length > 0 && existingTracks[0].status !== TrackingStatus.COMPLETED) {
      return existingTracks[0];
    }

    // Check max attempts
    const maxAttempts = courseLesson?.noOfAttempts || lesson.noOfAttempts || 1;
    if (existingTracks.length > 0 && existingTracks[0].attempt >= maxAttempts) {
      throw new BadRequestException('Maximum number of attempts reached for this lesson');
    }

    // Create new attempt
    const lessonTrack = this.lessonTrackRepository.create({
      userId,
      lessonId,
      courseId,
      attempt: existingTracks.length > 0 ? existingTracks[0].attempt + 1 : 1,
      status: TrackingStatus.STARTED,
      startDatetime: new Date(),
      totalContent: 0,
      currentPosition: 0,
      timeSpent: 0
    });

    // Set courseTrackId
    try {
      const courseTrack = await this.getCourseTracking(
        courseId, 
        userId,
        tenantId,
        organisationId
      );
      lessonTrack.courseTrackId = courseTrack.courseTrackId;
    } catch (error) {
      this.logger.warn(`Could not find courseTrack for lesson track with id ${lessonId}`);
    }

    const savedTracking = await this.lessonTrackRepository.save(lessonTrack);
    
    // Update course tracking
    await this.updateCourseAndModuleTracking(savedTracking);

    return savedTracking;
  }

  /**
   * Manage lesson attempt - start over or resume
   */
  async manageLessonAttempt(
    startLessonTrackingDto: StartLessonTrackingDto,
    lessonId: string,
    action: 'start' | 'resume',
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    const { courseId } = startLessonTrackingDto;

    // Get lesson details first
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId,
        tenantId,
        organisationId
      } as FindOptionsWhere<Lesson>,
    });

    if (!lesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
    }

    // For standalone lessons (no courseId)
    if (!courseId) {
      // Find existing tracks for standalone lesson
      const existingTracks = await this.lessonTrackRepository.find({
        where: { 
          lessonId, 
          userId,
          courseId: IsNull()
        } as FindOptionsWhere<LessonTrack>,
        order: { attempt: 'DESC' },
        take: 1,
      });

      if (existingTracks.length === 0) {
        throw new NotFoundException('No existing attempt found');
      }

      const latestTrack = existingTracks[0];

      if (action === 'resume') {
        // Check if lesson allows resume
        const canResume = lesson.resume ?? true;
        if (!canResume) {
          throw new BadRequestException('Resuming attempts is not allowed for this lesson');
        }
        if (latestTrack.status === TrackingStatus.COMPLETED) {
          throw new BadRequestException('Cannot resume a completed attempt');
        }
        return latestTrack;
      } else { // start over
        // Check max attempts
        const maxAttempts = lesson.noOfAttempts || 1;
        if (latestTrack.attempt >= maxAttempts) {
          throw new BadRequestException('Maximum number of attempts reached for this lesson');
        }

        // Create new attempt
        const lessonTrack = this.lessonTrackRepository.create({
          userId,
          lessonId,
          courseId: undefined,
          attempt: latestTrack.attempt,
          status: TrackingStatus.STARTED,
          startDatetime: new Date(),
          score: 0,
          totalContent: 0,
          currentPosition: 0,
          timeSpent: 0
        });

        return await this.lessonTrackRepository.save(lessonTrack);
      }
    }

    // Course lesson handling
    const courseLesson = await this.lessonRepository.findOne({
      where: { 
        lessonId,
        courseId,
        tenantId,
        organisationId
      } as FindOptionsWhere<Lesson>,
    });

    if (!courseLesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.COURSE_LESSON_NOT_FOUND);
    }

    // Find existing tracks for course lesson
    const existingTracks = await this.lessonTrackRepository.find({
      where: { 
        lessonId, 
        userId,
        courseId
      } as FindOptionsWhere<LessonTrack>,
      order: { attempt: 'DESC' },
      take: 1,
    });

    if (existingTracks.length === 0) {
      throw new NotFoundException('No existing attempt found');
    }

    const latestTrack = existingTracks[0];

    if (action === 'resume') {
      // Check if lesson allows resume
      const canResume = courseLesson.resume ?? lesson.resume ?? true;
      if (!canResume) {
        throw new BadRequestException('Resuming attempts is not allowed for this lesson');
      }
      if (latestTrack.status === TrackingStatus.COMPLETED) {
        throw new BadRequestException('Cannot resume a completed attempt');
      }
      return latestTrack;
    } else { // start over
      // Check max attempts
      const maxAttempts = courseLesson?.noOfAttempts || lesson.noOfAttempts || 1;
      if (latestTrack.attempt >= maxAttempts) {
        throw new BadRequestException('Maximum number of attempts reached for this lesson');
      }

      // Create new attempt
      const lessonTrack = this.lessonTrackRepository.create({
        userId,
        lessonId,
        courseId,
        attempt: latestTrack.attempt,
        status: TrackingStatus.STARTED,
        startDatetime: new Date(),
        score: 0,
        totalContent: 0,
        currentPosition: 0,
        timeSpent: 0
      });

      // Set courseTrackId
      try {
        const courseTrack = await this.getCourseTracking(
          courseId, 
          userId,
          tenantId,
          organisationId
        );
        lessonTrack.courseTrackId = courseTrack.courseTrackId;
      } catch (error) {
        this.logger.warn(`Could not find courseTrack for lesson track with id ${lessonId}`);
      }

      const savedTracking = await this.lessonTrackRepository.save(lessonTrack);
      
      // Update course tracking
      await this.updateCourseAndModuleTracking(savedTracking);

      return savedTracking;
    }
  }

  /**
   * Get lesson status for a user
   */
  async getLessonStatus(
    lessonId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonStatusDto> {
    // Get lesson
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId,
        tenantId,
        organisationId,
        status: Not(LessonStatus.ARCHIVED)
      } as FindOptionsWhere<Lesson>,
    });

    if (!lesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
    }

    // Find latest attempt
    const latestTrack = await this.lessonTrackRepository.findOne({
      where: { 
        lessonId, 
        userId,
        courseId: lesson.courseId || undefined
      } as FindOptionsWhere<LessonTrack>,
      order: { attempt: 'DESC' },
    });

    const status: LessonStatusDto = {
      canResume: false,
      canReattempt: false,
      lastAttemptStatus: latestTrack?.status === TrackingStatus.STARTED ? 'not-started' : latestTrack?.status === TrackingStatus.INCOMPLETE ? 'in-progress' : latestTrack?.status === TrackingStatus.COMPLETED ? 'completed' : 'not-started',
      lastAttemptId: latestTrack?.lessonTrackId || null
    };

    if (latestTrack) {
      status.lastAttemptId = latestTrack.lessonTrackId;
      status.lastAttemptStatus = latestTrack.status === TrackingStatus.STARTED ? 'not-started' : latestTrack.status === TrackingStatus.INCOMPLETE ? 'in-progress' : latestTrack.status === TrackingStatus.COMPLETED ? 'completed' : 'not-started';

      // Check if can resume
      if (latestTrack.status === TrackingStatus.STARTED || latestTrack.status === TrackingStatus.INCOMPLETE) {
        status.canResume = true;
      }

      // Check if can reattempt
      if (latestTrack.status === TrackingStatus.COMPLETED) {
        status.canReattempt = true;
      }
    } else {
      // No attempts yet, can start first attempt
      status.canReattempt = true;
    }

    return status;
  }

  /**
   * Start a new attempt
   */
  async startNewAttempt(
    lessonId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    // Check if can start new attempt
    const status = await this.getLessonStatus(lessonId, userId, tenantId, organisationId);
    if (!status.canReattempt) {
      throw new BadRequestException('Cannot start new attempt - max attempts reached or lesson blocked');
    }

    // Start new attempt
    return this.startLessonAttempt(
      { courseId: undefined },
      lessonId,
      userId,
      tenantId,
      organisationId
    );
  }

  /**
   * Resume an existing attempt
   */
  async resumeAttempt(
    attemptId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    const attempt = await this.lessonTrackRepository.findOne({
      where: { 
        lessonTrackId: attemptId,
        userId
      } as FindOptionsWhere<LessonTrack>,
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get lesson details
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId: attempt.lessonId,
        tenantId,
        organisationId
      } as FindOptionsWhere<Lesson>,
    });

    if (!lesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
    }

    // Check if can resume
    if (!lesson.resume) {
      throw new BadRequestException('Resuming attempts is not allowed for this lesson');
    }

    if (attempt.status === TrackingStatus.COMPLETED) {
      throw new BadRequestException('Cannot resume a completed attempt');
    }

    return attempt;
  }

  /**
   * Reset an attempt
   */
  async resetAttempt(
    attemptId: string,
    userId: string,
    tenantId: string,
    organisationId: string
  ): Promise<LessonTrack> {
    const attempt = await this.lessonTrackRepository.findOne({
      where: { 
        lessonTrackId: attemptId,
        userId
      } as FindOptionsWhere<LessonTrack>,
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get lesson details
    const lesson = await this.lessonRepository.findOne({
      where: { 
        lessonId: attempt.lessonId,
        tenantId,
        organisationId
      } as FindOptionsWhere<Lesson>,
    });

    if (!lesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.LESSON_NOT_FOUND);
    }

    // Create new attempt with same attempt number
    const newAttemptData: Partial<LessonTrack> = {
      lessonId: attempt.lessonId,
      userId: attempt.userId,
      courseId: attempt.courseId,
      courseTrackId: attempt.courseTrackId,
      attempt: attempt.attempt,
      status: TrackingStatus.STARTED,
      startDatetime: new Date(),
      endDatetime: undefined,
      score: 0,
      currentPosition: 0,
      timeSpent: 0,
      params: attempt.params || {}
    };

    const newAttempt = this.lessonTrackRepository.create(newAttemptData);
    return this.lessonTrackRepository.save(newAttempt);
  }

  /**
   * Update attempt progress
   */
  async updateProgress(
    attemptId: string,
    updateProgressDto: UpdateProgressDto,
    userId: string
  ): Promise<LessonTrack> {
    const attempt = await this.lessonTrackRepository.findOne({
      where: { 
        lessonTrackId: attemptId,
        userId
      } as FindOptionsWhere<LessonTrack>,
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Update progress
    attempt.currentPosition = updateProgressDto.completionPercentage;
    if (updateProgressDto.currentSection) {
      attempt.params = {
        ...attempt.params,
        currentSection: updateProgressDto.currentSection
      };
    }

    // Update status if completed
    if (updateProgressDto.completionPercentage >= 100) {
      attempt.status = TrackingStatus.COMPLETED;
      attempt.endDatetime = new Date();
    } else if (attempt.status === TrackingStatus.STARTED) {
      attempt.status = TrackingStatus.INCOMPLETE;
    }

    return this.lessonTrackRepository.save(attempt);
  }

  async getCourseProgress(
    courseId: string,
    userId: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<any> {
    const cacheKey = `${this.cache_prefix_tracking}:course:${courseId}:${userId}:${tenantId}:${organisationId}`;
    
    if (this.cache_enabled) {
      const cachedProgress = await this.cacheService.get<any>(cacheKey);
      if (cachedProgress) {
        return cachedProgress;
      }
    }

    // Get course
    const course = await this.courseRepository.findOne({
      where: { 
        courseId,
        status: Not(CourseStatus.ARCHIVED as any),
        ...(tenantId && { tenantId }),
        ...(organisationId && { organisationId }),
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get all lessons for this course
    const lessons = await this.lessonRepository.find({
      where: { 
        courseId,
        status: Not(LessonStatus.ARCHIVED),
        ...(tenantId && { tenantId }),
        ...(organisationId && { organisationId }),
      },
    });

    // Get lesson tracks
    const lessonTracks = await this.lessonTrackRepository.find({
      where: { 
        courseId,
        userId,
        ...(tenantId && { tenantId }),
        ...(organisationId && { organisationId }),
      },
    });

    // Calculate progress
    const totalLessons = lessons.length;
    const completedLessons = lessonTracks.filter(track => 
      track.status === TrackingStatus.COMPLETED
    ).length;

    const progress = {
      courseId,
      userId,
      totalLessons,
      completedLessons,
      progress: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
      lessons: lessons.map(lesson => {
        const track = lessonTracks.find(t => t.lessonId === lesson.lessonId);
        return {
          lessonId: lesson.lessonId,
          title: lesson.title,
          status: track?.status === TrackingStatus.STARTED ? 'not-started' : track?.status === TrackingStatus.INCOMPLETE ? 'in-progress' : track?.status === TrackingStatus.COMPLETED ? 'completed' : 'not-started',
          score: track?.score || 0,
          attempts: track?.attempt || 0,
          timeSpent: track?.timeSpent || 0,
        };
      }),
    };

    if (this.cache_enabled) {
      await this.cacheService.set(cacheKey, progress, this.cache_ttl_user);
    }

    return progress;
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<{ count: number; tracks: LessonTrack[] }> {
    const skip = paginationDto.skip;
    const take = paginationDto.limit ?? 10;

    const [tracks, count] = await this.lessonTrackRepository.findAndCount({
      where: { 
        userId,
        ...(tenantId && { tenantId }),
        ...(organisationId && { organisationId }),
      },
      skip,
      take,
      order: {
        updatedAt: 'DESC',
      },
      relations: ['lesson', 'lesson.media'],
    });

    return { count, tracks };
  }
}