# Database Structure Documentation

## Table: courses

| Column | Type | Description |
|--------|------|-------------|
| courseId | UUID | Primary key |
| tenantId | UUID | Tenent ID |
| title | VARCHAR | Course title |
| alias | VARCHAR | Course alias |
| shortDescription | VARCHAR | Short description of the course |
| description | TEXT | Detailed description of the course |
| image | VARCHAR | Course image path |
| featured | BOOLEAN | Whether the course is featured (default: FALSE) |
| free | BOOLEAN | Whether the course is free (default: FALSE) |
| certificateTerm | VARCHAR | Certificate term |
| certificateId | UUID | Certificate ID |
| startDatetime | TIMESTAMPTZ | Course start date and time |
| endDatetime | TIMESTAMPTZ | Course end date and time |
| adminApproval | BOOLEAN | Whether admin approval is required (default: FALSE) |
| autoEnroll | BOOLEAN | Whether auto-enrollment is enabled (default: FALSE) |
| status | VARCHAR | Course status |
| params | JSONB | Additional parameters |
| createdBy | VARCHAR | User who created the course |
| createdAt | TIMESTAMPTZ | Creation timestamp |
| updatedBy | VARCHAR | User who last updated the course |
| updatedAt | TIMESTAMPTZ | Last update timestamp |

## Table: modules

| Column | Type | Description |
|--------|------|-------------|
| moduleId | UUID | Primary key |
| parentId | UUID | Foreign key referencing modules |
| courseId | UUID | Foreign key referencing courses |
| tenantId | UUID | Tenent ID |
| title | VARCHAR | Module title |
| description | VARCHAR | Module description |
| image | VARCHAR | Module image path |
| startDatetime | TIMESTAMPTZ | Module start date and time |
| endDatetime | TIMESTAMPTZ | Module end date and time |
| ordering | INTEGER | Module order |
| status | VARCHAR | Module status |
| createdAt | TIMESTAMPTZ | Creation timestamp |
| createdBy | UUID | User who created the module |
| updatedAt | TIMESTAMPTZ | Last update timestamp |
| updatedBy | UUID | User who last updated the module |

## Table: lessons

| Column | Type | Description |
|--------|------|-------------|
| lessonId | UUID | Primary key |
| tenantId | UUID | Tenent ID |
| checkedOut | UUID | Checkout user ID |
| checkedOutTime | TIMESTAMPTZ | Checkout timestamp |
| title | VARCHAR(255) | Lesson title |
| alias | VARCHAR(255) | Lesson alias |
| status | VARCHAR(255) | Lesson status (default: 'unpublished') |
| description | TEXT | Lesson description |
| image | VARCHAR(255) | Lesson image path |
| startDatetime | TIMESTAMP | Lesson start date |
| endDatetime | TIMESTAMP | Lesson end date |
| storage | VARCHAR(50) | Storage type |
| noOfAttempts | VARCHAR(255) | Number of attempts allowed |
| attemptsGrade | VARCHAR(255) | Grade calculation method |
| format | VARCHAR(255) | Lesson format |
| mediaId | UUID | Foreign key referencing Media |
| eligibilityCriteria | VARCHAR(255) | Eligibility criteria |
| idealTime | INTEGER | Ideal completion time |
| resume | BOOLEAN | Whether lesson can be resumed (default: FALSE) |
| totalMarks | INTEGER | Total marks |
| passingMarks | INTEGER | Passing marks |
| params | JSONB | Additional parameters |
| createdAt | TIMESTAMPTZ | Creation timestamp |
| createdBy | UUID | User who created the lesson |
| updatedAt | TIMESTAMPTZ | Last update timestamp |
| updatedBy | UUID | User who last updated the lesson |

## Table: course_lessons

