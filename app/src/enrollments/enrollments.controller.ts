import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { API_IDS } from '../common/constants/api-ids.constant';
import { UserEnrollment, EnrollmentStatus } from './entities/user-enrollment.entity';
import { CommonQueryDto } from '../common/dto/common-query.dto';
import { ApiId } from '../common/decorators/api-id.decorator';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiId(API_IDS.ENROLL_USER)
  @ApiOperation({ summary: 'Enroll user for a course' })
  @ApiResponse({ 
    status: 201, 
    description: 'User enrolled successfully',
    type: UserEnrollment 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiBody({ type: CreateEnrollmentDto })
  async enrollUser(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Query() query: CommonQueryDto,
  ) {
    return this.enrollmentsService.enroll(
      createEnrollmentDto,
      query.userId,
      query.tenantId,
      query.organisationId
    );
  }

  @Get()
  @ApiId(API_IDS.GET_USER_ENROLLMENTS)
  @ApiOperation({ summary: 'Get user enrollments by courseId' })
  @ApiResponse({ 
    status: 200, 
    description: 'Enrollments retrieved successfully',
    schema: {
      properties: {
        count: { type: 'number' },
        enrollments: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserEnrollment' }
        }
      }
    }
  })
  @ApiQuery({ name: 'learnerId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'courseId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: EnrollmentStatus,
    description: 'Filter by enrollment status'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserEnrollments(
    @Query() paginationDto: PaginationDto,
    @Query() query: CommonQueryDto,
    @Query('learnerId') learnerId?: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: EnrollmentStatus,
  ) {
    return this.enrollmentsService.findAll(
      paginationDto,      
      learnerId,
      courseId,
      status,
      query.userId,
      query.tenantId,
      query.organisationId
    );
  }

  @Get(':enrollmentId')
  @ApiId(API_IDS.GET_ENROLLMENT_BY_ID)
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Enrollment retrieved successfully',
    type: UserEnrollment 
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiParam({ 
    name: 'enrollmentId', 
    type: String, 
    format: 'uuid',
    description: 'Enrollment ID'
  })
  async getEnrollmentById(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Query() query: CommonQueryDto,
  ) {
    return this.enrollmentsService.findOne(
      enrollmentId,
      query.tenantId,
      query.organisationId
    );
  }

  @Put(':enrollmentId')
  @ApiId(API_IDS.UPDATE_ENROLLMENT)
  @ApiOperation({ summary: 'Update enrollment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Enrollment updated successfully',
    type: UserEnrollment 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiParam({ 
    name: 'enrollmentId', 
    type: String, 
    format: 'uuid',
    description: 'Enrollment ID'
  })
  @ApiBody({ type: UpdateEnrollmentDto })
  async updateEnrollment(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @Query() query: CommonQueryDto,
  ) {
    return this.enrollmentsService.update(
      enrollmentId,
      updateEnrollmentDto,
      query.tenantId,
      query.organisationId
    );
  }

  @Delete(':enrollmentId')
  @ApiId(API_IDS.CANCEL_ENROLLMENT)
  @ApiOperation({ summary: 'Cancel enrollment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Enrollment cancelled successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiParam({ 
    name: 'enrollmentId', 
    type: String, 
    format: 'uuid',
    description: 'Enrollment ID'
  })
  async cancelEnrollment(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Query() query: CommonQueryDto,
  ) {
    return this.enrollmentsService.cancel(
      enrollmentId,
      query.tenantId,
      query.organisationId
    );
  }
}
