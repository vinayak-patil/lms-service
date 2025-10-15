import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull, Not, In } from 'typeorm';
import { CourseTrack, TrackingStatus } from './entities/course-track.entity';
import { LessonTrack } from './entities/lesson-track.entity';
import { ModuleTrack, ModuleTrackStatus } from './entities/module-track.entity';
import { Lesson, LessonStatus, AttemptsGradeMethod } from '../lessons/entities/lesson.entity';
import { UserEnrollment, EnrollmentStatus } from '../enrollments/entities/user-enrollment.entity';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';

export type ProgressChangeType = 'create' | 'update' | 'delete';

export interface ContentChangeInfo {
  isContentChange: boolean;
  changeDetails?: {
    mediaIdChanged?: boolean;
    formatChanged?: boolean;
    subFormatChanged?: boolean;
    sourceChanged?: boolean;
  };
}

export interface ProgressCalculationResult {
  completed: number;
  total: number;
  progressPercentage: number;
}

@Injectable()
export class ProgressRecalculationService {
  private readonly logger = new Logger(ProgressRecalculationService.name);

  constructor(
    @InjectRepository(CourseTrack)
    private readonly courseTrackRepository: Repository<CourseTrack>,
    @InjectRepository(LessonTrack)
    private readonly lessonTrackRepository: Repository<LessonTrack>,
    @InjectRepository(ModuleTrack)
    private readonly moduleTrackRepository: Repository<ModuleTrack>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(UserEnrollment)
    private readonly userEnrollmentRepository: Repository<UserEnrollment>,
  ) {}

