import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { API_IDS } from '../common/constants/api-ids.constant';
import { UpdateCourseTrackingDto } from './dto/update-course-tracking.dto';
import { ApiId } from 'src/common/decorators/api-id.decorator';
import { CommonQueryDto } from 'src/common/dto/common-query.dto';
import { StartLessonTrackingDto } from './dto/start-lesson-tracking.dto';
import { UpdateLessonTrackingDto } from './dto/update-lesson-tracking.dto';
import { TenantOrg } from 'src/common/decorators/tenant-org.decorator';
import { LessonStatusDto } from './dto/lesson-status.dto';
import { LessonTrack } from './entities/lesson-track.entity';

@ApiTags('Tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {
  }

  @Post('course/start/:courseId')
  @ApiId(API_IDS.START_COURSE_TRACKING)
  @ApiOperation({ summary: 'Start tracking a course' })
  @ApiBody({ type: UpdateCourseTrackingDto })
  @ApiResponse({ status: 201, description: 'Course tracking started successfully' })
  async startCourseTracking(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},
  ) {
    return this.trackingService.startCourseTracking(
      courseId, 
      query.userId, 
      tenant.tenantId, 
      tenant.organisationId
    );
  }

  @Post('course/update/:courseId')
  @ApiId(API_IDS.UPDATE_COURSE_TRACKING)
  @ApiOperation({ summary: 'Update course tracking progress' })
  @ApiBody({ type: UpdateCourseTrackingDto })
  @ApiResponse({ status: 200, description: 'Course tracking updated successfully' })
  async updateCourseTracking(
    @Body() updateCourseTrackingDto: UpdateCourseTrackingDto,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {    
    return this.trackingService.updateCourseTracking(
      updateCourseTrackingDto,
      courseId,
      query.userId,
      tenant.tenantId,
      tenant.organisationId,      
    );
  }

  @Get('course/:courseId/:userId')
  @ApiId(API_IDS.GET_COURSE_TRACKING)
  @ApiOperation({ summary: 'Get course tracking status' })
  @ApiParam({ name: 'courseId', description: 'The course ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Course tracking data retrieved successfully' })
  async getCourseTracking(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {
    return this.trackingService.getCourseTracking(
      courseId, 
      userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }


  @Post('lesson/attempt/:lessonId')
  @ApiId(API_IDS.START_LESSON_ATTEMPT)
  @ApiOperation({ summary: 'Start a new lesson attempt or get existing incomplete attempt' })
  @ApiBody({ type: StartLessonTrackingDto })
  @ApiResponse({ status: 201, description: 'Lesson attempt started or retrieved' })
  async startLessonAttempt(
    @Body() startLessonTrackingDto: StartLessonTrackingDto,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {
    return this.trackingService.startLessonAttempt(
      startLessonTrackingDto,
      lessonId,
      query.userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }

  @Get('lesson/attempt/:lessonId/:userId')
  @ApiId(API_IDS.MANAGE_LESSON_ATTEMPT)
  @ApiOperation({ summary: 'Start over or resume a lesson attempt' })
  @ApiParam({ name: 'action', enum: ['start', 'resume'], description: 'Action to perform on the attempt' })
  @ApiBody({ type: StartLessonTrackingDto })
  @ApiResponse({ status: 200, description: 'Lesson attempt managed successfully' })
  async manageLessonAttempt(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('action') action: 'start' | 'resume',
    @Body() startLessonTrackingDto: StartLessonTrackingDto,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {
    return this.trackingService.manageLessonAttempt(
      startLessonTrackingDto,
      lessonId,
      action,
      query.userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }

  @Get(':lessonId/users/:userId/status')
  @ApiId(API_IDS.GET_LESSON_STATUS)
  @ApiOperation({ summary: 'Get lesson status for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns lesson status including resume and reattempt flags',
    type: LessonStatusDto
  })
  async getLessonStatus(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},
  ): Promise<LessonStatusDto> {
    return this.trackingService.getLessonStatus(
      lessonId,
      userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }


  @Get('attempts/:attemptId/:userId')
  @ApiId(API_IDS.GET_ATTEMPT)
  @ApiOperation({ summary: 'Get attempt details' })
  @ApiResponse({
    status: 200,
    description: 'Returns attempt details',
    type: LessonTrack
  })
  async getAttempt(
    @Param('attemptId') attemptId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ): Promise<LessonTrack> {
    return this.trackingService.getAttempt(
      attemptId,
      userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }

  @Patch('attempts/:attemptId/progress')
  @ApiId(API_IDS.UPDATE_ATTEMPT_PROGRESS)
  @ApiOperation({ summary: 'Update attempt progress' })
  @ApiResponse({
    status: 200,
    description: 'Returns updated attempt details',
    type: LessonTrack
  })
  async updateProgress(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() UpdateLessonTrackingDto: UpdateLessonTrackingDto,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ): Promise<LessonTrack> {
    return this.trackingService.updateProgress(
      attemptId,
      UpdateLessonTrackingDto,
      query.userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }
}