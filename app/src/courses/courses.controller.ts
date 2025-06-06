import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiConsumes,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { API_IDS } from '../common/constants/api-ids.constant';
import { Course } from './entities/course.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { SearchCourseDto } from './dto/search-course.dto';
import { CommonQueryDto } from '../common/dto/common-query.dto';
import { ApiId } from '../common/decorators/api-id.decorator';
import { TenantOrg } from '../common/decorators/tenant-org.decorator';
import { UploadService } from '../common/services/upload.service';
import { TransactionService } from '../common/services/transaction.service';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly uploadService: UploadService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @ApiId(API_IDS.CREATE_COURSE)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Course created successfully', 
    type: Course 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Validate file if provided
    if (file) {
      await this.uploadService.validateFile(file, { type: 'course' });
    }

    let uploadedFileUrl: string | undefined;

    try {
      return await this.transactionService.executeInTransaction(async (entityManager) => {
        // Create course first to get the courseId
        const course = await this.coursesService.create(
          createCourseDto,
          query.userId,
          tenantOrg.tenantId,
          tenantOrg.organisationId,
          entityManager,
        );

        // Upload file if provided
        if (file) {
          uploadedFileUrl = await this.uploadService.uploadFile(file, {
            type: 'course',
            courseId: course.courseId,
          });

          // Update course with the file URL
          return await this.coursesService.update(
            course.courseId,
            { image: uploadedFileUrl },
            query.userId,
            tenantOrg.tenantId,
            tenantOrg.organisationId,
            entityManager,
          );
        }

        return course;
      });
    } catch (error) {
      // If transaction fails and we uploaded a file, clean it up
      if (uploadedFileUrl) {
        try {
          await this.uploadService.deleteFile(uploadedFileUrl);
        } catch (cleanupError) {
          // Log cleanup error but throw the original error
          console.error('Failed to clean up uploaded file:', cleanupError);
        }
      }
      throw error;
    }
  }

  @Get('search')
  @ApiId(API_IDS.SEARCH_COURSES)  
  @ApiOperation({ 
    summary: 'Search and filter courses',
    description: 'Search and filter courses with various criteria including keyword search and multiple filters'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    schema: {
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/Course' }
        },
        total: { type: 'number' }
      }
    }
  })
  async searchCourses(
    @Query() searchDto: SearchCourseDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    const { page, limit, ...filters } = searchDto;
    const paginationDto = new PaginationDto();
    paginationDto.page = page;
    paginationDto.limit = limit;
    
    return this.coursesService.search(
      filters,
      paginationDto,
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
  }

  @Get(':courseId')
  @ApiId(API_IDS.GET_COURSE_BY_ID)
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiParam({ name: 'courseId', type: 'string', format: 'uuid', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course retrieved successfully', 
    type: Course 
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseById(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    const course = await this.coursesService.findOne(
      courseId,
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
    return course;
  }

  @Get(':courseId/hierarchy')
  @ApiId(API_IDS.GET_COURSE_HIERARCHY)
  @ApiOperation({ summary: 'Get course hierarchy (with modules and lessons)' })
  @ApiParam({ name: 'courseId', type: 'string', format: 'uuid', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course hierarchy retrieved successfully',
    schema: {
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        modules: { 
          type: 'array',
          items: {
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              lessons: { type: 'array', items: { $ref: '#/components/schemas/Lesson' } }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseHierarchyById(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    const courseHierarchy = await this.coursesService.findCourseHierarchy(
      courseId,
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
    return courseHierarchy;
  }

  @Get(':courseId/hierarchy/tracking/:userId')
  @ApiId(API_IDS.GET_COURSE_HIERARCHY_WITH_TRACKING)
  @ApiOperation({ summary: 'Get course hierarchy with user tracking information' })
  @ApiParam({ name: 'courseId', type: 'string', format: 'uuid', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course hierarchy with tracking retrieved successfully',
    schema: {
      properties: {
        courseId: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        progress: { type: 'number' },
        modules: { 
          type: 'array',
          items: {
            properties: {
              moduleId: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              lessons: { 
                type: 'array', 
                items: { 
                  properties: {
                    lessonId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    tracking: {
                      properties: {
                        status: { type: 'string', enum: ['started', 'in_progress', 'completed', 'failed'] },
                        progress: { type: 'number' }
                      }
                    }
                  }
                } 
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseHierarchyWithTracking(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    const courseHierarchyWithTracking = await this.coursesService.findCourseHierarchyWithTracking(
      courseId, 
      userId,
      tenantOrg.tenantId,
      tenantOrg.organisationId
      );
    return courseHierarchyWithTracking;
  }

  @Patch(':courseId')
  @ApiId(API_IDS.UPDATE_COURSE)
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'courseId', type: 'string', format: 'uuid', description: 'Course ID' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Course updated successfully', 
    type: Course 
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Validate file if provided
    if (file) {
      await this.uploadService.validateFile(file, { type: 'course' });
    }

    let uploadedFileUrl: string | undefined;
    let oldFileUrl: string | undefined;

    try {
      return await this.transactionService.executeInTransaction(async (entityManager) => {
        // Get existing course to check courseId
        const existingCourse = await this.coursesService.findOne(
          courseId,
          tenantOrg.tenantId,
          tenantOrg.organisationId
        );
        if (!existingCourse) {
          throw new BadRequestException('Course not found');
        }

        // Store old file URL for cleanup if needed
        oldFileUrl = existingCourse.image;

        // Upload file if provided
        if (file) {
          uploadedFileUrl = await this.uploadService.uploadFile(file, {
            type: 'course',
            courseId: existingCourse.courseId,
          });
        }

        // Update course with uploaded file URL
        const course = await this.coursesService.update(
          courseId,
          {
            ...updateCourseDto,
            image: uploadedFileUrl,
          },
          query.userId,
          tenantOrg.tenantId,
          tenantOrg.organisationId,
          entityManager,
        );

        // Cleanup old file if new file uploaded successfully
        if (oldFileUrl && uploadedFileUrl) {
          try {
            await this.uploadService.deleteFile(oldFileUrl);
          } catch (cleanupError) {
            console.error('Failed to clean up old file:', cleanupError);
          }
        }

        return course;
      });
    } catch (error) {
      // If transaction fails and we uploaded a new file, clean it up
      if (uploadedFileUrl) {
        try {
          await this.uploadService.deleteFile(uploadedFileUrl);
        } catch (cleanupError) {
          // Log cleanup error but throw the original error
          console.error('Failed to clean up uploaded file:', cleanupError);
        }
      }
      throw error;
    }
  }

  @Delete(':courseId')
  @ApiId(API_IDS.DELETE_COURSE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (archive) a course' })
  @ApiParam({ name: 'courseId', type: 'string', format: 'uuid', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course deleted successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async deleteCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    const result = await this.coursesService.remove(
      courseId,
      query.userId,
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
    return result;
  }
}