  /**
   * Recalculate progress for all enrolled users in a course (optimized for all scales)
   */
  async recalculateCourseProgress(
    courseId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Starting progress recalculation for course ${courseId}`, {
        courseId,
        tenantId,
        organisationId,
      });

      // Get total enrolled users count first
      const totalEnrollments = await this.userEnrollmentRepository.count({
        where: {
          courseId,
          tenantId,
          organisationId,
          status: EnrollmentStatus.PUBLISHED,
        },
      });

      this.logger.log(`Found ${totalEnrollments} enrolled users for course ${courseId}`);

      // Use single query approach for all courses (most efficient)
      await this.recalculateCourseProgressSingleQuery(
        courseId,
        tenantId,
        organisationId,
        totalEnrollments,
      );

      this.logger.log(`Completed progress recalculation for course ${courseId}`);
    } catch (error) {
      this.logger.error(`Failed to recalculate progress for course ${courseId}`, {
        courseId,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException(
        `Failed to recalculate progress for course: ${error.message}`,
      );
    }
  }

  /**
   * Single query progress recalculation for all courses (most efficient)
   * Handles all grading methods: FIRST_ATTEMPT, LAST_ATTEMPT, HIGHEST, AVERAGE
   */
  private async recalculateCourseProgressSingleQuery(
    courseId: string,
    tenantId: string,
    organisationId: string,
    totalEnrollments: number,
  ): Promise<void> {
    this.logger.log(`Using single query optimization for ${totalEnrollments} users`);

    try {
      // Step 1: Get course structure and lessons
      const courseStructure = await this.getCourseStructureForSingleQuery(courseId, tenantId, organisationId);
      
      if (courseStructure.lessons.length === 0) {
        this.logger.warn(`No lessons found for course ${courseId}, skipping progress recalculation`);
        return;
      }

      // Step 2: Calculate course progress for all users in single query
      const courseProgressResults = await this.calculateCourseProgressSingleQuery(
        courseId,
        tenantId,
        organisationId,
        courseStructure,
      );

      // Step 3: Calculate module progress for all users in single query
      const moduleProgressResults = await this.calculateModuleProgressSingleQuery(
        courseId,
        tenantId,
        organisationId,
        courseStructure,
      );

      // Step 4: Batch update course tracks
      await this.batchUpdateCourseTracksSingleQuery(courseProgressResults, courseId, tenantId, organisationId);

      // Step 5: Batch update module tracks
      await this.batchUpdateModuleTracksSingleQuery(moduleProgressResults, tenantId, organisationId);

      this.logger.log(`Successfully updated progress for ${courseProgressResults.length} users`);

    } catch (error) {
      this.logger.error(`Failed single query progress recalculation for course ${courseId}`, {
        courseId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get course structure optimized for single query processing
   */
  private async getCourseStructureForSingleQuery(
    courseId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<{
    totalLessons: number;
    lessons: Array<{
      lessonId: string;
      moduleId: string | null;
      attemptsGrade: AttemptsGradeMethod;
    }>;
    modules: Array<{ moduleId: string }>;
  }> {
    // Get all lessons that count for passing
    const lessons = await this.lessonRepository.find({
      where: {
        courseId,
        tenantId,
        organisationId,
        considerForPassing: true,
        status: LessonStatus.PUBLISHED,
        parentId: IsNull(),
      },
      select: ['lessonId', 'moduleId', 'attemptsGrade'],
    });

    // Get all modules for this course
    const modules = await this.lessonRepository
      .createQueryBuilder('lesson')
      .select('DISTINCT lesson.moduleId')
      .where('lesson.courseId = :courseId', { courseId })
      .andWhere('lesson.tenantId = :tenantId', { tenantId })
      .andWhere('lesson.organisationId = :organisationId', { organisationId })
      .andWhere('lesson.moduleId IS NOT NULL')
      .getRawMany();

    return {
      totalLessons: lessons.length,
      lessons,
      modules,
    };
  }

  /**
   * Calculate course progress for all users using single query
   */
  private async calculateCourseProgressSingleQuery(
    courseId: string,
    tenantId: string,
    organisationId: string,
    courseStructure: {
      totalLessons: number;
      lessons: Array<{ lessonId: string; moduleId: string | null; attemptsGrade: AttemptsGradeMethod }>;
    },
  ): Promise<Array<{
    userId: string;
    completedLessons: number;
    totalLessons: number;
    progressPercentage: number;
  }>> {
    // Build dynamic SQL based on grading methods
    const lessonConditions = courseStructure.lessons.map((lesson, index) => {
      const lessonAlias = `l${index}`;
      const trackAlias = `t${index}`;
      
      let completionCondition = '';
      switch (lesson.attemptsGrade) {
        case AttemptsGradeMethod.FIRST_ATTEMPT:
          completionCondition = `EXISTS (
            SELECT 1 FROM lesson_track ${trackAlias} 
            WHERE ${trackAlias}."lessonId" = '${lesson.lessonId}' 
              AND ${trackAlias}."userId" = ue."userId" 
              AND ${trackAlias}."courseId" = '${courseId}'
              AND ${trackAlias}."tenantId" = '${tenantId}'
              AND ${trackAlias}."organisationId" = '${organisationId}'
              AND ${trackAlias}."attempt" = 1 
              AND ${trackAlias}."status" = 'completed'
          )`;
          break;
        case AttemptsGradeMethod.LAST_ATTEMPT:
          completionCondition = `EXISTS (
            SELECT 1 FROM lesson_track ${trackAlias} 
            WHERE ${trackAlias}."lessonId" = '${lesson.lessonId}' 
              AND ${trackAlias}."userId" = ue."userId" 
              AND ${trackAlias}."courseId" = '${courseId}'
              AND ${trackAlias}."tenantId" = '${tenantId}'
              AND ${trackAlias}."organisationId" = '${organisationId}'
              AND ${trackAlias}."status" = 'completed'
              AND ${trackAlias}."attempt" = (
                SELECT MAX(attempt) FROM lesson_track lt2 
                WHERE lt2."lessonId" = '${lesson.lessonId}' 
                  AND lt2."userId" = ue."userId" 
                  AND lt2."courseId" = '${courseId}'
                  AND lt2."tenantId" = '${tenantId}'
                  AND lt2."organisationId" = '${organisationId}'
                  AND lt2."status" = 'completed'
              )
          )`;
          break;
        case AttemptsGradeMethod.HIGHEST:
        case AttemptsGradeMethod.AVERAGE:
        default:
          // For HIGHEST and AVERAGE, any completed attempt counts
          completionCondition = `EXISTS (
            SELECT 1 FROM lesson_track ${trackAlias} 
            WHERE ${trackAlias}."lessonId" = '${lesson.lessonId}' 
              AND ${trackAlias}."userId" = ue."userId" 
              AND ${trackAlias}."courseId" = '${courseId}'
              AND ${trackAlias}."tenantId" = '${tenantId}'
              AND ${trackAlias}."organisationId" = '${organisationId}'
              AND ${trackAlias}."status" = 'completed'
          )`;
          break;
      }
      
      return `CASE WHEN ${completionCondition} THEN 1 ELSE 0 END`;
    }).join(' + ');

    const sql = `
      SELECT 
        ue."userId",
        ${courseStructure.totalLessons} as totalLessons,
        (${lessonConditions}) as completedLessons,
        CASE 
          WHEN ${courseStructure.totalLessons} > 0 
          THEN ROUND(((${lessonConditions}) * 100.0 / ${courseStructure.totalLessons}), 0)
          ELSE 0 
        END as progressPercentage
      FROM user_enrollments ue
      WHERE ue."courseId" = '${courseId}'
        AND ue."tenantId" = '${tenantId}'
        AND ue."organisationId" = '${organisationId}'
        AND ue."status" = 'PUBLISHED'
      ORDER BY ue."userId"
    `;

    const results = await this.userEnrollmentRepository.query(sql);
    
    return results.map((row: any) => ({
      userId: row.userId,
      completedLessons: parseInt(row.completedLessons) || 0,
      totalLessons: parseInt(row.totalLessons) || 0,
      progressPercentage: parseInt(row.progressPercentage) || 0,
    }));
  }

  /**
   * Calculate module progress for all users using single query
   */
  private async calculateModuleProgressSingleQuery(
    courseId: string,
    tenantId: string,
    organisationId: string,
    courseStructure: {
      lessons: Array<{ lessonId: string; moduleId: string | null; attemptsGrade: AttemptsGradeMethod }>;
      modules: Array<{ moduleId: string }>;
    },
  ): Promise<Array<{
    userId: string;
    moduleId: string;
    completedLessons: number;
    totalLessons: number;
    progressPercentage: number;
  }>> {
    const moduleProgressResults: Array<{
      userId: string;
      moduleId: string;
      completedLessons: number;
      totalLessons: number;
      progressPercentage: number;
    }> = [];

    // Process each module separately
    for (const module of courseStructure.modules) {
      if (!module.moduleId) continue;

      const moduleLessons = courseStructure.lessons.filter(lesson => lesson.moduleId === module.moduleId);
      
      if (moduleLessons.length === 0) continue;

      // Build completion conditions for this module
      const moduleLessonConditions = moduleLessons.map((lesson, index) => {
        const trackAlias = `t${index}`;
        
        let completionCondition = '';
        switch (lesson.attemptsGrade) {
          case AttemptsGradeMethod.FIRST_ATTEMPT:
            completionCondition = `EXISTS (
              SELECT 1 FROM lesson_track ${trackAlias} 
              WHERE ${trackAlias}."lessonId" = '${lesson.lessonId}' 
                AND ${trackAlias}."userId" = ue."userId" 
                AND ${trackAlias}."courseId" = '${courseId}'
                AND ${trackAlias}."tenantId" = '${tenantId}'
                AND ${trackAlias}."organisationId" = '${organisationId}'
                AND ${trackAlias}."attempt" = 1 
                AND ${trackAlias}."status" = 'completed'
            )`;
            break;
          case AttemptsGradeMethod.LAST_ATTEMPT:
            completionCondition = `EXISTS (
              SELECT 1 FROM lesson_track ${trackAlias} 
              WHERE ${trackAlias}."lessonId" = '${lesson.lessonId}' 
                AND ${trackAlias}."userId" = ue."userId" 
                AND ${trackAlias}."courseId" = '${courseId}'
                AND ${trackAlias}."tenantId" = '${tenantId}'
                AND ${trackAlias}."organisationId" = '${organisationId}'
                AND ${trackAlias}."status" = 'completed'
                AND ${trackAlias}."attempt" = (
                  SELECT MAX(attempt) FROM lesson_track lt2 
                  WHERE lt2."lessonId" = '${lesson.lessonId}' 
                    AND lt2."userId" = ue."userId" 
                    AND lt2."courseId" = '${courseId}'
                    AND lt2."tenantId" = '${tenantId}'
                    AND lt2."organisationId" = '${organisationId}'
                    AND lt2."status" = 'completed'
                )
            )`;
            break;
          case AttemptsGradeMethod.HIGHEST:
          case AttemptsGradeMethod.AVERAGE:
          default:
            completionCondition = `EXISTS (
              SELECT 1 FROM lesson_track ${trackAlias} 
              WHERE ${trackAlias}."lessonId" = '${lesson.lessonId}' 
                AND ${trackAlias}."userId" = ue."userId" 
                AND ${trackAlias}."courseId" = '${courseId}'
                AND ${trackAlias}."tenantId" = '${tenantId}'
                AND ${trackAlias}."organisationId" = '${organisationId}'
                AND ${trackAlias}."status" = 'completed'
            )`;
            break;
        }
        
        return `CASE WHEN ${completionCondition} THEN 1 ELSE 0 END`;
      }).join(' + ');

      const moduleSql = `
        SELECT 
          ue."userId",
          '${module.moduleId}' as moduleId,
          ${moduleLessons.length} as totalLessons,
          (${moduleLessonConditions}) as completedLessons,
          CASE 
            WHEN ${moduleLessons.length} > 0 
            THEN ROUND(((${moduleLessonConditions}) * 100.0 / ${moduleLessons.length}), 0)
            ELSE 0 
          END as progressPercentage
        FROM user_enrollments ue
        WHERE ue."courseId" = '${courseId}'
          AND ue."tenantId" = '${tenantId}'
          AND ue."organisationId" = '${organisationId}'
          AND ue."status" = 'PUBLISHED'
        ORDER BY ue."userId"
      `;

      const moduleResults = await this.userEnrollmentRepository.query(moduleSql);
      
      moduleProgressResults.push(...moduleResults.map((row: any) => ({
        userId: row.userId,
        moduleId: row.moduleId,
        completedLessons: parseInt(row.completedLessons) || 0,
        totalLessons: parseInt(row.totalLessons) || 0,
        progressPercentage: parseInt(row.progressPercentage) || 0,
      })));
    }

    return moduleProgressResults;
  }

  /**
   * Batch update course tracks using single query
   * Enhanced version that handles grading methods properly
   */
  private async batchUpdateCourseTracksSingleQuery(
    courseProgressResults: Array<{
      userId: string;
      completedLessons: number;
      totalLessons: number;
      progressPercentage: number;
    }>,
    courseId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<void> {
    if (courseProgressResults.length === 0) return;

    // Use your enhanced approach with proper grading method handling
    const updateSql = `
      UPDATE course_track ct
      SET 
        "noOfLessons" = (
          SELECT COUNT(l."lessonId")
          FROM lessons l
          WHERE l."courseId" = ct."courseId"
            AND l."tenantId" = ct."tenantId"
            AND l."organisationId" = ct."organisationId"
            AND l."status" = 'published'
            AND l."considerForPassing" = true
        ),
        "completedLessons" = (
          SELECT COUNT(DISTINCT l."lessonId")
          FROM lessons l
          WHERE l."courseId" = ct."courseId"
            AND l."tenantId" = ct."tenantId"
            AND l."organisationId" = ct."organisationId"
            AND l."status" = 'published'
            AND l."considerForPassing" = true
            AND EXISTS (
              SELECT 1
              FROM lesson_track lt
              WHERE lt."lessonId" = l."lessonId"
                AND lt."userId" = ct."userId"
                AND lt."tenantId" = ct."tenantId"
                AND lt."organisationId" = ct."organisationId"
                AND lt."status" = 'completed'
                AND (
                  l."attemptsGrade" = 'HIGHEST' OR
                  l."attemptsGrade" = 'AVERAGE' OR
                  (l."attemptsGrade" = 'FIRST_ATTEMPT' AND lt."attempt" = 1) OR
                  (l."attemptsGrade" = 'LAST_ATTEMPT' AND lt."attempt" = (
                    SELECT MAX(lt2."attempt")
                    FROM lesson_track lt2
                    WHERE lt2."lessonId" = l."lessonId"
                      AND lt2."userId" = ct."userId"
                      AND lt2."tenantId" = ct."tenantId"
                      AND lt2."organisationId" = ct."organisationId"
                      AND lt2."status" = 'completed'
                  ))
                )
            )
        ),
        status = CASE 
          WHEN "completedLessons" >= "noOfLessons" AND "noOfLessons" > 0 THEN 'completed'
          WHEN "completedLessons" > 0 THEN 'incomplete'
          ELSE 'not_started'
        END,
        "lastAccessedDate" = NOW()
      WHERE ct."courseId" = '${courseId}'
        AND ct."tenantId" = '${tenantId}'
        AND ct."organisationId" = '${organisationId}'
    `;

    await this.courseTrackRepository.query(updateSql);
  }

  /**
   * Batch update module tracks using single query
   * Enhanced version that handles grading methods properly
   */
  private async batchUpdateModuleTracksSingleQuery(
    moduleProgressResults: Array<{
      userId: string;
      moduleId: string;
      completedLessons: number;
      totalLessons: number;
      progressPercentage: number;
    }>,
    tenantId: string,
    organisationId: string,
  ): Promise<void> {
    if (moduleProgressResults.length === 0) return;

    // Use your enhanced approach with proper grading method handling
    const updateSql = `
      UPDATE module_track mt
      SET 
        "totalLessons" = (
          SELECT COUNT(l."lessonId")
          FROM lessons l
          WHERE l."moduleId" = mt."moduleId"
            AND l."tenantId" = mt."tenantId"
            AND l."organisationId" = mt."organisationId"
            AND l."status" = 'published'
            AND l."considerForPassing" = true
        ),
        "completedLessons" = (
          SELECT COUNT(DISTINCT l."lessonId")
          FROM lessons l
          WHERE l."moduleId" = mt."moduleId"
            AND l."tenantId" = mt."tenantId"
            AND l."organisationId" = mt."organisationId"
            AND l."status" = 'published'
            AND l."considerForPassing" = true
            AND EXISTS (
              SELECT 1
              FROM lesson_track lt
              WHERE lt."lessonId" = l."lessonId"
                AND lt."userId" = mt."userId"
                AND lt."tenantId" = mt."tenantId"
                AND lt."organisationId" = mt."organisationId"
                AND lt."status" = 'completed'
                AND (
                  l."attemptsGrade" = 'HIGHEST' OR
                  l."attemptsGrade" = 'AVERAGE' OR
                  (l."attemptsGrade" = 'FIRST_ATTEMPT' AND lt."attempt" = 1) OR
                  (l."attemptsGrade" = 'LAST_ATTEMPT' AND lt."attempt" = (
                    SELECT MAX(lt2."attempt")
                    FROM lesson_track lt2
                    WHERE lt2."lessonId" = l."lessonId"
                      AND lt2."userId" = mt."userId"
                      AND lt2."tenantId" = mt."tenantId"
                      AND lt2."organisationId" = mt."organisationId"
                      AND lt2."status" = 'completed'
                  ))
                )
            )
        ),
        status = CASE 
          WHEN "completedLessons" >= "totalLessons" AND "totalLessons" > 0 THEN 'completed'
          ELSE 'incomplete'
        END,
        progress = CASE 
          WHEN "totalLessons" > 0 THEN ROUND(("completedLessons" * 100.0 / "totalLessons"), 0)
          ELSE 0
        END,
        "badgeGenDate" = CASE 
          WHEN "completedLessons" >= "totalLessons" AND "totalLessons" > 0 THEN NOW()
          ELSE "badgeGenDate"
        END
      WHERE mt."tenantId" = '${tenantId}'
        AND mt."organisationId" = '${organisationId}'
        AND mt."moduleId" IN (
          SELECT DISTINCT m."moduleId"
          FROM modules m
          WHERE m."courseId" IN (
            SELECT DISTINCT ct."courseId"
            FROM course_track ct
            WHERE ct."tenantId" = '${tenantId}'
              AND ct."organisationId" = '${organisationId}'
          )
        )
    `;

    await this.moduleTrackRepository.query(updateSql);
  }

  /**
   * Recalculate progress for a specific user in a course
   */
  async recalculateUserProgress(
    courseId: string,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<void> {
    try {
      // Calculate course progress
      const courseProgress = await this.calculateCourseProgress(
        courseId,
        userId,
        tenantId,
        organisationId,
      );

      // Update course track
      await this.updateCourseTrack(courseId, userId, tenantId, organisationId, courseProgress);

      // Update module tracks
      await this.updateModuleTracks(courseId, userId, tenantId, organisationId);

      this.logger.debug(`Updated progress for user ${userId} in course ${courseId}`, {
        courseId,
        userId,
        completed: courseProgress.completed,
        total: courseProgress.total,
        progressPercentage: courseProgress.progressPercentage,
      });
    } catch (error) {
      this.logger.error(`Failed to recalculate progress for user ${userId} in course ${courseId}`, {
        courseId,
        userId,
        error: error.message,
        stack: error.stack,
      });
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Recalculate progress for all users when lesson structure changes
   */
  async recalculateProgressForLessonChange(
    lessonId: string,
    changeType: ProgressChangeType,
    tenantId: string,
    organisationId: string,
    contentChangeInfo?: ContentChangeInfo,
  ): Promise<void> {
    try {
      this.logger.log(`Processing lesson change: ${changeType} for lesson ${lessonId}`, {
        lessonId,
        changeType,
        tenantId,
        organisationId,
      });

      // Get the lesson to find its course
      const lesson = await this.lessonRepository.findOne({
        where: {
          lessonId,
          tenantId,
          organisationId,
        },
      });

      if (!lesson) {
        this.logger.warn(`Lesson ${lessonId} not found for progress recalculation`);
        return;
      }

      if (!lesson.courseId) {
        this.logger.debug(`Lesson ${lessonId} is not part of a course, skipping progress recalculation`);
        return;
      }

        // Check if this is a content change that requires clearing lesson tracking
        const shouldClearTracking = contentChangeInfo?.isContentChange || this.isContentChange(changeType);
        
        if (shouldClearTracking) {
          await this.clearLessonTrackingForContentChange(lessonId, tenantId, organisationId);
          
          // Log detailed content change information
          if (contentChangeInfo?.changeDetails) {
            this.logger.log(`Content change details for lesson ${lessonId}`, {
              lessonId,
              changeDetails: contentChangeInfo.changeDetails,
              tenantId,
              organisationId,
            });
          }
        }
        
        await this.recalculateCourseProgress(lesson.courseId, tenantId, organisationId);
     
    } catch (error) {
      this.logger.error(`Failed to process lesson change for ${lessonId}`, {
        lessonId,
        changeType,
        error: error.message,
        stack: error.stack,
      });
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Calculate course progress for a specific user
   */
  private async calculateCourseProgress(
    courseId: string,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<ProgressCalculationResult> {
    // Get total lessons that count for passing
    const totalLessons = await this.lessonRepository.count({
      where: {
        courseId,
        tenantId,
        organisationId,
        considerForPassing: true,
        status: LessonStatus.PUBLISHED,
        parentId: IsNull(), // Only parent lessons
      },
    });

    // Get completed lessons based on attemptsGrade method
    const completedLessons = await this.calculateCompletedLessonsBasedOnAttemptsGrade(
      courseId,
      userId,
      tenantId,
      organisationId,
    );

    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      completed: completedLessons,
      total: totalLessons,
      progressPercentage,
    };
  }

  /**
   * Calculate completed lessons based on attemptsGrade method
   */
  private async calculateCompletedLessonsBasedOnAttemptsGrade(
    courseId: string,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<number> {
    // Get all lessons that count for passing
    const lessons = await this.lessonRepository.find({
      where: {
        courseId,
        tenantId,
        organisationId,
        considerForPassing: true,
        status: LessonStatus.PUBLISHED,
        parentId: IsNull(),
      },
    });

    let completedCount = 0;

    for (const lesson of lessons) {
      const isCompleted = await this.isLessonCompletedForUser(
        lesson,
        userId,
        tenantId,
        organisationId,
      );
      if (isCompleted) {
        completedCount++;
      }
    }

    return completedCount;
  }

  /**
   * Check if a lesson is completed for a specific user based on attemptsGrade method
   */
  private async isLessonCompletedForUser(
    lesson: Lesson,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<boolean> {
    const lessonTracks = await this.lessonTrackRepository.find({
      where: {
        lessonId: lesson.lessonId,
        userId,
        courseId: lesson.courseId,
        tenantId,
        organisationId,
      },
      order: { attempt: 'ASC' },
    });

    if (lessonTracks.length === 0) {
      return false;
    }

    // Check if any attempt is completed
    const hasCompletedAttempt = lessonTracks.some(
      track => track.status === TrackingStatus.COMPLETED,
    );

    if (!hasCompletedAttempt) {
      return false;
    }

    // Apply attemptsGrade method
    switch (lesson.attemptsGrade) {
      case AttemptsGradeMethod.FIRST_ATTEMPT:
        return lessonTracks[0]?.status === TrackingStatus.COMPLETED;
      case AttemptsGradeMethod.LAST_ATTEMPT:
        // Find the last completed attempt (not just the last attempt overall)
        const completedAttempts = lessonTracks.filter(track => track.status === TrackingStatus.COMPLETED);
        if (completedAttempts.length === 0) return false;
        
        // Get the most recent completed attempt
        const lastCompletedAttempt = completedAttempts[completedAttempts.length - 1];
        return lastCompletedAttempt.status === TrackingStatus.COMPLETED;
      case AttemptsGradeMethod.HIGHEST:
        return lessonTracks.some(track => track.status === TrackingStatus.COMPLETED);
      case AttemptsGradeMethod.AVERAGE:
        // For average, we consider completed if any attempt is completed
        // The actual average calculation would be done elsewhere
        return lessonTracks.some(track => track.status === TrackingStatus.COMPLETED);
      default:
        return lessonTracks.some(track => track.status === TrackingStatus.COMPLETED);
    }
  }

  /**
   * Update course track with new progress
   */
  private async updateCourseTrack(
    courseId: string,
    userId: string,
    tenantId: string,
    organisationId: string,
    progress: ProgressCalculationResult,
  ): Promise<void> {
    let courseTrack = await this.courseTrackRepository.findOne({
      where: {
        courseId,
        userId,
        tenantId,
        organisationId,
      },
    });

    if (!courseTrack) {
      this.logger.warn(`Course track not found for user ${userId} in course ${courseId}`);
      return;
    }

    // Update course track
    courseTrack.completedLessons = progress.completed;
    courseTrack.noOfLessons = progress.total;
    courseTrack.lastAccessedDate = new Date();

    // Update status based on completion
    if (progress.completed >= progress.total && progress.total > 0) {
      courseTrack.status = TrackingStatus.COMPLETED;
      courseTrack.endDatetime = new Date();
    } else if (progress.completed > 0) {
      courseTrack.status = TrackingStatus.INCOMPLETE;
    } else {
      courseTrack.status = TrackingStatus.NOT_STARTED;
    }

    await this.courseTrackRepository.save(courseTrack);
  }

  /**
   * Update module tracks for a user
   */
  private async updateModuleTracks(
    courseId: string,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<void> {
    // Get all modules for this course
    const modules = await this.lessonRepository
      .createQueryBuilder('lesson')
      .select('DISTINCT lesson.moduleId')
      .where('lesson.courseId = :courseId', { courseId })
      .andWhere('lesson.tenantId = :tenantId', { tenantId })
      .andWhere('lesson.organisationId = :organisationId', { organisationId })
      .andWhere('lesson.moduleId IS NOT NULL')
      .getRawMany();

    for (const module of modules) {
      if (!module.moduleId) continue;

      await this.updateModuleTrack(
        module.moduleId,
        userId,
        tenantId,
        organisationId,
      );
    }
  }

  /**
   * Update a specific module track
   */
  private async updateModuleTrack(
    moduleId: string,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<void> {
    // Get total lessons in module
    const totalLessons = await this.lessonRepository.count({
      where: {
        moduleId,
        tenantId,
        organisationId,
        considerForPassing: true,
        status: LessonStatus.PUBLISHED,
        parentId: IsNull(),
      },
    });

    // Get completed lessons in module
    const completedLessons = await this.calculateCompletedLessonsForModule(
      moduleId,
      userId,
      tenantId,
      organisationId,
    );

    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update or create module track
    let moduleTrack = await this.moduleTrackRepository.findOne({
      where: {
        moduleId,
        userId,
        tenantId,
        organisationId,
      },
    });

    if (!moduleTrack) {
      moduleTrack = this.moduleTrackRepository.create({
        moduleId,
        userId,
        tenantId,
        organisationId,
        status: ModuleTrackStatus.INCOMPLETE,
      });
    }

    moduleTrack.completedLessons = completedLessons;
    moduleTrack.totalLessons = totalLessons;
    moduleTrack.progress = progressPercentage;

    if (completedLessons >= totalLessons && totalLessons > 0) {
      moduleTrack.status = ModuleTrackStatus.COMPLETED;
      moduleTrack.badgeGenDate = new Date();
    } else if (completedLessons > 0) {
      moduleTrack.status = ModuleTrackStatus.INCOMPLETE;
    } else {
      moduleTrack.status = ModuleTrackStatus.INCOMPLETE;
    }

    await this.moduleTrackRepository.save(moduleTrack);
  }

  /**
   * Calculate completed lessons for a specific module
   */
  private async calculateCompletedLessonsForModule(
    moduleId: string,
    userId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<number> {
    const lessons = await this.lessonRepository.find({
      where: {
        moduleId,
        tenantId,
        organisationId,
        considerForPassing: true,
        status: LessonStatus.PUBLISHED,
        parentId: IsNull(),
      },
    });

    let completedCount = 0;

    for (const lesson of lessons) {
      const isCompleted = await this.isLessonCompletedForUser(
        lesson,
        userId,
        tenantId,
        organisationId,
      );
      if (isCompleted) {
        completedCount++;
      }
    }

    return completedCount;
  }

  /**
   * Determine if progress recalculation is needed for a lesson change
   */
  private shouldRecalculateForLesson(lesson: Lesson, changeType: ProgressChangeType): boolean {
    // Always recalculate for deletions if the lesson was considered for passing
    if (changeType === 'delete') {
      return lesson.considerForPassing;
    }

    // For create/update, only recalculate if lesson is considered for passing and published
    return lesson.considerForPassing && lesson.status === LessonStatus.PUBLISHED;
  }

  /**
   * Determine if the change type represents a content change that requires clearing lesson tracking
   */
  private isContentChange(changeType: ProgressChangeType): boolean {
    // Content changes include media updates (URL changes, document updates)
    // For now, we'll treat all 'update' operations as potential content changes
    // This can be refined based on specific field changes
    return changeType === 'update';
  }

  /**
   * Clear lesson tracking data when content changes (URL, document, etc.)
   * This ensures learners start fresh with the new content
   */
  private async clearLessonTrackingForContentChange(
    lessonId: string,
    tenantId: string,
    organisationId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Clearing lesson tracking for content change: ${lessonId}`, {
        lessonId,
        tenantId,
        organisationId,
      });

