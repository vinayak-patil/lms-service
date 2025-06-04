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
import { Lesson } from '../lessons/entities/lesson.entity';
import { Module } from '../modules/entities/module.entity';
import { CourseLesson } from '../lessons/entities/course-lesson.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { UpdateCourseTrackingDto } from './dto/update-course-tracking.dto';
import { StartLessonTrackingDto } from './dto/start-lesson-tracking.dto';
import { UpdateLessonTrackingDto } from './dto/update-lesson-tracking.dto';
import { LessonStatusDto } from './dto/lesson-status.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

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
    @InjectRepository(CourseLesson)
    private readonly courseLessonRepository: Repository<CourseLesson>,
  ) {}

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

      // Build where clause for course validation
      const courseLessonWhereClause: any = { 
        courseId,
        tenantId,
        organisationId,
        status: Not(CourseStatus.ARCHIVED as any) 
      };
      
      const courseLessons = await this.courseLessonRepository.count({
        where: courseLessonWhereClause
      }); 

      courseTrack = this.courseTrackRepository.create({
        userId,
        courseId,
        tenantId,
        organisationId,
        status: TrackingStatus.STARTED,
        startDatetime: new Date(),
        noOfLessons: courseLessons,
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
    const courseLesson = courseId ? await this.courseLessonRepository.findOne({
      where: { 
        lessonId,
        courseId,
        tenantId,
        organisationId
      } as FindOptionsWhere<CourseLesson>,
    }) : null;

    if (courseId && !courseLesson) {
      throw new NotFoundException(RESPONSE_MESSAGES.ERROR.COURSE_LESSON_NOT_FOUND);
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

    // Determine tracking type and attempt configuration
    const trackingType = courseLesson?.params?.trackingType || 'standalone';
    const maxAttempts = courseLesson?.noOfAttempts || 1;
    const attemptsGrade = courseLesson?.attemptsGrade;

    // Check existing tracks based on tracking type
    const existingTracks = await this.lessonTrackRepository.find({
      where: { 
        lessonId, 
        userId,
        ...(trackingType === 'courseLesson' ? { courseId } : { courseId: null })
      } as FindOptionsWhere<LessonTrack>,
      order: { attempt: 'DESC' },
      take: 1,
    });

    let lessonTrack: LessonTrack;
    if (existingTracks.length > 0) {
      const latestTrack = existingTracks[0];
      
      // If latest track is not completed, use it
      if (latestTrack.status !== TrackingStatus.COMPLETED) {
        lessonTrack = latestTrack;
        lessonTrack.startDatetime = new Date();
        if (courseTrack) {
          lessonTrack.courseTrackId = courseTrack.courseTrackId;
        }
      } else {
        // Check if max attempts reached
        if (latestTrack.attempt >= maxAttempts) {
          throw new BadRequestException('Maximum number of attempts reached for this lesson');
        }
        
        // Create new attempt
        lessonTrack = this.lessonTrackRepository.create({
          userId,
          lessonId,
          courseId: trackingType === 'courseLesson' ? courseId : null,
          courseTrackId: courseTrack?.courseTrackId || null,
          attempt: latestTrack.attempt + 1,
          status: TrackingStatus.STARTED,
          startDatetime: new Date(),
          totalContent: 0,
          currentPosition: 0,
          timeSpent: 0
        });
      }
    } else {
      // Create first attempt
      lessonTrack = this.lessonTrackRepository.create({
        userId,
        lessonId,
        courseId: trackingType === 'courseLesson' ? courseId : null,
        courseTrackId: courseTrack?.courseTrackId || null,
        attempt: 1,
        status: TrackingStatus.STARTED,
        startDatetime: new Date(),
        totalContent: 0,
        currentPosition: 0,
        timeSpent: 0
      });
    }

    const savedTracking = await this.lessonTrackRepository.save(lessonTrack);
    
    // Update course tracking if this is a course lesson
    if (courseId && trackingType === 'courseLesson') {
      await this.updateCourseAndModuleTracking(savedTracking);
    }

    return savedTracking;
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
    tenantId?: string,
    organisationId?: string
  ): Promise<{ items: LessonTrack[]; total: number }> {    
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
    const courseLesson = await this.courseLessonRepository.findOne({
      where: { 
        courseId: lessonTrack.courseId, 
        lessonId: lessonTrack.lessonId,
      } as FindOptionsWhere<CourseLesson>,
    });

    if (courseLesson && courseLesson.moduleId) {
      await this.updateModuleTracking(courseLesson.moduleId, lessonTrack.userId);
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
        courseId: null,
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
    const courseLesson = await this.courseLessonRepository.findOne({
      where: { 
        lessonId,
        courseId,
        tenantId,
        organisationId
      } as FindOptionsWhere<CourseLesson>,
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
          courseId: null,
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
    const courseLesson = await this.courseLessonRepository.findOne({
      where: { 
        lessonId,
        courseId,
        tenantId,
        organisationId
      } as FindOptionsWhere<CourseLesson>,
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
    // Get lesson details
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
    //get the courseId form courseLesson
    const courseLesson = await this.courseLessonRepository.findOne({
      where: { 
        lessonId,
        tenantId,
        organisationId
      } as FindOptionsWhere<CourseLesson>,
    });
    //if courseLesson is not found, then get the courseId from course else use null
    //also if courseLesson is not found, then use configs form courseLesson else use lesson configs
    const courseId = courseLesson ? courseLesson.courseId : null;
    const noOfAttempts = courseLesson ? courseLesson.noOfAttempts : lesson.noOfAttempts;
    const resume = courseLesson ? courseLesson.resume : lesson.resume;
    // Find latest attempt
    const latestTrack = await this.lessonTrackRepository.findOne({
      where: { 
        lessonId, 
        userId,
        courseId: courseId ? courseId : IsNull()
      } as FindOptionsWhere<LessonTrack>,
      order: { attempt: 'DESC' },
    });

    const status: LessonStatusDto = {
      canResume: false,
      canReattempt: false,
      lastAttemptStatus: 'not-started',
      lastAttemptId:  null
    };

    if (latestTrack) {
      status.lastAttemptId = latestTrack.lessonTrackId;
      status.lastAttemptStatus = latestTrack.status;

      // Check if can resume 
      if (resume && (latestTrack.status === TrackingStatus.STARTED || latestTrack.status === TrackingStatus.INCOMPLETE))) {
        status.canResume = true;
      }

      // Check if can reattempt      
      if (latestTrack.attempt < noOfAttempts) {
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
      { courseId: null },
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
    const newAttempt = this.lessonTrackRepository.create({
      ...attempt,
      lessonTrackId: undefined, // Let DB generate new ID
      status: TrackingStatus.STARTED,
      startDatetime: new Date(),
      endDatetime: null,
      score: 0,
      currentPosition: 0,
      timeSpent: 0
    });

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
      attempt.status = TrackingStatus.IN_PROGRESS;
    }

    return this.lessonTrackRepository.save(attempt);
  }
}