import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, FindManyOptions } from 'typeorm';
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
  async startCourseTracking(courseId: string, userId: string, tenantId: string, organisationId: string): Promise<CourseTrack> {

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
  async updateCourseTracking(updateCourseTrackingDto: UpdateCourseTrackingDto, userId: string, tenantId: string, organisationId: string): Promise<CourseTrack> {
    const { courseId, status, completedLessons } = updateCourseTrackingDto;

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
  async startLessonTracking(startLessonTrackingDto: StartLessonTrackingDto, userId: string, tenantId: string, organisationId: string): Promise<LessonTrack> {
    const { lessonId, courseId } = startLessonTrackingDto;

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
  async updateLessonTracking(updateLessonTrackingDto: any): Promise<LessonTrack> {
    const { lessonTrackId, currentPosition, timeSpent, score, status } = updateLessonTrackingDto;

    const lessonTrack = await this.lessonTrackRepository.findOne({
      where: { id: lessonTrackId } as FindOptionsWhere<LessonTrack>,
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
      lessonTrack.status = status;
    }

    // If we have courseId but no courseTrackId, try to find and set it
    if (lessonTrack.courseId && !lessonTrack.courseTrackId) {
      try {
        const courseTrack = await this.getCourseTracking(
          lessonTrack.courseId, 
          lessonTrack.userId
        );
        lessonTrack.courseTrackId = courseTrack.courseTrackId;
      } catch (error) {
        this.logger.warn(`Could not find courseTrack for lesson track with id ${lessonTrackId}`);
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
  async completeLessonTracking(updateLessonTrackingDto: any): Promise<LessonTrack> {
    const { lessonTrackId, score } = updateLessonTrackingDto;

    const lessonTrack = await this.lessonTrackRepository.findOne({
      where: { id: lessonTrackId } as FindOptionsWhere<LessonTrack>,
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
          lessonTrack.userId
        );
        lessonTrack.courseTrackId = courseTrack.courseTrackId;
      } catch (error) {
        this.logger.warn(`Could not find courseTrack for lesson track with id ${lessonTrackId}`);
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
    orgId?: string
  ): Promise<LessonTrack> {
    // Build where clause with required filters
    const where: any = {
      lessonId,
      userId,
    };
    
    if (courseId) {
      where.courseId = courseId;
      
      // If courseId is provided, also try to find the courseTrackId
      try {
        const courseTrack = await this.getCourseTracking(courseId, userId, tenantId, orgId);
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
    
    if (orgId) {
      where.orgId = orgId;
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
    orgId?: string
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
        const courseTrack = await this.getCourseTracking(courseId, userId, tenantId, orgId);
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
    
    if (orgId) {
      where.orgId = orgId;
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
        
        // Add certificate if configured
        const course = await this.courseRepository.findOne({
          where: { id: lessonTrack.courseId } as FindOptionsWhere<Course>,
        });
      
        if (course && course.certificateTerm) {
          // Generate certificate (mock)
          courseTrack.certGenDate = new Date();
        }
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
}