export interface LmsEvent {
  type: string;
  payload: Record<string, any>;
  timestamp?: Date;
  tenantId?: string;
  organisationId?: string;
  userId?: string;
}

export enum LmsEventType {
  // Course events
  COURSE_CREATED = 'course.created',
  COURSE_UPDATED = 'course.updated',
  COURSE_DELETED = 'course.deleted',
  COURSE_COMPLETED = 'course.completed',
  COURSE_ENROLLED = 'course.enrolled',
  
  // Module events
  MODULE_CREATED = 'module.created',
  MODULE_UPDATED = 'module.updated',
  MODULE_DELETED = 'module.deleted',
  MODULE_COMPLETED = 'module.completed',
  
  // Lesson events
  LESSON_CREATED = 'lesson.created',
  LESSON_UPDATED = 'lesson.updated',
  LESSON_DELETED = 'lesson.deleted',
  LESSON_ATTEMPTED = 'lesson.attempted',
  LESSON_COMPLETED = 'lesson.completed',
  LESSON_PROGRESS_UPDATED = 'lesson.progress.updated',
  
  // Enrollment events
  ENROLLMENT_CREATED = 'enrollment.created',
  ENROLLMENT_UPDATED = 'enrollment.updated',
  ENROLLMENT_DELETED = 'enrollment.deleted',
  
  // Media events
  MEDIA_UPLOADED = 'media.uploaded',
  MEDIA_DELETED = 'media.deleted',
  
  // Tracking events
  TRACKING_STARTED = 'tracking.started',
  TRACKING_UPDATED = 'tracking.updated',
  TRACKING_COMPLETED = 'tracking.completed',
}

export interface CourseEventPayload {
  courseId: string;
  title?: string;
  status?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface LessonEventPayload {
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  title?: string;
  format?: string;
  userId?: string;
  attemptId?: string;
  score?: number;
  progress?: number;
  metadata?: Record<string, any>;
}

export interface ModuleEventPayload {
  moduleId: string;
  courseId?: string;
  title?: string;
  status?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EnrollmentEventPayload {
  enrollmentId: string;
  courseId: string;
  userId: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface MediaEventPayload {
  mediaId: string;
  lessonId?: string;
  format?: string;
  path?: string;
  metadata?: Record<string, any>;
}

export interface TrackingEventPayload {
  trackingId: string;
  type: 'course' | 'module' | 'lesson';
  userId: string;
  status?: string;
  progress?: number;
  metadata?: Record<string, any>;
} 