| Column | Type | Description |
|--------|------|-------------|
| lessonId | UUID | foreign key referencing Lessons |
| courseId | UUID | foreign key referencing Courses |
| moduleId | UUID | foreign key referencing Modules |
| tenantId | UUID | Tenent ID |
| freeLesson | BOOLEAN | Whether the lesson is free |
| considerForPassing | BOOLEAN | Should consider this lesson for course passing |
| status | VARCHAR(255) | Lesson status |
| startDatetime | TIMESTAMPTZ | Lesson start date |
| endDatetime | TIMESTAMPTZ | Lesson end date |
| noOfAttempts | VARCHAR(255) | Number of attempts allowed |
| attemptsGrade | VARCHAR(255) | Grade calculation method |
| eligibilityCriteria | VARCHAR(255) | Eligibility criteria |
| idealTime | INTEGER | Ideal completion time |
| resume | BOOLEAN | Whether lesson can be resumed (default: FALSE) |
| totalMarks | INTEGER | Total marks |
| passingMarks | INTEGER | Passing marks |
| params | JSONB | Additional parameters |
| createdAt | TIMESTAMPTZ | Creation timestamp |
| createdBy | UUID | User who created the record |
| updatedAt | TIMESTAMPTZ | Last update timestamp |
| updatedBy | UUID | User who last updated the record |

## Table: media

| Column | Type | Description |
|--------|------|-------------|
| mediaId | UUID | Primary key |
| format | VARCHAR | Media format |
| subFormat | VARCHAR | Media sub-format |
| orgFilename | VARCHAR | Original filename |
| path | VARCHAR | File path |
| storage | VARCHAR | Storage type |
| source | TEXT | Media source |
| params | JSONB | Additional parameters |
| createdAt | TIMESTAMPTZ | Creation timestamp |
| createdBy | UUID | User who created the media |
| updatedAt | TIMESTAMPTZ | Last update timestamp |
| updatedBy | UUID | User who last updated the media |

## Table: associated_files

| Column | Type | Description |
|--------|------|-------------|
| filesId | UUID | Primary key |
| lessonId | UUID | Foreign key referencing lessons |
| mediaId | UUID | Foreign key referencing media |

## Table: user_enrollments

| Column | Type | Description |
|--------|------|-------------|
| enrollemtId | UUID | Primary key |
| course_id | UUID | Foreign key referencing courses |
| tenantId | UUID | Tenent ID |
| userId | UUID | User ID |
| enrolledOnTime | TIMESTAMPTZ | Enrollment timestamp |
| endTime | TIMESTAMPTZ | Enrollment end time |
| status | VARCHAR | Enrollment status (default: 'published') |
| unlimitedPlan | BOOLEAN | Whether unlimited plan (default: FALSE) |
| beforeExpiryMail | BOOLEAN | Whether before expiry mail sent (default: FALSE) |
| afterExpiryMail | BOOLEAN | Whether after expiry mail sent (default: FALSE) |
| params | JSONB | Additional parameters |
| enrolledBy | UUID | User who enrolled |
| enrolledAt | TIMESTAMPTZ | Enrollment timestamp |

## Table: course_track

| Column | Type | Description |
|--------|------|-------------|
| courseTrackId | UUID | Primary key |
| courseId | UUID | Foreign key referencing courses |
| userId | UUID | User ID |
| startDatetime | TIMESTAMPTZ | Tracking start time |
| endDatetime | TIMESTAMPTZ | Tracking end time |
| noOfLessons | INTEGER | Total number of lessons (default: 0) |
| completedLessons | INTEGER | Number of completed lessons (default: 0) |
| status | VARCHAR(40) | Course status (default: 'incomplete') |
| lastAccessedDate | TIMESTAMPTZ | Last accessed date |
| certGenDate | TIMESTAMPTZ | Certificate generation date |

## Table: lesson_track

| Column | Type | Description |
|--------|------|-------------|
| lessonTrackId | UUID | Primary key |
| lessonId | UUID | Foreign key referencing lessons |
| userId | UUID | User ID |
| attempt | INTEGER | Attempt number (default: 1) |
| startDatetime | TIMESTAMPTZ | Tracking start time |
| endDatetime | TIMESTAMPTZ | Tracking end time |
| score | INTEGER | Lesson score (default: 0) |
| status | VARCHAR(255) | Lesson status (default: 'started') |
| totalContent | FLOAT | Total content length (default: 0) |
| currentPosition | FLOAT | Current position (default: 0) |
| timeSpent | INTEGER | Time spent on lesson |
| updatedBy | UUID | User who last updated |
| updatedAt | TIMESTAMPTZ | Last update timestamp | 