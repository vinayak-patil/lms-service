import { ApiProperty } from '@nestjs/swagger';

export class RequiredCourseDto {
  @ApiProperty({ 
    description: 'Course ID of the required prerequisite course',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  courseId: string;

  @ApiProperty({ 
    description: 'Title of the required prerequisite course',
    example: 'Introduction to Programming'
  })
  title: string;

  @ApiProperty({ 
    description: 'Whether the user has completed this prerequisite course',
    example: true
  })
  completed: boolean;
}

export class CoursePrerequisitesDto {
  @ApiProperty({ 
    description: 'List of required prerequisite courses',
    type: [RequiredCourseDto]
  })
  requiredCourses: RequiredCourseDto[];

  @ApiProperty({ 
    description: 'Whether the user is eligible to access this course based on prerequisite completion',
    example: true
  })
  isEligible: boolean;
} 