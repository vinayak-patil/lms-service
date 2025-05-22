/**
 * RBAC Action Constants
 * 
 * This file defines all the possible action permissions that can be
 * granted to users in the system. These permissions are stored in
 * the JWT token's 'actions' array and checked by the RbacGuard.
 * 
 * The format follows the pattern: 'resource:action'
 * For example: 'course:create', 'lesson:update', etc.
 */

export const ACTIONS = {
  // Course actions
  CREATE_COURSE: 'course:create',
  UPDATE_COURSE: 'course:update',
  DELETE_COURSE: 'course:delete',
  VIEW_COURSE: 'course:view',
  LIST_COURSES: 'course:list',
  
  // Module actions
  CREATE_MODULE: 'module:create',
  UPDATE_MODULE: 'module:update',
  DELETE_MODULE: 'module:delete',
  VIEW_MODULE: 'module:view',
  LIST_MODULES: 'module:list',
  
  // Lesson actions
  CREATE_LESSON: 'lesson:create',
  UPDATE_LESSON: 'lesson:update',
  DELETE_LESSON: 'lesson:delete',
  VIEW_LESSON: 'lesson:view',
  LIST_LESSONS: 'lesson:list',
  
  // Media actions
  UPLOAD_MEDIA: 'media:upload',
  DELETE_MEDIA: 'media:delete',
  VIEW_MEDIA: 'media:view',
  LIST_MEDIA: 'media:list',
  
  // Enrollment actions
  CREATE_ENROLLMENT: 'enrollment:create',
  UPDATE_ENROLLMENT: 'enrollment:update',
  CANCEL_ENROLLMENT: 'enrollment:cancel',
  VIEW_ENROLLMENT: 'enrollment:view',
  LIST_ENROLLMENTS: 'enrollment:list',
  
  // Progress tracking actions
  UPDATE_TRACKING: 'tracking:update',
  VIEW_TRACKING: 'tracking:view',
  
  // User actions (for future implementation)
  MANAGE_USERS: 'user:manage',
  VIEW_USERS: 'user:view',
  
  // Organization actions (for future implementation)
  MANAGE_ORGANIZATION: 'organization:manage',
  VIEW_ORGANIZATION: 'organization:view',
};

/**
 * Predefined permission sets for common user roles
 * 
 * These can be used when creating new tokens to quickly
 * assign the appropriate permissions based on role.
 */
export const ROLE_PERMISSIONS = {
  ADMIN: [
    '*', // Admin has all permissions
  ],
  
  TEACHER: [
    // Course permissions
    ACTIONS.CREATE_COURSE,
    ACTIONS.UPDATE_COURSE,
    ACTIONS.VIEW_COURSE,
    ACTIONS.LIST_COURSES,
    
    // Module permissions
    ACTIONS.CREATE_MODULE,
    ACTIONS.UPDATE_MODULE,
    ACTIONS.DELETE_MODULE,
    ACTIONS.VIEW_MODULE,
    ACTIONS.LIST_MODULES,
    
    // Lesson permissions
    ACTIONS.CREATE_LESSON,
    ACTIONS.UPDATE_LESSON,
    ACTIONS.DELETE_LESSON,
    ACTIONS.VIEW_LESSON,
    ACTIONS.LIST_LESSONS,
    
    // Media permissions
    ACTIONS.UPLOAD_MEDIA,
    ACTIONS.DELETE_MEDIA,
    ACTIONS.VIEW_MEDIA,
    ACTIONS.LIST_MEDIA,
    
    // Enrollment permissions
    ACTIONS.VIEW_ENROLLMENT,
    ACTIONS.LIST_ENROLLMENTS,
    
    // Tracking permissions
    ACTIONS.VIEW_TRACKING,
  ],
  
  STUDENT: [
    // Course permissions (limited)
    ACTIONS.VIEW_COURSE,
    ACTIONS.LIST_COURSES,
    
    // Module permissions (limited)
    ACTIONS.VIEW_MODULE,
    
    // Lesson permissions (limited)
    ACTIONS.VIEW_LESSON,
    
    // Media permissions (limited)
    ACTIONS.VIEW_MEDIA,
    
    // Enrollment permissions
    ACTIONS.CREATE_ENROLLMENT,
    ACTIONS.CANCEL_ENROLLMENT,
    ACTIONS.VIEW_ENROLLMENT,
    
    // Tracking permissions
    ACTIONS.UPDATE_TRACKING,
    ACTIONS.VIEW_TRACKING,
  ],
};