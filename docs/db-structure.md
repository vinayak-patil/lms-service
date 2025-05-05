# Database Structure Documentation

## Table: courses

| Column | Type | Description |
|--------|------|-------------|
| courseId | UUID | Primary key |
| tenentId | UUID | Tenent ID |
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
| courseId | UUID | Foreign key referencing courses |
| tenentId | UUID | Tenent ID |
| title | VARCHAR | Module title |
| description | VARCHAR | Module description |
| image | VARCHAR | Module image path |
| ordering | INTEGER | Module order |
| status | VARCHAR | Module status |
| createdAt | TIMESTAMPTZ | Creation timestamp |
| createdBy | UUID | User who created the module |
| updatedAt | TIMESTAMPTZ | Last update timestamp |
| updatedBy | UUID | User who last updated the module |

## Table: Lessons

| Column | Type | Description |
|--------|------|-------------|
| lessonId | UUID | Primary key |
| tenentId | UUID | Tenent ID |
| checkedOut | UUID | Checkout user ID |
| checkedOutTime | TIMESTAMPTZ | Checkout timestamp |
| title | VARCHAR(255) | Lesson title |
| alias | VARCHAR(255) | Lesson alias |
| status | VARCHAR(255) | Lesson status (default: 'unpublished') |
| description | TEXT | Lesson description |
| image | VARCHAR(255) | Lesson image path |
| startDate | TIMESTAMP | Lesson start date |
| endDate | TIMESTAMP | Lesson end date |
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

## Table: CourseLessons

| Column | Type | Description |
|--------|------|-------------|
| lessonId | UUID | Part of composite primary key, foreign key referencing Lessons |
| courseId | UUID | Part of composite primary key, foreign key referencing Courses |
| moduleId | UUID | Part of composite primary key, foreign key referencing Modules |
| tenentId | UUID | Tenent ID |
| freeLesson | BOOLEAN | Whether the lesson is free |
| considerForPassing | BOOLEAN | Whether lesson counts towards passing |
| status | VARCHAR(255) | Lesson status |
| startDate | TIMESTAMP | Lesson start date |
| endDate | TIMESTAMP | Lesson end date |
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
| id | UUID | Primary key |
| format | VARCHAR | Media format |
| sub_format | VARCHAR | Media sub-format |
| org_filename | VARCHAR | Original filename |
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
| id | SERIAL | Primary key |
| lesson_id | UUID | Foreign key referencing lessons |
| media_id | UUID | Foreign key referencing media |

## Table: user_enrollments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| course_id | UUID | Foreign key referencing courses |
| tenentId | UUID | Tenent ID |
| user_id | UUID | User ID |
| enrolled_on_time | TIMESTAMPTZ | Enrollment timestamp |
| end_time | TIMESTAMPTZ | Enrollment end time |
| state | INTEGER | Enrollment state (default: 0) |
| unlimited_plan | BOOLEAN | Whether unlimited plan (default: FALSE) |
| before_expiry_mail | BOOLEAN | Whether before expiry mail sent (default: FALSE) |
| after_expiry_mail | BOOLEAN | Whether after expiry mail sent (default: FALSE) |
| params | JSONB | Additional parameters |
| enrolled_by | UUID | User who enrolled |
| enrolled_at | TIMESTAMPTZ | Enrollment timestamp |

## Table: track_course

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| course_id | UUID | Foreign key referencing courses |
| user_id | UUID | User ID |
| timestart | TIMESTAMPTZ | Tracking start time |
| timeend | TIMESTAMPTZ | Tracking end time |
| no_of_lessons | INTEGER | Total number of lessons (default: 0) |
| completed_lessons | INTEGER | Number of completed lessons (default: 0) |
| status | VARCHAR(40) | Course status (default: 'incomplete') |
| last_accessed_date | TIMESTAMPTZ | Last accessed date |
| cert_gen_date | TIMESTAMPTZ | Certificate generation date |

## Table: track_lesson

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| lesson_id | UUID | Foreign key referencing lessons |
| user_id | UUID | User ID |
| attempt | INTEGER | Attempt number (default: 1) |
| timestart | TIMESTAMPTZ | Tracking start time |
| timeend | TIMESTAMPTZ | Tracking end time |
| score | INTEGER | Lesson score (default: 0) |
| status | VARCHAR(255) | Lesson status (default: 'started') |
| total_content | FLOAT | Total content length (default: 0) |
| current_position | FLOAT | Current position (default: 0) |
| time_spent | INTEGER | Time spent on lesson |
| updatedBy | UUID | User who last updated |
| updatedAt | TIMESTAMPTZ | Last update timestamp | 