import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Headers,
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
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateCourseTrackingDto } from './dto/update-course-tracking.dto';
import { ApiId } from 'src/common/decorators/api-id.decorator';
import { CommonQueryDto } from 'src/common/dto/common-query.dto';
import { StartLessonTrackingDto } from './dto/start-lesson-tracking.dto';
import { UpdateLessonTrackingDto } from './dto/update-lesson-tracking.dto';
import { TenantOrg } from 'src/common/decorators/tenant-org.decorator';
import { LessonStatusDto } from './dto/lesson-status.dto';
import { LessonTrack } from './entities/lesson-track.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';

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

  @Post('lesson/update/:lessonId')
  @ApiId(API_IDS.TRACK_LESSON)
  @ApiOperation({ summary: 'Track lesson progress' })
  @ApiBody({ type: UpdateLessonTrackingDto })
  @ApiResponse({ status: 200, description: 'Lesson tracking updated successfully' })
  async trackLesson(
    @Body() trackingDto: UpdateLessonTrackingDto,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {
    return this.trackingService.trackLesson(
      trackingDto,
      lessonId,
      query.userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }

  @Post('lesson/complete/:lessonId')
  @ApiId(API_IDS.COMPLETE_LESSON_TRACKING)
  @ApiOperation({ summary: 'Mark a lesson as completed' })
  @ApiBody({ type: UpdateLessonTrackingDto })
  @ApiResponse({ status: 200, description: 'Lesson marked as completed successfully' })
  async completeLessonTracking(
    @Body() updateLessonTrackingDto: UpdateLessonTrackingDto,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {
    return this.trackingService.completeLessonTracking(
      updateLessonTrackingDto,
      lessonId,
      query.userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }

  @Get('lesson/:lessonId/:userId')
  @ApiId(API_IDS.GET_LESSON_TRACKING)
  @ApiOperation({ summary: 'Get lesson tracking status' })
  @ApiParam({ name: 'lessonId', description: 'The lesson ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson tracking data retrieved successfully' })
  async getLessonTracking(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query('courseId') courseId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {
    return this.trackingService.getLessonTracking(
      lessonId, 
      userId, 
      courseId,
      tenant.tenantId,
      tenant.organisationId
    );
  }

  @Get('lesson/:lessonId/users/:userId/status')
  @ApiId(API_IDS.GET_LESSON_TRACKING_HISTORY)
  @ApiOperation({ summary: 'Get lesson tracking history' })
  @ApiParam({ name: 'lessonId', description: 'The lesson ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson tracking history retrieved successfully' })
  async getLessonTrackingHistory(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},  
  ) {
    return this.trackingService.getLessonTrackingHistory(
      lessonId,
      userId,
      courseId,      
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
  @ApiOperation({ summary: 'Get lesson status for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns lesson status including resume and reattempt flags',
    type: LessonStatusDto
  })
  async getLessonStatus(
    @Param('lessonId') lessonId: string,
    @Param('userId') userId: string,
    @TenantOrg() tenant: {tenantId: string, organisationId: string},
  ): Promise<LessonStatusDto> {
    return this.trackingService.getLessonStatus(
      lessonId,
      userId,
      tenant.tenantId,
      tenant.organisationId
    );
  }

  @Post(':lessonId/users/:userId/attempts')
  @ApiOperation({ summary: 'Start a new lesson attempt' })
  @ApiResponse({
    status: 201,
    description: 'Returns the new attempt details',
    type: LessonTrack
  })
  async startNewAttempt(
    @Param('lessonId') lessonId: string,
    @Param('userId') userId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-organisation-id') organisationId: string
  ): Promise<LessonTrack> {
    return this.trackingService.startNewAttempt(
      lessonId,
      userId,
      tenantId,
      organisationId
    );
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get attempt details' })
  @ApiResponse({
    status: 200,
    description: 'Returns attempt details',
    type: LessonTrack
  })
  async getAttempt(
    @Param('attemptId') attemptId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-organisation-id') organisationId: string
  ): Promise<LessonTrack> {
    return this.trackingService.resumeAttempt(
      attemptId,
      userId,
      tenantId,
      organisationId
    );
  }

  @Post('attempts/:attemptId/reset')
  @ApiOperation({ summary: 'Reset an attempt' })
  @ApiResponse({
    status: 200,
    description: 'Returns the reset attempt details',
    type: LessonTrack
  })
  async resetAttempt(
    @Param('attemptId') attemptId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-organisation-id') organisationId: string
  ): Promise<LessonTrack> {
    return this.trackingService.resetAttempt(
      attemptId,
      userId,
      tenantId,
      organisationId
    );
  }

  @Patch('attempts/:attemptId/progress')
  @ApiOperation({ summary: 'Update attempt progress' })
  @ApiResponse({
    status: 200,
    description: 'Returns updated attempt details',
    type: LessonTrack
  })
  async updateProgress(
    @Param('attemptId') attemptId: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Headers('x-user-id') userId: string
  ): Promise<LessonTrack> {
    return this.trackingService.updateProgress(
      attemptId,
      updateProgressDto,
      userId
    );
  }
}