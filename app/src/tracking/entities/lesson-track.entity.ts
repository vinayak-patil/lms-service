import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseTrack, TrackingStatus } from './course-track.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CourseLesson } from '../../lessons/entities/course-lesson.entity';

@Entity('lesson_track')
@Index(['userId', 'lessonId', 'courseId', 'attempt'], { unique: true })
export class LessonTrack {
  @PrimaryGeneratedColumn('uuid', { name: 'lessontrackid' })
  lessonTrackId: string;

  @Column({ type: 'uuid' })
  @Index()
  lessonId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  courseId: string | null;

  @Column({ type: 'uuid', nullable: true })
  courseLessonId: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  courseTrackId: string | null;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'int', default: 1 })
  attempt: number;

  @Column({ type: 'timestamptz', nullable: true })
  startDatetime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDatetime: Date;

  @Column({ type: 'int', nullable: true, default: 0 })
  score: number;

  @Column({
    type: 'varchar',
    length: 255,
    enum: TrackingStatus,
    default: TrackingStatus.STARTED
  })
  status: TrackingStatus;

  @Column({ type: 'float', default: 0 })
  totalContent: number;

  @Column({ type: 'float', default: 0 })
  currentPosition: number;

  @Column({ type: 'int', nullable: true })
  timeSpent: number;

  @Column({ type: 'jsonb', nullable: true })
  params: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'timestamptz' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with CourseTrack
  @ManyToOne(() => CourseTrack)
  @JoinColumn({ name: 'courseTrackId', referencedColumnName: 'courseTrackId' })
  courseTrack: CourseTrack;

  // Relationship with CourseLesson
  @ManyToOne(() => CourseLesson)
  @JoinColumn({ name: 'courseLessonId', referencedColumnName: 'courseLessonId' })
  courseLesson: CourseLesson;
}