      // Get all lesson tracks for this lesson
      const lessonTracks = await this.lessonTrackRepository.find({
        where: {
          lessonId,
          tenantId,
          organisationId,
        },
      });

      if (lessonTracks.length === 0) {
        this.logger.debug(`No lesson tracks found for lesson ${lessonId}`);
        return;
      }

      // Delete all lesson tracking records for this lesson
      await this.lessonTrackRepository.delete({
        lessonId,
        tenantId,
        organisationId,
      });

      this.logger.log(`Cleared ${lessonTracks.length} lesson tracking records for lesson ${lessonId}`, {
        lessonId,
        clearedCount: lessonTracks.length,
        tenantId,
        organisationId,
      });

      // Log affected users for audit purposes
      const affectedUserIds = [...new Set(lessonTracks.map(track => track.userId))];
      this.logger.log(`Content change affected ${affectedUserIds.length} users for lesson ${lessonId}`, {
        lessonId,
        affectedUserIds,
        tenantId,
        organisationId,
      });

    } catch (error) {
      this.logger.error(`Failed to clear lesson tracking for content change: ${lessonId}`, {
        lessonId,
        error: error.message,
        stack: error.stack,
        tenantId,
        organisationId,
      });
      // Don't throw error to avoid breaking the main operation
    }
  }
}
