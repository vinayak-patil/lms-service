import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService {
  // Cache key prefixes
  readonly COURSE_PREFIX = 'course:';
  readonly MODULE_PREFIX = 'module:';
  readonly LESSON_PREFIX = 'lesson:';
  readonly ENROLLMENT_PREFIX = 'enrollment:';
  readonly USER_PROGRESS_PREFIX = 'user_progress:';

  // Default TTL values (in seconds)
  COURSE_TTL = 3600; // 1 hour
  MODULE_TTL = 1800; // 30 minutes
  LESSON_TTL = 1800; // 30 minutes
  ENROLLMENT_TTL = 1800; // 30 minutes
  USER_PROGRESS_TTL = 300; // 5 minutes

  constructor(private configService: ConfigService) {
    // Override TTLs from config if available
    this.COURSE_TTL = parseInt(this.configService.get('CACHE_COURSE_TTL') || '3600', 10);
    this.MODULE_TTL = parseInt(this.configService.get('CACHE_MODULE_TTL') || '1800', 10);
    this.LESSON_TTL = parseInt(this.configService.get('CACHE_LESSON_TTL') || '1800', 10);
    this.ENROLLMENT_TTL = parseInt(this.configService.get('CACHE_ENROLLMENT_TTL') || '1800', 10);
    this.USER_PROGRESS_TTL = parseInt(this.configService.get('CACHE_USER_PROGRESS_TTL') || '300', 10);
  }

  // Course-related methods
  getCourseKey(courseId: string, tenantId: string, organisationId: string): string {
    return `${this.COURSE_PREFIX}${courseId}:${tenantId}:${organisationId || ''}`;
  }

  getCourseHierarchyKey(courseId: string, tenantId: string, organisationId: string): string {
    return `${this.COURSE_PREFIX}hierarchy:${courseId}:${tenantId}:${organisationId}`;
  }

  getCourseSearchKey(tenantId: string, organisationId: string, page?: number, limit?: number): string {
    return `${this.COURSE_PREFIX}search:${tenantId}:${organisationId}:${page || 1}:${limit || 10}`;
  }

  getCourseModulesPattern(courseId: string, tenantId: string, organisationId: string): string {
    return `${this.MODULE_PREFIX}course:${courseId}:${tenantId}:${organisationId}:*`;
  }

  // Module-related methods
  getModuleKey(moduleId: string, tenantId: string, organisationId: string): string {
    return `${this.MODULE_PREFIX}${moduleId}:${tenantId}:${organisationId}`;
  }

  getModulePattern(parentId: string, tenantId: string, organisationId: string): string {
    return `${this.MODULE_PREFIX}parent:${parentId}:${tenantId}:${organisationId}:*`;
  }

  getModuleHierarchyKey(moduleId: string, tenantId: string, organisationId: string): string {
    return `${this.MODULE_PREFIX}hierarchy:${moduleId}:${tenantId}:${organisationId}`;
  }

  // Lesson-related methods
  getLessonKey(lessonId: string, tenantId: string, organisationId: string): string {
    return `${this.LESSON_PREFIX}${lessonId}:${tenantId}:${organisationId}`;
  }

  getLessonPattern(tenantId: string, organisationId?: string): string {
    return `${this.LESSON_PREFIX}list:${tenantId}:${organisationId}:*`;
  }

  getModuleLessonsPattern(moduleId: string, tenantId: string, organisationId: string): string {
    return `${this.LESSON_PREFIX}module:${moduleId}:${tenantId}:${organisationId}:*`;
  }

  // Enrollment-related methods
  getEnrollmentKey(userId: string, courseId: string, tenantId: string, organisationId: string): string {
    return `${this.ENROLLMENT_PREFIX}${userId}:${courseId}:${tenantId}:${organisationId}`;
  }

   // Enrollment-related methods
   getUserEnrollmentKey(enrollmentId: string, tenantId: string, organisationId: string): string {
    return `${this.ENROLLMENT_PREFIX}${enrollmentId}::${tenantId}:${organisationId}`;
  }

  getEnrollmentListKey(tenantId: string, organisationId: string, learnerId: string, courseId: string, page: number, limit: number): string {
    return `${this.ENROLLMENT_PREFIX}list:${tenantId}:${organisationId}:${learnerId}:${courseId}:${page}:${limit}`;
  }

  getEnrollmentPattern(tenantId: string, organisationId: string): string {
    return `${this.ENROLLMENT_PREFIX}*:${tenantId}:${organisationId}:*`;
  }
} 