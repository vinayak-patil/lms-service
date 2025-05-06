# LMS Service API Documentation 📚

## Table of Contents 📑

1. [Courses](#courses)
   - [Create Course](#create-course)
   - [Get All Courses](#get-all-courses)
   - [Get Course by ID](#get-course-by-id)
   - [Get Course Details with Modules and Lessons](#get-course-details-with-modules-and-lessons)
   - [Update Course](#update-course)
   - [Delete Course](#delete-course)

2. [Modules](#modules)
   - [Create Module](#create-module)
   - [Get Module by ID](#get-module-by-id)
   - [Get Modules by Course ID](#get-modules-by-course-id)
   - [Get Submodules by Parent Module ID](#get-submodules-by-parent-module-id)
   - [Update Module](#update-module)
   - [Delete Module](#delete-module)

3. [Lessons](#lessons)
   - [Create Lesson](#create-lesson)
   - [Add Lesson to Course/Module](#add-lesson-to-coursemodule)
   - [Get Lesson by ID](#get-lesson-by-id)
   - [Get Lessons by Course ID](#get-lessons-by-course-id)
   - [Get Lessons by Module ID](#get-lessons-by-module-id)
   - [Update Lesson](#update-lesson)
   - [Delete Lesson](#delete-lesson)
   - [Remove Lesson from Course/Module](#remove-lesson-from-coursemodule)

4. [Media Management](#media-management)
   - [Upload Media](#upload-media)
   - [Get Media by ID](#get-media-by-id)
   - [Associate Media with Lesson](#associate-media-with-lesson)
   - [Delete Media](#delete-media)

5. [User Enrollment](#user-enrollment)
   - [Enroll User in Course](#enroll-user-in-course)
   - [Get User Enrollments](#get-user-enrollments)
   - [Get Enrollment by ID](#get-enrollment-by-id)
   - [Update Enrollment](#update-enrollment)
   - [Cancel Enrollment](#cancel-enrollment)

6. [Course Tracking](#course-tracking)
   - [Start Course Tracking](#start-course-tracking)
   - [Update Course Tracking](#update-course-tracking)
   - [Complete Course Tracking](#complete-course-tracking)
   - [Get Course Tracking](#get-course-tracking)

7. [Lesson Tracking](#lesson-tracking)
   - [Start Lesson Tracking](#start-lesson-tracking)
   - [Update Lesson Tracking](#update-lesson-tracking)
   - [Complete Lesson Tracking](#complete-lesson-tracking)
   - [Get Lesson Tracking](#get-lesson-tracking)
   - [Get User's Lesson Tracking History](#get-users-lesson-tracking-history)

8. [Error Handling](#error-handling)

## API Endpoints

### Courses

#### Create Course

- **Endpoint**: `POST /api/courses`
- **HTTP Method**: POST
- **Authentication**: Required (Admin, Instructor roles)
- **Content-Type**: `multipart/form-data`
- **Request Parameters**:

- `title` (form): Course title
- `alias` (form): Course alias/URL slug
- `shortDescription` (form): Short description of the course
- `description` (form): Detailed description of the course
- `image` (form): Course image file
- `featured` (form): Whether the course is featured (true/false)
- `free` (form): Whether the course is free (true/false)
- `certificateTerm` (form): Certificate terms
- `certificateId` (form): Certificate ID
- `startDatetime` (form): Course start date and time
- `endDatetime` (form): Course end date and time
- `adminApproval` (form): Whether admin approval is required (true/false)
- `autoEnroll` (form): Whether auto-enrollment is enabled (true/false)
- `status` (form): Course status
- `params` (form): Additional parameters as JSON string


- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.course.create",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "courseId": "course-uuid-123",
    "tenentId": "tenant-uuid-123",
    "title": "Introduction to Machine Learning",
    "alias": "intro-ml",
    "shortDescription": "Learn the basics of machine learning",
    "description": "Comprehensive introduction to machine learning concepts and algorithms",
    "image": null,
    "featured": false,
    "free": true,
    "certificateTerm": "PASS_ALL",
    "certificateId": "cert-uuid-123",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "adminApproval": false,
    "autoEnroll": true,
    "status": "published",
    "params": {
      "difficulty": "beginner",
      "estimatedHours": 20
    },
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z",
    "updatedBy": null,
    "updatedAt": null
  }
}
```


- Error (400 Bad Request):

```json
{
  "id": "api.course.create",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "failed",
    "err": "INVALID_REQUEST",
    "errmsg": "Title is required"
  },
  "responseCode": 400,
  "result": null
}
```







#### Get All Courses

- **Endpoint**: `GET /api/courses`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `status` (optional): Filter by course status (published, unpublished, draft)
- `featured` (optional): Filter featured courses (true/false)
- `free` (optional): Filter free courses (true/false)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.list",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "count": 2,
    "courses": [
      {
        "courseId": "course-uuid-123",
        "title": "Introduction to Machine Learning",
        "shortDescription": "Learn the basics of machine learning",
        "image": "path/to/image.jpg",
        "featured": false,
        "free": true,
        "status": "published",
        "startDatetime": "2024-06-01T00:00:00Z",
        "endDatetime": "2024-12-31T23:59:59Z"
      },
      {
        "courseId": "course-uuid-456",
        "title": "Advanced Data Science",
        "shortDescription": "Master data science techniques",
        "image": "path/to/image2.jpg",
        "featured": true,
        "free": false,
        "status": "published",
        "startDatetime": "2024-06-15T00:00:00Z",
        "endDatetime": "2025-06-15T23:59:59Z"
      }
    ]
  }
}
```







#### Get Course by ID

- **Endpoint**: `GET /api/courses/{courseId}`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.get",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "courseId": "course-uuid-123",
    "tenentId": "tenant-uuid-123",
    "title": "Introduction to Machine Learning",
    "alias": "intro-ml",
    "shortDescription": "Learn the basics of machine learning",
    "description": "Comprehensive introduction to machine learning concepts and algorithms",
    "image": "path/to/image.jpg",
    "featured": false,
    "free": true,
    "certificateTerm": "PASS_ALL",
    "certificateId": "cert-uuid-123",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "adminApproval": false,
    "autoEnroll": true,
    "status": "published",
    "params": {
      "difficulty": "beginner",
      "estimatedHours": 20
    },
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z",
    "updatedBy": null,
    "updatedAt": null
  }
}
```


- Error (404 Not Found):

```json
{
  "id": "api.course.get",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "failed",
    "err": "RESOURCE_NOT_FOUND",
    "errmsg": "Course not found"
  },
  "responseCode": 404,
  "result": null
}
```







#### Get Course Details with Modules and Lessons

- **Endpoint**: `GET /api/courses/{courseId}/details`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.details",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "courseId": "course-uuid-123",
    "title": "Introduction to Machine Learning",
    "shortDescription": "Learn the basics of machine learning",
    "description": "Comprehensive introduction to machine learning concepts and algorithms",
    "image": "path/to/image.jpg",
    "featured": false,
    "free": true,
    "certificateTerm": "PASS_ALL",
    "certificateId": "cert-uuid-123",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "status": "published",
    "modules": [
      {
        "moduleId": "module-uuid-123",
        "title": "Fundamentals of ML",
        "description": "Basic concepts and terminology",
        "ordering": 1,
        "image": "path/to/module-image.jpg",
        "status": "published",
        "subModules": [
          {
            "moduleId": "module-uuid-456",
            "parentId": "module-uuid-123",
            "title": "Introduction to Algorithms",
            "description": "Overview of ML algorithms",
            "ordering": 1,
            "status": "published",
            "lessons": [
              {
                "lessonId": "lesson-uuid-123",
                "title": "Classification Algorithms",
                "description": "Learn about classification algorithms",
                "format": "video",
                "status": "published",
                "totalMarks": 100,
                "passingMarks": 60,
                "mediaContent": {
                  "format": "video",
                  "subFormat": "video.youtube.url",
                  "source": "https://youtube.com/watch?v=example"
                }
              }
            ]
          }
        ],
        "lessons": [
          {
            "lessonId": "lesson-uuid-789",
            "title": "What is Machine Learning?",
            "description": "Introduction to machine learning concepts",
            "format": "video",
            "status": "published",
            "totalMarks": 0,
            "passingMarks": 0,
            "mediaContent": {
              "format": "video",
              "subFormat": "video.youtube.url",
              "source": "https://youtube.com/watch?v=example2"
            }
          }
        ]
      }
    ]
  }
}
```







#### Update Course

- **Endpoint**: `PUT /api/courses/{courseId}`
- **HTTP Method**: PUT
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `courseId` (path): UUID of the course



- **Request Body**:

```json
{
  "title": "Updated Machine Learning Course",
  "shortDescription": "Updated description",
  "description": "Comprehensive updated course content",
  "featured": true,
  "free": false,
  "status": "published",
  "startDatetime": "2024-07-01T00:00:00Z",
  "endDatetime": "2025-01-31T23:59:59Z"
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.update",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "courseId": "course-uuid-123",
    "title": "Updated Machine Learning Course",
    "shortDescription": "Updated description",
    "description": "Comprehensive updated course content",
    "image": "path/to/image.jpg",
    "featured": true,
    "free": false,
    "certificateTerm": "PASS_ALL",
    "certificateId": "cert-uuid-123",
    "startDatetime": "2024-07-01T00:00:00Z",
    "endDatetime": "2025-01-31T23:59:59Z",
    "adminApproval": false,
    "autoEnroll": true,
    "status": "published",
    "updatedBy": "user-uuid-456",
    "updatedAt": "2024-05-06T14:24:02Z"
  }
}
```







#### Delete Course

- **Endpoint**: `DELETE /api/courses/{courseId}`
- **HTTP Method**: DELETE
- **Authentication**: Required (Admin role)
- **Request Parameters**:

- `courseId` (path): UUID of the course



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.delete",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "message": "Course deleted successfully"
  }
}
```







### Modules

#### Create Module

- **Endpoint**: `POST /api/modules`
- **HTTP Method**: POST
- **Authentication**: Required (Admin, Instructor roles)
- **Content-Type**: `multipart/form-data`

- **Request Body**:
- `courseId` (form): UUID of the course
- `parentId` (form): UUID of the parent module (optional)
- `title` (form): Module title
- `description` (form): Module description
- `image` (form): Module image file
- `startDatetime` (form): Module start date and time
- `endDatetime` (form): Module end date and time
- `ordering` (form): Module ordering number
- `status` (form): Module status



- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.module.create",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "moduleId": "module-uuid-789",
    "courseId": "course-uuid-123",
    "parentId": null,
    "tenentId": "tenant-uuid-123",
    "title": "Introduction to Neural Networks",
    "description": "Learn about neural network architecture and applications",
    "image": "path/to/saved/image.jpg",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "ordering": 2,
    "status": "published",
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z",
    "updatedBy": null,
    "updatedAt": null
  }
}
```







#### Get Module by ID

- **Endpoint**: `GET /api/modules/{moduleId}`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `moduleId` (path): UUID of the module



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.module.get",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "moduleId": "module-uuid-789",
    "courseId": "course-uuid-123",
    "parentId": null,
    "tenentId": "tenant-uuid-123",
    "title": "Introduction to Neural Networks",
    "description": "Learn about neural network architecture and applications",
    "image": "path/to/saved/image.jpg",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "ordering": 2,
    "status": "published",
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z",
    "updatedBy": null,
    "updatedAt": null
  }
}
```







#### Get Modules by Course ID

- **Endpoint**: `GET /api/courses/{courseId}/modules`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course
- `includeSubmodules` (query, optional): Whether to include submodules (default: false)



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.modules",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "modules": [
      {
        "moduleId": "module-uuid-123",
        "courseId": "course-uuid-123",
        "parentId": null,
        "title": "Fundamentals of ML",
        "description": "Basic concepts and terminology",
        "image": "path/to/module-image.jpg",
        "ordering": 1,
        "status": "published",
        "startDatetime": "2024-06-01T00:00:00Z",
        "endDatetime": "2024-12-31T23:59:59Z",
        "subModules": [
          {
            "moduleId": "module-uuid-456",
            "courseId": "course-uuid-123",
            "parentId": "module-uuid-123",
            "title": "Introduction to Algorithms",
            "description": "Overview of ML algorithms",
            "ordering": 1,
            "status": "published",
            "startDatetime": "2024-06-01T00:00:00Z",
            "endDatetime": "2024-12-31T23:59:59Z"
          }
        ]
      },
      {
        "moduleId": "module-uuid-789",
        "courseId": "course-uuid-123",
        "parentId": null,
        "title": "Introduction to Neural Networks",
        "description": "Learn about neural network architecture and applications",
        "image": "path/to/saved/image.jpg",
        "ordering": 2,
        "status": "published",
        "startDatetime": "2024-06-01T00:00:00Z",
        "endDatetime": "2024-12-31T23:59:59Z",
        "subModules": []
      }
    ]
  }
}
```







#### Get Submodules by Parent Module ID

- **Endpoint**: `GET /api/modules/{moduleId}/submodules`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `moduleId` (path): UUID of the parent module



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.module.submodules",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "subModules": [
      {
        "moduleId": "module-uuid-456",
        "courseId": "course-uuid-123",
        "parentId": "module-uuid-123",
        "title": "Introduction to Algorithms",
        "description": "Overview of ML algorithms",
        "ordering": 1,
        "status": "published",
        "startDatetime": "2024-06-01T00:00:00Z",
        "endDatetime": "2024-12-31T23:59:59Z"
      }
    ]
  }
}
```







#### Update Module

- **Endpoint**: `PUT /api/modules/{moduleId}`
- **HTTP Method**: PUT
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `moduleId` (path): UUID of the module



- **Request Body**:

```json
{
  "title": "Updated Neural Networks Module",
  "description": "Updated description for neural networks",
  "image": "base64-encoded-image-data",
  "ordering": 3,
  "status": "published",
  "startDatetime": "2024-07-01T00:00:00Z",
  "endDatetime": "2025-01-31T23:59:59Z"
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.module.update",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "moduleId": "module-uuid-789",
    "courseId": "course-uuid-123",
    "parentId": null,
    "title": "Updated Neural Networks Module",
    "description": "Updated description for neural networks",
    "image": "path/to/updated/image.jpg",
    "ordering": 3,
    "status": "published",
    "startDatetime": "2024-07-01T00:00:00Z",
    "endDatetime": "2025-01-31T23:59:59Z",
    "updatedBy": "user-uuid-456",
    "updatedAt": "2024-05-06T14:24:02Z"
  }
}
```







#### Delete Module

- **Endpoint**: `DELETE /api/modules/{moduleId}`
- **HTTP Method**: DELETE
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `moduleId` (path): UUID of the module



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.module.delete",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "message": "Module deleted successfully"
  }
}
```







### Lessons

#### Create Lesson

- **Endpoint**: `POST /api/lessons`
- **HTTP Method**: POST
- **Authentication**: Required (Admin, Instructor roles)
- **Content-Type**: `multipart/form-data`
- **Request Body**:

- `title` (form): Lesson title
- `alias` (form): Lesson alias/URL slug
- `description` (form): Lesson description
- `image` (form): Lesson image file
- `startDatetime` (form): Lesson start date and time
- `endDatetime` (form): Lesson end date and time
- `storage` (form): Storage type
- `noOfAttempts` (form): Number of allowed attempts
- `attemptsGrade` (form): Grade calculation method
- `format` (form): Lesson format
- `eligibilityCriteria` (form): Eligibility criteria
- `idealTime` (form): Ideal time to complete
- `resume` (form): Whether lesson can be resumed
- `totalMarks` (form): Total marks
- `passingMarks` (form): Passing marks
- `status` (form): Lesson status
- `mediaContent` (form): JSON string in format:
```json
{
  "format": "video",
  "subFormat": "video.youtube.url",
  "source": "https://youtube.com/watch?v=example",
  "params": {}
}
```

- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.lesson.create",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "lessonId": "lesson-uuid-123",
    "tenentId": "tenant-uuid-123",
    "title": "Introduction to Backpropagation",
    "alias": "intro-backprop",
    "description": "Learn how neural networks learn through backpropagation",
    "image": "path/to/saved/image.jpg",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "storage": "local",
    "noOfAttempts": "3",
    "attemptsGrade": "highest",
    "format": "video",
    "mediaId": "media-uuid-123",
    "eligibilityCriteria": null,
    "idealTime": 45,
    "resume": true,
    "totalMarks": 100,
    "passingMarks": 60,
    "status": "published",
    "params": {},
    "mediaContent": {
      "format": "video",
      "subFormat": "video.youtube.url",
      "source": "https://youtube.com/watch?v=example",
      "params": {}
    },
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z",
    "updatedBy": null,
    "updatedAt": null
  }
}
```







#### Add Lesson to Course/Module

- **Endpoint**: `POST /api/courses/{courseId}/modules/{moduleId}/lessons`
- **HTTP Method**: POST
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `courseId` (path): UUID of the course
- `moduleId` (path): UUID of the module (optional, can be "null" for course-level lessons)



- **Request Body**:

```json
{
  "lessonId": "lesson-uuid-123",
  "freeLesson": true,
  "considerForPassing": true,
  "status": "published",
  "startDatetime": "2024-06-01T00:00:00Z",
  "endDatetime": "2024-12-31T23:59:59Z",
  "noOfAttempts": "3",
  "attemptsGrade": "highest",
  "eligibilityCriteria": null,
  "idealTime": 45,
  "resume": true,
  "totalMarks": 100,
  "passingMarks": 60,
  "params": {}
}
```


- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.course.lesson.add",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "lessonId": "lesson-uuid-123",
    "courseId": "course-uuid-123",
    "moduleId": "module-uuid-456",
    "freeLesson": true,
    "considerForPassing": true,
    "status": "published",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "noOfAttempts": "3",
    "attemptsGrade": "highest",
    "eligibilityCriteria": null,
    "idealTime": 45,
    "resume": true,
    "totalMarks": 100,
    "passingMarks": 60,
    "params": {},
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z"
  }
}
```







#### Get Lesson by ID

- **Endpoint**: `GET /api/lessons/{lessonId}`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.lesson.get",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "lessonId": "lesson-uuid-123",
    "title": "Introduction to Backpropagation",
    "alias": "intro-backprop",
    "description": "Learn how neural networks learn through backpropagation",
    "image": "path/to/image.jpg",
    "startDatetime": "2024-06-01T00:00:00Z",
    "endDatetime": "2024-12-31T23:59:59Z",
    "storage": "local",
    "noOfAttempts": "3",
    "attemptsGrade": "highest",
    "format": "video",
    "mediaId": "media-uuid-123",
    "eligibilityCriteria": null,
    "idealTime": 45,
    "resume": true,
    "totalMarks": 100,
    "passingMarks": 60,
    "status": "published",
    "params": {},
    "mediaContent": {
      "format": "video",
      "subFormat": "video.youtube.url",
      "source": "https://youtube.com/watch?v=example",
      "params": {}
    },
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z",
    "updatedBy": null,
    "updatedAt": null
  }
}
```







#### Get Lessons by Course ID

- **Endpoint**: `GET /api/courses/{courseId}/lessons`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course
- `status` (query, optional): Filter by lesson status
- `format` (query, optional): Filter by lesson format



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.lessons",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "lessons": [
      {
        "lessonId": "lesson-uuid-123",
        "title": "Introduction to Backpropagation",
        "description": "Learn how neural networks learn through backpropagation",
        "image": "path/to/image.jpg",
        "format": "video",
        "moduleId": "module-uuid-456",
        "status": "published",
        "freeLesson": true,
        "totalMarks": 100,
        "passingMarks": 60
      },
      {
        "lessonId": "lesson-uuid-456",
        "title": "Neural Network Architectures",
        "description": "Explore different neural network architectures",
        "image": "path/to/image2.jpg",
        "format": "document",
        "moduleId": null,
        "status": "published",
        "freeLesson": false,
        "totalMarks": 50,
        "passingMarks": 30
      }
    ]
  }
}
```







#### Get Lessons by Module ID

- **Endpoint**: `GET /api/modules/{moduleId}/lessons`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `moduleId` (path): UUID of the module
- `status` (query, optional): Filter by lesson status



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.module.lessons",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "lessons": [
      {
        "lessonId": "lesson-uuid-123",
        "title": "Introduction to Backpropagation",
        "description": "Learn how neural networks learn through backpropagation",
        "image": "path/to/image.jpg",
        "format": "video",
        "status": "published",
        "freeLesson": true,
        "totalMarks": 100,
        "passingMarks": 60,
        "mediaContent": {
          "format": "video",
          "subFormat": "video.youtube.url",
          "source": "https://youtube.com/watch?v=example"
        }
      }
    ]
  }
}
```







#### Update Lesson

- **Endpoint**: `PUT /api/lessons/{lessonId}`
- **HTTP Method**: PUT
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson



- **Request Body**:

```json
{
  "title": "Updated Backpropagation Lesson",
  "description": "Updated description for backpropagation",
  "image": "base64-encoded-image-data",
  "status": "published",
  "noOfAttempts": "5",
  "attemptsGrade": "average",
  "idealTime": 60,
  "totalMarks": 120,
  "passingMarks": 70,
  "mediaContent": {
    "format": "video",
    "subFormat": "video.youtube.url",
    "source": "https://youtube.com/watch?v=updated-example",
    "params": {}
  }
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.lesson.update",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "lessonId": "lesson-uuid-123",
    "title": "Updated Backpropagation Lesson",
    "description": "Updated description for backpropagation",
    "image": "path/to/updated/image.jpg",
    "status": "published",
    "noOfAttempts": "5",
    "attemptsGrade": "average",
    "idealTime": 60,
    "totalMarks": 120,
    "passingMarks": 70,
    "mediaContent": {
      "format": "video",
      "subFormat": "video.youtube.url",
      "source": "https://youtube.com/watch?v=updated-example",
      "params": {}
    },
    "updatedBy": "user-uuid-456",
    "updatedAt": "2024-05-06T14:24:02Z"
  }
}
```







#### Delete Lesson

- **Endpoint**: `DELETE /api/lessons/{lessonId}`
- **HTTP Method**: DELETE
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.lesson.delete",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "message": "Lesson deleted successfully"
  }
}
```







#### Remove Lesson from Course/Module

- **Endpoint**: `DELETE /api/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
- **HTTP Method**: DELETE
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `courseId` (path): UUID of the course
- `moduleId` (path): UUID of the module (use "null" for course-level lessons)
- `lessonId` (path): UUID of the lesson



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.lesson.remove",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "message": "Lesson removed from course/module successfully"
  }
}
```







### Media Management

#### Upload Media

- **Endpoint**: `POST /api/media`
- **HTTP Method**: POST
- **Authentication**: Required (Admin, Instructor roles)
- **Content-Type**: `multipart/form-data`
- **Request Parameters**:

- `file` (form): The media file to upload
- `format` (form): Media format (video, document, image, etc.)
- `subFormat` (form, optional): Media sub-format (video.mp4, document.pdf, etc.)
- `storage` (form, optional): Storage type (local, cloud, etc.)
- `source` (form, optional): External source URL if applicable
- `params` (form, optional): Additional parameters as JSON string



- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.media.upload",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "mediaId": "media-uuid-123",
    "format": "video",
    "subFormat": "video.mp4",
    "orgFilename": "lecture.mp4",
    "path": "path/to/media/file.mp4",
    "storage": "local",
    "source": null,
    "params": {},
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z"
  }
}
```







#### Get Media by ID

- **Endpoint**: `GET /api/media/{mediaId}`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `mediaId` (path): UUID of the media



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.media.get",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "mediaId": "media-uuid-123",
    "format": "video",
    "subFormat": "video.mp4",
    "orgFilename": "lecture.mp4",
    "path": "path/to/media/file.mp4",
    "storage": "local",
    "source": null,
    "params": {},
    "createdBy": "user-uuid-123",
    "createdAt": "2024-05-06T14:24:02Z",
    "updatedBy": null,
    "updatedAt": null
  }
}
```







#### Associate Media with Lesson

- **Endpoint**: `POST /api/lessons/{lessonId}/media/{mediaId}`
- **HTTP Method**: POST
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson
- `mediaId` (path): UUID of the media



- **Response Structure**:k

- Success (201 Created):

```json
{
  "id": "api.lesson.media.associate",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "filesId": "files-uuid-123",
    "lessonId": "lesson-uuid-123",
    "mediaId": "media-uuid-123"
  }
}
```







#### Delete Media

- **Endpoint**: `DELETE /api/media/{mediaId}`
- **HTTP Method**: DELETE
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `mediaId` (path): UUID of the media



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.media.delete",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "message": "Media deleted successfully"
  }
}
```







### User Enrollment

#### Enroll User in Course

- **Endpoint**: `POST /api/enrollments`
- **HTTP Method**: POST
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- None



- **Request Body**:

```json
{
  "courseId": "course-uuid-123",
  "userId": "user-uuid-456",
  "unlimitedPlan": false,
  "beforeExpiryMail": false,
  "afterExpiryMail": false,
  "params": {}
}
```


- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.enrollment.create",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "enrollmentId": "enrollment-uuid-123",
    "courseId": "course-uuid-123",
    "userId": "user-uuid-456",
    "tenentId": "tenant-uuid-123",
    "enrolledOnTime": "2024-05-06T14:24:02Z",
    "endTime": "2024-12-31T23:59:59Z",
    "status": "active",
    "unlimitedPlan": false,
    "beforeExpiryMail": false,
    "afterExpiryMail": false,
    "params": {},
    "enrolledBy": "user-uuid-123",
    "enrolledAt": "2024-05-06T14:24:02Z"
  }
}
```







#### Get User Enrollments

- **Endpoint**: `GET /api/enrollments`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `userId` (query, optional): Filter by user ID
- `courseId` (query, optional): Filter by course ID
- `status` (query, optional): Filter by enrollment status
- `page` (query, optional): Page number for pagination
- `limit` (query, optional): Number of items per page



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.enrollment.list",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "count": 2,
    "enrollments": [
      {
        "enrollmentId": "enrollment-uuid-123",
        "courseId": "course-uuid-123",
        "userId": "user-uuid-456",
        "enrolledOnTime": "2024-05-06T14:24:02Z",
        "endTime": "2024-12-31T23:59:59Z",
        "status": "active",
        "unlimitedPlan": false,
        "course": {
          "title": "Introduction to Machine Learning",
          "shortDescription": "Learn the basics of machine learning",
          "image": "path/to/image.jpg"
        }
      },
      {
        "enrollmentId": "enrollment-uuid-456",
        "courseId": "course-uuid-789",
        "userId": "user-uuid-456",
        "enrolledOnTime": "2024-04-01T10:00:00Z",
        "endTime": "2024-10-31T23:59:59Z",
        "status": "active",
        "unlimitedPlan": true,
        "course": {
          "title": "Advanced Data Science",
          "shortDescription": "Master data science techniques",
          "image": "path/to/image2.jpg"
        }
      }
    ]
  }
}
```







#### Get Enrollment by ID

- **Endpoint**: `GET /api/enrollments/{enrollmentId}`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `enrollmentId` (path): UUID of the enrollment



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.enrollment.get",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "enrollmentId": "enrollment-uuid-123",
    "courseId": "course-uuid-123",
    "userId": "user-uuid-456",
    "tenentId": "tenant-uuid-123",
    "enrolledOnTime": "2024-05-06T14:24:02Z",
    "endTime": "2024-12-31T23:59:59Z",
    "status": "active",
    "unlimitedPlan": false,
    "beforeExpiryMail": false,
    "afterExpiryMail": false,
    "params": {},
    "enrolledBy": "user-uuid-123",
    "enrolledAt": "2024-05-06T14:24:02Z",
    "course": {
      "title": "Introduction to Machine Learning",
      "shortDescription": "Learn the basics of machine learning",
      "description": "Comprehensive introduction to machine learning concepts and algorithms",
      "image": "path/to/image.jpg",
      "startDatetime": "2024-06-01T00:00:00Z",
      "endDatetime": "2024-12-31T23:59:59Z"
    }
  }
}
```







#### Update Enrollment

- **Endpoint**: `PUT /api/enrollments/{enrollmentId}`
- **HTTP Method**: PUT
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `enrollmentId` (path): UUID of the enrollment



- **Request Body**:

```json
{
  "endTime": "2025-06-30T23:59:59Z",
  "status": "extended",
  "unlimitedPlan": true,
  "beforeExpiryMail": true,
  "afterExpiryMail": true,
  "params": {
    "extendedReason": "Customer request"
  }
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.enrollment.update",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "enrollmentId": "enrollment-uuid-123",
    "courseId": "course-uuid-123",
    "userId": "user-uuid-456",
    "enrolledOnTime": "2024-05-06T14:24:02Z",
    "endTime": "2025-06-30T23:59:59Z",
    "status": "extended",
    "unlimitedPlan": true,
    "beforeExpiryMail": true,
    "afterExpiryMail": true,
    "params": {
      "extendedReason": "Customer request"
    },
    "updatedBy": "user-uuid-123",
    "updatedAt": "2024-05-06T14:24:02Z"
  }
}
```







#### Cancel Enrollment

- **Endpoint**: `DELETE /api/enrollments/{enrollmentId}`
- **HTTP Method**: DELETE
- **Authentication**: Required (Admin, Instructor roles)
- **Request Parameters**:

- `enrollmentId` (path): UUID of the enrollment



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.enrollment.cancel",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "message": "Enrollment cancelled successfully"
  }
}
```







### Course Tracking

#### Start Course Tracking

- **Endpoint**: `POST /api/courses/{courseId}/tracking`
- **HTTP Method**: POST
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course



- **Request Body**:

```json
{
  "userId": "user-uuid-456",
  "startDatetime": "2024-05-06T14:24:02Z"
}
```


- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.course.tracking.start",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "courseTrackId": "course-track-uuid-123",
    "courseId": "course-uuid-123",
    "userId": "user-uuid-456",
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": null,
    "noOfLessons": 10,
    "completedLessons": 0,
    "status": "incomplete",
    "lastAccessedDate": "2024-05-06T14:24:02Z",
    "certGenDate": null
  }
}
```







#### Update Course Tracking

- **Endpoint**: `PUT /api/courses/{courseId}/tracking`
- **HTTP Method**: PUT
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course



- **Request Body**:

```json
{
  "userId": "user-uuid-456",
  "completedLessons": 5,
  "status": "in_progress",
  "lastAccessedDate": "2024-05-06T15:30:00Z"
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.tracking.update",
  "ver": "1.0",
  "ts": "2024-05-06T15:30:00Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "courseTrackId": "course-track-uuid-123",
    "courseId": "course-uuid-123",
    "userId": "user-uuid-456",
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": null,
    "noOfLessons": 10,
    "completedLessons": 5,
    "status": "in_progress",
    "lastAccessedDate": "2024-05-06T15:30:00Z",
    "certGenDate": null
  }
}
```







#### Complete Course Tracking

- **Endpoint**: `PUT /api/courses/{courseId}/tracking/complete`
- **HTTP Method**: PUT
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course



- **Request Body**:

```json
{
  "userId": "user-uuid-456",
  "endDatetime": "2024-05-10T16:45:00Z",
  "completedLessons": 10,
  "certGenDate": "2024-05-10T16:45:00Z"
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.tracking.complete",
  "ver": "1.0",
  "ts": "2024-05-10T16:45:00Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "courseTrackId": "course-track-uuid-123",
    "courseId": "course-uuid-123",
    "userId": "user-uuid-456",
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": "2024-05-10T16:45:00Z",
    "noOfLessons": 10,
    "completedLessons": 10,
    "status": "completed",
    "lastAccessedDate": "2024-05-10T16:45:00Z",
    "certGenDate": "2024-05-10T16:45:00Z"
  }
}
```







#### Get Course Tracking

- **Endpoint**: `GET /api/courses/{courseId}/tracking`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `courseId` (path): UUID of the course
- `userId` (query): UUID of the user



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.course.tracking.get",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "courseTrackId": "course-track-uuid-123",
    "courseId": "course-uuid-123",
    "userId": "user-uuid-456",
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": null,
    "noOfLessons": 10,
    "completedLessons": 5,
    "status": "in_progress",
    "lastAccessedDate": "2024-05-06T15:30:00Z",
    "certGenDate": null,
    "course": {
      "title": "Introduction to Machine Learning",
      "shortDescription": "Learn the basics of machine learning",
      "image": "path/to/image.jpg"
    },
    "progress": 50
  }
}
```







### Lesson Tracking

#### Start Lesson Tracking

- **Endpoint**: `POST /api/lessons/{lessonId}/tracking`
- **HTTP Method**: POST
- **Authentication**: Required
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson



- **Request Body**:

```json
{
  "userId": "user-uuid-456",
  "attempt": 1,
  "startDatetime": "2024-05-06T14:24:02Z",
  "totalContent": 100,
  "currentPosition": 0
}
```


- **Response Structure**:

- Success (201 Created):

```json
{
  "id": "api.lesson.tracking.start",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 201,
  "result": {
    "lessonTrackId": "lesson-track-uuid-123",
    "lessonId": "lesson-uuid-123",
    "userId": "user-uuid-456",
    "attempt": 1,
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": null,
    "score": 0,
    "status": "started",
    "totalContent": 100,
    "currentPosition": 0,
    "timeSpent": 0
  }
}
```







#### Update Lesson Tracking

- **Endpoint**: `PUT /api/lessons/{lessonId}/tracking`
- **HTTP Method**: PUT
- **Authentication**: Required
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson



- **Request Body**:

```json
{
  "userId": "user-uuid-456",
  "attempt": 1,
  "currentPosition": 50,
  "timeSpent": 600,
  "status": "in_progress"
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.lesson.tracking.update",
  "ver": "1.0",
  "ts": "2024-05-06T14:34:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "lessonTrackId": "lesson-track-uuid-123",
    "lessonId": "lesson-uuid-123",
    "userId": "user-uuid-456",
    "attempt": 1,
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": null,
    "score": 0,
    "status": "in_progress",
    "totalContent": 100,
    "currentPosition": 50,
    "timeSpent": 600,
    "updatedBy": "user-uuid-456",
    "updatedAt": "2024-05-06T14:34:02Z"
  }
}
```







#### Complete Lesson Tracking

- **Endpoint**: `PUT /api/lessons/{lessonId}/tracking/complete`
- **HTTP Method**: PUT
- **Authentication**: Required
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson



- **Request Body**:

```json
{
  "userId": "user-uuid-456",
  "attempt": 1,
  "endDatetime": "2024-05-06T15:24:02Z",
  "score": 85,
  "currentPosition": 100,
  "timeSpent": 3600
}
```


- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.lesson.tracking.complete",
  "ver": "1.0",
  "ts": "2024-05-06T15:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "lessonTrackId": "lesson-track-uuid-123",
    "lessonId": "lesson-uuid-123",
    "userId": "user-uuid-456",
    "attempt": 1,
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": "2024-05-06T15:24:02Z",
    "score": 85,
    "status": "completed",
    "totalContent": 100,
    "currentPosition": 100,
    "timeSpent": 3600,
    "updatedBy": "user-uuid-456",
    "updatedAt": "2024-05-06T15:24:02Z"
  }
}
```







#### Get Lesson Tracking

- **Endpoint**: `GET /api/lessons/{lessonId}/tracking`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `lessonId` (path): UUID of the lesson
- `userId` (query): UUID of the user
- `attempt` (query, optional): Specific attempt number



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.lesson.tracking.get",
  "ver": "1.0",
  "ts": "2024-05-06T15:30:00Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "lessonTrackId": "lesson-track-uuid-123",
    "lessonId": "lesson-uuid-123",
    "userId": "user-uuid-456",
    "attempt": 1,
    "startDatetime": "2024-05-06T14:24:02Z",
    "endDatetime": "2024-05-06T15:24:02Z",
    "score": 85,
    "status": "completed",
    "totalContent": 100,
    "currentPosition": 100,
    "timeSpent": 3600,
    "lesson": {
      "title": "Introduction to Backpropagation",
      "description": "Learn how neural networks learn through backpropagation",
      "format": "video",
      "totalMarks": 100,
      "passingMarks": 60
    },
    "progress": 100,
    "passed": true
  }
}
```







#### Get User's Lesson Tracking History

- **Endpoint**: `GET /api/users/{userId}/lessons/{lessonId}/tracking`
- **HTTP Method**: GET
- **Authentication**: Required
- **Request Parameters**:

- `userId` (path): UUID of the user
- `lessonId` (path): UUID of the lesson



- **Response Structure**:

- Success (200 OK):

```json
{
  "id": "api.user.lesson.tracking.history",
  "ver": "1.0",
  "ts": "2024-05-06T15:30:00Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "successful",
    "err": null,
    "errmsg": null
  },
  "responseCode": 200,
  "result": {
    "attempts": [
      {
        "lessonTrackId": "lesson-track-uuid-123",
        "attempt": 1,
        "startDatetime": "2024-05-06T14:24:02Z",
        "endDatetime": "2024-05-06T15:24:02Z",
        "score": 85,
        "status": "completed",
        "timeSpent": 3600
      },
      {
        "lessonTrackId": "lesson-track-uuid-456",
        "attempt": 2,
        "startDatetime": "2024-05-07T10:00:00Z",
        "endDatetime": "2024-05-07T11:15:00Z",
        "score": 92,
        "status": "completed",
        "timeSpent": 4500
      }
    ],
    "lesson": {
      "title": "Introduction to Backpropagation",
      "description": "Learn how neural networks learn through backpropagation",
      "format": "video",
      "totalMarks": 100,
      "passingMarks": 60
    },
    "bestScore": 92,
    "averageScore": 88.5,
    "totalAttempts": 2,
    "passed": true
  }
}
```







## Error Handling

All API endpoints follow a consistent error handling approach:

1. **Client Errors (4xx)**:

1. 400 Bad Request: Invalid input parameters
2. 401 Unauthorized: Missing or invalid authentication
3. 403 Forbidden: Insufficient permissions
4. 404 Not Found: Resource not found
5. 409 Conflict: Resource already exists or conflict with existing data



2. **Server Errors (5xx)**:

1. 500 Internal Server Error: Unexpected server error





Error response format:

```json
{
  "id": "api.endpoint.action",
  "ver": "1.0",
  "ts": "2024-05-06T14:24:02Z",
  "params": {
    "resmsgid": "c8e1a2b3-4d5e-6f7g-8h9i-j0k1l2m3n4o5",
    "status": "failed",
    "err": "ERROR_CODE",
    "errmsg": "Detailed error message"
  },
  "responseCode": 4xx/5xx,
  "result": null
}
```