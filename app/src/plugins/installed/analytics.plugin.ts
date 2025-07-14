import { EventEmitter2 } from '@nestjs/event-emitter';
import { AbstractPlugin } from '../../plugins/base.plugin';
import { LmsEventType } from '../../events/lms.events';

export default class AnalyticsPlugin extends AbstractPlugin {
  name = 'AnalyticsPlugin';
  version = '1.0.0';
  description = 'Tracks user engagement and learning analytics';

  private analyticsData: Map<string, any> = new Map();

  register(eventEmitter: EventEmitter2): void {
    // Track lesson completion analytics
    eventEmitter.on(LmsEventType.LESSON_COMPLETED, async (payload: any) => {
      await this.trackLessonCompletion(payload);
    });

    // Track course completion analytics
    eventEmitter.on(LmsEventType.COURSE_COMPLETED, async (payload: any) => {
      await this.trackCourseCompletion(payload);
    });

    // Track lesson attempts
    eventEmitter.on(LmsEventType.LESSON_ATTEMPTED, async (payload: any) => {
      await this.trackLessonAttempt(payload);
    });

    // Track progress updates
    eventEmitter.on(LmsEventType.LESSON_PROGRESS_UPDATED, async (payload: any) => {
      await this.trackProgressUpdate(payload);
    });

    // Track enrollments
    eventEmitter.on(LmsEventType.ENROLLMENT_CREATED, async (payload: any) => {
      await this.trackEnrollment(payload);
    });

    this.log('Analytics plugin registered successfully');
  }

  private async trackLessonCompletion(payload: any): Promise<void> {
    const key = `lesson_completion_${payload.lessonId}`;
    const data = this.analyticsData.get(key) || {
      lessonId: payload.lessonId,
      completions: 0,
      averageScore: 0,
      totalScore: 0,
      users: new Set(),
    };

    data.completions++;
    data.users.add(payload.userId);
    data.totalScore += payload.score || 0;
    data.averageScore = data.totalScore / data.completions;

    this.analyticsData.set(key, data);
    this.log(`Lesson completion tracked: ${payload.lessonId}`, {
      completions: data.completions,
      averageScore: data.averageScore,
      uniqueUsers: data.users.size,
    });
  }

  private async trackCourseCompletion(payload: any): Promise<void> {
    const key = `course_completion_${payload.courseId}`;
    const data = this.analyticsData.get(key) || {
      courseId: payload.courseId,
      completions: 0,
      averageFinalScore: 0,
      totalFinalScore: 0,
      users: new Set(),
    };

    data.completions++;
    data.users.add(payload.userId);
    data.totalFinalScore += payload.finalScore || 0;
    data.averageFinalScore = data.totalFinalScore / data.completions;

    this.analyticsData.set(key, data);
    this.log(`Course completion tracked: ${payload.courseId}`, {
      completions: data.completions,
      averageFinalScore: data.averageFinalScore,
      uniqueUsers: data.users.size,
    });
  }

  private async trackLessonAttempt(payload: any): Promise<void> {
    const key = `lesson_attempts_${payload.lessonId}`;
    const data = this.analyticsData.get(key) || {
      lessonId: payload.lessonId,
      totalAttempts: 0,
      uniqueUsers: new Set(),
      attemptsByUser: new Map(),
    };

    data.totalAttempts++;
    data.uniqueUsers.add(payload.userId);
    
    const userAttempts = data.attemptsByUser.get(payload.userId) || 0;
    data.attemptsByUser.set(payload.userId, userAttempts + 1);

    this.analyticsData.set(key, data);
    this.log(`Lesson attempt tracked: ${payload.lessonId}`, {
      totalAttempts: data.totalAttempts,
      uniqueUsers: data.uniqueUsers.size,
      userAttempts: userAttempts + 1,
    });
  }

  private async trackProgressUpdate(payload: any): Promise<void> {
    const key = `progress_${payload.lessonId}_${payload.userId}`;
    const data = this.analyticsData.get(key) || {
      lessonId: payload.lessonId,
      userId: payload.userId,
      progressHistory: [],
      lastUpdated: null,
    };

    data.progressHistory.push({
      progress: payload.progress,
      timestamp: new Date(),
    });
    data.lastUpdated = new Date();

    this.analyticsData.set(key, data);
    this.log(`Progress update tracked: ${payload.lessonId}`, {
      userId: payload.userId,
      progress: payload.progress,
      historyLength: data.progressHistory.length,
    });
  }

  private async trackEnrollment(payload: any): Promise<void> {
    const key = `enrollment_${payload.courseId}`;
    const data = this.analyticsData.get(key) || {
      courseId: payload.courseId,
      enrollments: 0,
      users: new Set(),
    };

    data.enrollments++;
    data.users.add(payload.userId);

    this.analyticsData.set(key, data);
    this.log(`Enrollment tracked: ${payload.courseId}`, {
      enrollments: data.enrollments,
      uniqueUsers: data.users.size,
    });
  }

  // Method to get analytics data (could be exposed via API)
  getAnalyticsData(): Map<string, any> {
    return this.analyticsData;
  }

  unregister(eventEmitter: EventEmitter2): void {
    eventEmitter.removeAllListeners(LmsEventType.LESSON_COMPLETED);
    eventEmitter.removeAllListeners(LmsEventType.COURSE_COMPLETED);
    eventEmitter.removeAllListeners(LmsEventType.LESSON_ATTEMPTED);
    eventEmitter.removeAllListeners(LmsEventType.LESSON_PROGRESS_UPDATED);
    eventEmitter.removeAllListeners(LmsEventType.ENROLLMENT_CREATED);
    this.log('Analytics plugin unregistered');
  }
} 