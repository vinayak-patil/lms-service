import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, LessThan, MoreThan, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserEnrollment, EnrollmentStatus } from './entities/user-enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseStatus } from '../courses/entities/course.entity';
import { CourseTrack } from '../tracking/entities/course-track.entity';
import { TrackingStatus } from '../tracking/entities/course-track.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { HelperUtil } from '../common/utils/helper.util';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);
  private readonly cache_ttl_default: number;
  private readonly cache_ttl_user: number;
  private readonly cache_prefix_enrollment: string;
  private readonly cache_enabled: boolean;

  constructor(
    @InjectRepository(UserEnrollment)
    private readonly userEnrollmentRepository: Repository<UserEnrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseTrack)
    private readonly courseTrackRepository: Repository<CourseTrack>,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.cache_enabled = this.configService.get('CACHE_ENABLED') || true;
    this.cache_ttl_default = this.configService.get('CACHE_DEFAULT_TTL') || 3600;
    this.cache_ttl_user = this.configService.get('CACHE_USER_TTL') || 600;
    this.cache_prefix_enrollment = this.configService.get('CACHE_ENROLLMENT_PREFIX') || 'enrollments';
  }

  /**
   * Enroll a user for a course
   * @param createEnrollmentDto The enrollment data
   * @param organisationId The organization ID for data isolation
   */
  async enroll(
    createEnrollmentDto: CreateEnrollmentDto,
    organisationId?: string
  ): Promise<UserEnrollment> {
    this.logger.log(`Enrolling user: ${JSON.stringify(createEnrollmentDto)}`);
    
    try {
      const { courseId, userId, tenantId } = createEnrollmentDto;
      
      // Build where clause for course validation with data isolation
      const courseWhereClause: FindOptionsWhere<Course> = { 
        courseId, 
        status: Not(CourseStatus.ARCHIVED),
        tenantId,
        ...(organisationId && { organisationId })
      };
      
      // Validate course exists with proper data isolation
      const course = await this.courseRepository.findOne({
        where: courseWhereClause,
      });
      
      if (!course) {
        throw new NotFoundException(RESPONSE_MESSAGES.COURSE_NOT_FOUND);
      }

      // Check if admin approval is required
      if (course.adminApproval && !createEnrollmentDto.enrolledBy) {
        throw new BadRequestException(RESPONSE_MESSAGES.ADMIN_APPROVAL_REQUIRED);
      }

      // Build where clause for existing enrollment check with data isolation
      const enrollmentWhereClause: FindOptionsWhere<UserEnrollment> = {
        courseId,
        userId,
        status: EnrollmentStatus.PUBLISHED,
        tenantId,
        ...(organisationId && { organisationId })
      };
      
      // Check for existing active enrollment
      const existingEnrollment = await this.userEnrollmentRepository.findOne({
        where: enrollmentWhereClause,
      });
      
      if (existingEnrollment) {
        throw new ConflictException(RESPONSE_MESSAGES.ALREADY_ENROLLED);
      }

      // Generate a unique UUID for the enrollment
      const enrollmentId = uuidv4();

      // Calculate end time based on course settings
      let endTime: Date | null = null;
      if (course.endDatetime) {
        endTime = new Date(course.endDatetime);
      } else if (createEnrollmentDto.endTime) {
        endTime = new Date(createEnrollmentDto.endTime);
      }

      // Parse JSON params if they are provided as a string
      let params = createEnrollmentDto.params;
      if (typeof params === 'string') {
        try {
          params = JSON.parse(params);
        } catch (error) {
          this.logger.error(`Error parsing params JSON: ${error.message}`);
          throw new BadRequestException(RESPONSE_MESSAGES.INVALID_PARAMS_FORMAT);
        }
      }

      // Create new enrollment entity
      const enrollment = this.userEnrollmentRepository.create({
        courseId,
        userId,
        tenantId,
        organisationId,
        enrolledOnTime: new Date(),
        endTime: endTime || undefined,
        status: EnrollmentStatus.PUBLISHED,
        unlimitedPlan: createEnrollmentDto.unlimitedPlan || false,
        beforeExpiryMail: false,
        afterExpiryMail: false,
        params: params,
        enrolledBy: createEnrollmentDto.enrolledBy || userId,
        enrolledAt: new Date(),
      });

      // Save the enrollment
      const savedEnrollment = await this.userEnrollmentRepository.save(enrollment);

      // Create course tracking record
      const courseTrack = this.courseTrackRepository.create({
        courseId,
        userId,
        startDatetime: new Date(),
        noOfLessons: 0,
        completedLessons: 0,
        status: TrackingStatus.STARTED,
        lastAccessedDate: new Date(),
      });
      
      await this.courseTrackRepository.save(courseTrack);

      // Find and return the complete enrollment with relations
      const completeEnrollment = await this.userEnrollmentRepository.findOne({
        where: { enrollmentId: savedEnrollment.enrollmentId },
        relations: ['course'],
      });

      if (!completeEnrollment) {
        throw new InternalServerErrorException(RESPONSE_MESSAGES.ENROLLMENT_ERROR);
      }

      // Invalidate cache
      if (this.cache_enabled) {
        const cacheKeys = [
          `${this.cache_prefix_enrollment}:${savedEnrollment.enrollmentId}:${tenantId}:${organisationId}`,
          `${this.cache_prefix_enrollment}:user:${userId}:${tenantId}:${organisationId}`,
          `${this.cache_prefix_enrollment}:course:${courseId}:${tenantId}:${organisationId}`
        ];
        await Promise.all(cacheKeys.map(key => this.cacheService.del(key)));
      }
      
      return completeEnrollment;
    } catch (error) {
      this.logger.error(`Error enrolling user: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(RESPONSE_MESSAGES.ENROLLMENT_ERROR);
    }
  }

  /**
   * Find all enrollments with pagination and filters
   */
  async findAll(
    paginationDto: PaginationDto,
    userId?: string,
    courseId?: string,
    status?: string,
    tenantId?: string,
    organisationId?: string,
  ): Promise<{ count: number; enrollments: UserEnrollment[] }> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const cacheKey = `${this.cache_prefix_enrollment}:list:${tenantId}:${organisationId}:${page}:${limit}:${userId}:${courseId}:${status}`;

      if (this.cache_enabled) {
        const cachedResult = await this.cacheService.get<{ count: number; enrollments: UserEnrollment[] }>(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Build query with filters
      const whereConditions: FindOptionsWhere<UserEnrollment> = {
        ...(userId && { userId }),
        ...(courseId && { courseId }),
        ...(status && { status: status as EnrollmentStatus }),
        ...(tenantId && { tenantId }),
        ...(organisationId && { organisationId }),
        status: status ? (status as EnrollmentStatus) : Not(EnrollmentStatus.CANCELLED),
      };

      // Execute query with pagination
      const [enrollments, count] = await this.userEnrollmentRepository.findAndCount({
        where: whereConditions,
        skip,
        take: limit,
        order: {
          enrolledOnTime: 'DESC',
        },
        relations: ['course'],
      });

      // Update status for expired enrollments
      const now = new Date();
      for (const enrollment of enrollments) {
        if (
          enrollment.status === EnrollmentStatus.PUBLISHED &&
          enrollment.endTime &&
          enrollment.endTime < now &&
          !enrollment.unlimitedPlan
        ) {
          enrollment.status = EnrollmentStatus.ARCHIVED;
          await this.userEnrollmentRepository.save(enrollment);
        }
      }

      const result = { count, enrollments };

      if (this.cache_enabled) {
        await this.cacheService.set(cacheKey, result, this.cache_ttl_default);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error finding enrollments: ${error.message}`);
      throw new InternalServerErrorException(RESPONSE_MESSAGES.FETCH_ERROR);
    }
  }

  /**
   * Find a single enrollment by ID
   */
  async findOne(
    enrollmentId: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<UserEnrollment> {
    try {
      const cacheKey = `${this.cache_prefix_enrollment}:${enrollmentId}:${tenantId}:${organisationId}`;

      if (this.cache_enabled) {
        const cachedEnrollment = await this.cacheService.get<UserEnrollment>(cacheKey);
        if (cachedEnrollment) {
          return cachedEnrollment;
        }
      }

      const whereConditions: FindOptionsWhere<UserEnrollment> = {
        enrollmentId,
        ...(tenantId && { tenantId }),
        ...(organisationId && { organisationId }),
      };

      const enrollment = await this.userEnrollmentRepository.findOne({
        where: whereConditions,
        relations: ['course'],
      });

      if (!enrollment) {
        throw new NotFoundException(RESPONSE_MESSAGES.ENROLLMENT_NOT_FOUND);
      }

      if (this.cache_enabled) {
        await this.cacheService.set(cacheKey, enrollment, this.cache_ttl_default);
      }

      return enrollment;
    } catch (error) {
      this.logger.error(`Error finding enrollment: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(RESPONSE_MESSAGES.FETCH_ERROR);
    }
  }

  /**
   * Update an enrollment
   */
  async update(
    enrollmentId: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
    tenantId?: string,
    organisationId?: string
  ): Promise<UserEnrollment> {
    try {
      const enrollment = await this.findOne(enrollmentId, tenantId, organisationId);

      // Update enrollment fields
      Object.assign(enrollment, updateEnrollmentDto);

      // Save updated enrollment
      const updatedEnrollment = await this.userEnrollmentRepository.save(enrollment);

      // Invalidate cache
      if (this.cache_enabled) {
        const cacheKeys = [
          `${this.cache_prefix_enrollment}:${enrollmentId}:${tenantId}:${organisationId}`,
          `${this.cache_prefix_enrollment}:user:${enrollment.userId}:${tenantId}:${organisationId}`,
          `${this.cache_prefix_enrollment}:course:${enrollment.courseId}:${tenantId}:${organisationId}`
        ];
        await Promise.all(cacheKeys.map(key => this.cacheService.del(key)));
      }

      return updatedEnrollment;
    } catch (error) {
      this.logger.error(`Error updating enrollment: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(RESPONSE_MESSAGES.UPDATE_ERROR);
    }
  }

  /**
   * Cancel an enrollment
   */
  async cancel(
    enrollmentId: string,
    tenantId?: string,
    organisationId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const enrollment = await this.findOne(enrollmentId, tenantId, organisationId);

      if (enrollment.status === EnrollmentStatus.CANCELLED) {
        throw new BadRequestException(RESPONSE_MESSAGES.ERROR.ENROLLMENT_ALREADY_CANCELLED);
      }

      // Update enrollment status
      enrollment.status = EnrollmentStatus.CANCELLED;
      await this.userEnrollmentRepository.save(enrollment);

      // Invalidate cache
      if (this.cache_enabled) {
        const cacheKeys = [
          `${this.cache_prefix_enrollment}:${enrollmentId}:${tenantId}:${organisationId}`,
          `${this.cache_prefix_enrollment}:user:${enrollment.userId}:${tenantId}:${organisationId}`,
          `${this.cache_prefix_enrollment}:course:${enrollment.courseId}:${tenantId}:${organisationId}`
        ];
        await Promise.all(cacheKeys.map(key => this.cacheService.del(key)));
      }

      return {
        success: true,
        message: RESPONSE_MESSAGES.ENROLLMENT_CANCELLED,
      };
    } catch (error) {
      this.logger.error(`Error cancelling enrollment: ${error.message}`);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(RESPONSE_MESSAGES.CANCELLATION_ERROR);
    }
  }
}
