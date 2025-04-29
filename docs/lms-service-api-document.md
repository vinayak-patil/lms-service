# LMS Service API Documentation 📚

## Table of Contents 📑

1. [Courses](#courses) 📚  
2. [Modules](#modules) 📦  
3. [Lessons](#lessons) 📝  
4. [User Enrollment](#user-enrollment) 👥  
5. [Lesson Tracking](#lesson-tracking) 📊  
6. [Course Tracking](#course-tracking) 📈

7. ## [Common Response Structure](#common-response-structure) 🔄

8. ### [Status Codes](#status-codes) ⚠️

## Courses {#courses} 📚

### Create Course ➕

- **Endpoint**: `POST /courses`  
- **Description**: Creates a new course  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title (Required)*: Course Title 

shortDescription (Required)*: Short course description

description (Required)*: Detailed course description

image: \[file\]

featured: false

free: true

Certificate\_term: NA / PASS\_ALL / COMPLETE\_ALL 

certificate\_id: sunbird-rc-id

startDatetime (Required)*: 2024-03-20T00:00:00Z

endDatetime (Required)*: 2024-12-31T23:59:59Z

adminApproval: false

autoEnroll: false

status: unpublished

params: {}

- **Response**:

{

  "id": "api.course.create",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 201,

  "result": {

    "courseId": "uuid",

    "tenentId": "uuid",

    "title": "Course Title",

    "shortDescription": "Short course description",

    "description": "Detailed course description",

    "image": "path/to/image",

    "featured": false,

    "paid": false,

    "certificate\_term": "1",

    "certificate\_id": sunbird-rc-id,

    "startDatetime": "2024-03-20T00:00:00Z",

    "endDatetime": "2024-12-31T23:59:59Z",

    "adminApproval": false,

    "autoEnroll": false,

    "status": "unpublished",

    "params": {},

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": null,

    "updatedAt": null

  }

}


### Get Course by ID 🔍

- **Endpoint**: `GET /courses/:id`  
- **Description**: Retrieves a specific course by ID  
- **Response**:

{

  "id": "api.course.get",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": {

    "courseId": "uuid",

    "title": "Course Title",

    "shortDescription": "Short course description",

    "description": "Detailed course description",

    "image": "path/to/image",

    "featured": false,

    "paid": false,

    "certificate\_term": "1",

    "Certificate\_id": sunbird-rc-id,

    "startDatetime": "2024-03-20T00:00:00Z",

    "endDatetime": "2024-12-31T23:59:59Z",

    "adminApproval": false,

    "autoEnroll": false,

    "status": "unpublished",

    "params": {},

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": user-uuid,

    "updatedAt": "2024-03-20T00:00:00Z"

  }

}

### Get Course Details with Modules and Lessons 📋

- **Endpoint**: `GET /courses/details/:id`  
- **Description**: Retrieves detailed course information including its modules and lessons  
- **Response**:

{

  "id": "api.course.get",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": {

    "courseId": "uuid",

    "title": "Course Title",

    "shortDescription": "Short course description",

    "description": "Detailed course description",

    "image": "path/to/image",

    "featured": false,

    "paid": false,

    "certificate\_term": "Certificate term",

    "certificate\_id": false,

    "startDatetime": "2024-03-20T00:00:00Z",

    "endDatetime": "2024-12-31T23:59:59Z",

    "adminApproval": false,

    "autoEnroll": false,

    "status": "draft",

    "params": {},

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": null,

    "updatedAt": "2024-03-20T00:00:00Z",

    "modules": \[

      {

        "moduleId": "uuid",

        "title": "Module Title",

        "description": "Module description",

        "ordering": 1,

        "image": "path/to/image",

        "status": 1,

        "courseId": "course-uuid",

        "createdBy": "user-uuid",

        "createdAt": "2024-03-20T00:00:00Z",

        "updatedBy": null,

        "updatedAt": "2024-03-20T00:00:00Z",

        "lessons": \[

          {

            "lessonId": "uuid",

            "title": "Lesson Title",

            "description": "Lesson description",

            "ordering": 1,

            "moduleId": "module-uuid",

            "courseId": "course-uuid",

            "status": "published",

            "shortDesc": "Short description",

            "image": "path/to/image",

            "startDate": "2024-03-20T00:00:00Z",

            "endDate": "2024-12-31T23:59:59Z",

            "storage": "local",

            "freeLesson": "yes",

            "noOfAttempts": "3",

            "attemptsGrade": "highest",

            "considerMarks": "yes",

            "format": "video",

            "mediaId": "media-uuid",

            "eligibilityCriteria": {"uuid-lesson"}

            "idealTime": 45,

            "resume": true,

            "totalMarks": 100,

            "passingMarks": 60,

            "params": "{}",

            "createdBy": "user-uuid",

            "createdAt": "2024-03-20T00:00:00Z",

            "updatedBy": user-uuid,

            "updatedAt": "2024-03-20T00:00:00Z"

          }

        \]

      }

    \]

  }

}

### Update Course ✏️

- **Endpoint**: `PUT /courses/:id`  
- **Description**: Updates an existing course  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title: Updated Title

shortDescription: Updated short description

description: Updated description

image: \[file\]

featured: true

type: true

certificate\_term: Updated certificate term

certificate\_id: sunbird-rc-id

startDatetime: 2024-03-20T00:00:00Z

endDatetime: 2024-12-31T23:59:59Z

adminApproval: true

autoEnroll: true

status: published

params: {}

- **Response**:

{

  "id": "api.course.update",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": {

    "courseId": "uuid",

    "title": "Updated Title",

    "shortDescription": "Updated short description",

    "description": "Updated description",

    "image": "updated/image/path",

    "featured": true,

    "paid": true,

    "certificate\_term": "Updated certificate term",

    "certificate\_id": sunbird-rc-id,

    "startDatetime": "2024-03-20T00:00:00Z",

    "endDatetime": "2024-12-31T23:59:59Z",

    "adminApproval": true,

    "autoEnroll": true,

    "status": "published",

    "params": {},

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": "user-uuid",

    "updatedAt": "2024-03-20T00:00:00Z"

  }

}

### Delete Course 🗑️

- **Endpoint**: `DELETE /courses/:id`  
- **Description**: Deletes a course  
- **Response**:

{

  "id": "api.course.delete",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,  
  },

  "responseCode": 200,

  "result": null

}

## Modules {#modules} 📦

### Create Module ➕

- **Endpoint**: `POST /modules`  
- **Description**: Creates a new module  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title (Required)*: Module Title

description (Required)*: Module description

image: \[file\]

status: 'unpublished'

courseId (Required)*: course-uuid

- **Response**:

{

  "id": "api.module.create",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 201,

  "result": {

    "moduleId": "uuid",

    "tenentId": "uuid",

    "title": "Module Title",

    "description": "Module description",

    "ordering": 1,

    "image": "path/to/image",

    "status": 1,

    "courseId": "course-uuid",

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": null,

    "updatedAt": "null"

  }

}


### Get Module by ID 🔍

- **Endpoint**: `GET /modules/:id`  
- **Description**: Retrieves a specific module by ID  
- **Response**:

{

  "id": "api.module.get",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": {

    "moduleId": "uuid",

    "title": "Module Title",

    "description": "Module description",

    "ordering": 1,

    "image": "path/to/image",

    "status": 1,

    "courseId": "course-uuid",

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": null,

    "updatedAt": "2024-03-20T00:00:00Z"

  }

}

### Get Modules by Course ID 📋

- **Endpoint**: `GET /modules/course/:courseId`  
- **Description**: Retrieves all modules belonging to a specific course  
- **Response**:

{

  "statusCode": 200,

  "data": \[

    {

      "moduleId": "uuid",

      "title": "Module Title",

      "description": "Module description",

      "ordering": 1,

      "image": "path/to/image",

      "status": 1,

      "courseId": "course-uuid",

      "createdBy": "user-uuid",

      "createdAt": "2024-03-20T00:00:00Z",

      "updatedBy": null,

      "updatedAt": "2024-03-20T00:00:00Z"

    }

  \]

}

### Update Module ✏️

- **Endpoint**: `PUT /modules/:id`  
- **Description**: Updates an existing module  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title: Updated Title

description: Updated description

ordering: 2

image: \[file\]

status: 0

courseId: course-uuid

- **Response**:

{

  "id": "api.module.update",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": {

    "moduleId": "uuid",

    "title": "Updated Title",

    "description": "Updated description",

    "ordering": 2,

    "image": "updated/image/path",

    "status": 0,

    "courseId": "course-uuid",

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": "user-uuid",

    "updatedAt": "2024-03-20T00:00:00Z"

  }

}

### Delete Module 🗑️

- **Endpoint**: `DELETE /modules/:id`  
- **Description**: Deletes a module  
- **Response**:

{

  "id": "api.module.delete",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": null

}

## Lessons {#lessons} 📝

### Create Lesson ➕

- **Endpoint**: `POST /lessons`  
- **Description**: Creates a new lesson  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title (Required)*: Lesson Title

description (Required)*: Lesson description

moduleId: module-uuid

courseId: course-uuid

status: published

duration: 60

format: video

startDate: 2024-03-20T00:00:00Z

endDate: 2024-12-31T23:59:59Z

storage: local

freeLesson: true

noOfAttempts: 3

attemptsGrade: highest

considerMarks: true

mediaId: media-uuid

eligibilityCriteria: Complete previous lesson

idealTime: 45

resume: true

totalMarks: 100

passingMarks: 60

params: {}

image: \[file\]

mediaContent: {  
  format: video  
  sub\_format: video.youtube.url  
  source: https://youtube.com/wQdsmn  
  params: {}  
}

- **Response**:

{

  "id": "api.lesson.create",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 201,

  "result": {

    "lessonId": "uuid",

    "tenentId": "uuid",

    "title": "Lesson Title",

    "description": "Lesson description",

    "ordering": 1,

    "moduleId": "module-uuid",

    "courseId": "course-uuid",

    "status": "published",

    "shortDesc": "Short description",

    "image": "path/to/image",

    "startDate": "2024-03-20T00:00:00Z",

    "endDate": "2024-12-31T23:59:59Z",

    "storage": "local",

    "freeLesson": "yes",

    "noOfAttempts": "3",

    "attemptsGrade": "highest",

    "considerMarks": "yes",

    "format": "video",

    "mediaId": "media-uuid",

    "eligibilityCriteria": "Complete previous lesson",

    "idealTime": 45,

    "resume": true,

    "totalMarks": 100,

    "passingMarks": 60,

    "inLib": false,

    "params": "{}",  
      
    "mediaContent": {  
        "url": "path/to/media",  
        "format": "video",  
        "sub\_format": "video.youtube.url",  
        "source": "https://youtube.com/watch?v=example",  
        "params": {}  
      },

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": null,

    "updatedAt": "2024-03-20T00:00:00Z"

  }

}

### Get All Lessons 📋

- **Endpoint**: `GET /lessons`  
- **Description**: Retrieves all lessons  
- **Response**:

{

  "id": "api.lesson.list",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": \[

    {

      "lessonId": "uuid",

      "title": "Lesson Title",

      "description": "Lesson description",

      "content": "Lesson content",

      "ordering": 1,

      "moduleId": "module-uuid",

      "courseId": "course-uuid",

      "status": "published",

      "shortDesc": "Short description",

      "image": "path/to/image",

      "startDate": "2024-03-20T00:00:00Z",

      "endDate": "2024-12-31T23:59:59Z",

      "storage": "local",

      "freeLesson": "yes",

      "noOfAttempts": "3",

      "attemptsGrade": "highest",

      "considerMarks": "yes",

      "format": "video",

      "mediaId": "media-uuid",

      "eligibilityCriteria": "Complete previous lesson",

      "idealTime": 45,

      "resume": true,

      "totalMarks": 100,

      "passingMarks": 60,

      "inLib": false,

      "params": "{}",  
        
       "mediaContent": {  
        "url": "path/to/media",  
        "format": "video",  
        "sub\_format": "video.youtube.url",  
        "source": "https://youtube.com/watch?v=example",  
        "params": {}  
      },

      "createdBy": "user-uuid",

      "createdAt": "2024-03-20T00:00:00Z",

      "updatedBy": null,

      "updatedAt": "2024-03-20T00:00:00Z"

    }

  \]

}

### Add lesson into course under module ➕

- **Endpoint**: `POST /courses/lessons`  
- **Description**: Adds an existing lesson to a specific course and module  
- **Content-Type**: `application/json`  
- **Request Body**:

courseId (Required)*: course-uuid

moduleId (Required)*: module-uuid

lessonId (Required)*: lesson-uuid

- **Response**:

{
  "id": "api.lesson.add",
  "ver": "1.0",
  "ts": "2024-03-20T00:00:00Z",
  "params": {
    "resmsgid": "uuid",
    "status": "successful",
    "err": null,
    "errmsg": null,
  },
  "responseCode": 201,
  "result": {
    "lessonId": "uuid",
    "courseId": "course-uuid",
    "moduleId": "module-uuid",
    "message": "Lesson successfully added to course and module"
  }
}

### Get Lesson by ID 🔍

- **Endpoint**: `GET /lessons/:id`  
- **Description**: Retrieves a specific lesson by ID  
- **Response**:

{

  "id": "api.lesson.get",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": {

    "lessonId": "uuid",

    "title": "Lesson Title",

    "description": "Lesson description",

    "content": "Lesson content",

    "ordering": 1,

    "moduleId": "module-uuid",

    "courseId": "course-uuid",

    "status": "published",

    "shortDesc": "Short description",

    "image": "path/to/image",

    "startDate": "2024-03-20T00:00:00Z",

    "endDate": "2024-12-31T23:59:59Z",

    "storage": "local",

    "freeLesson": "yes",

    "noOfAttempts": "3",

    "attemptsGrade": "highest",

    "considerMarks": "yes",

    "format": "video",

    "mediaId": "media-uuid",

    "eligibilityCriteria": "Complete previous lesson",

    "idealTime": 45,

    "resume": true,

    "totalMarks": 100,

    "passingMarks": 60,

    "inLib": false,

    "params": "{}",

   "mediaContent": {  
        "url": "path/to/media",  
        "format": "video",  
        "sub\_format": "video.youtube.url",  
        "source": "https://youtube.com/watch?v=example",  
        "params": {}  
      },  
 

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": null,

    "updatedAt": "2024-03-20T00:00:00Z"

  }

}

### Get Lessons by Module ID 📋

- **Endpoint**: `GET /lessons/module/:moduleId`  
- **Description**: Retrieves all lessons belonging to a specific module  
- **Response**:

{

  "statusCode": 200,

  "data": \[

    {

      "lessonId": "uuid",

      "title": "Lesson Title",

      "description": "Lesson description",

      "content": "Lesson content",

      "ordering": 1,

      "moduleId": "module-uuid",

      "courseId": "course-uuid",

      "alias": "lesson-alias",

      "status": "published",

      "shortDesc": "Short description",

      "image": "path/to/image",

      "startDate": "2024-03-20T00:00:00Z",

      "endDate": "2024-12-31T23:59:59Z",

      "storage": "local",

      "freeLesson": "yes",

      "noOfAttempts": "3",

      "attemptsGrade": "highest",

      "considerMarks": "yes",

      "format": "video",

      "mediaId": "media-uuid",

      "eligibilityCriteria": "Complete previous lesson",

      "idealTime": 45,

      "resume": true,

      "totalMarks": 100,

      "passingMarks": 60,

      "inLib": false,

      "params": "{}",

      "mediaContent": {  
        "url": "path/to/media",  
        "format": "video",  
        "sub\_format": "video.youtube.url",  
        "source": "https://youtube.com/watch?v=example",  
        "params": {}  
      },

      "createdBy": "user-uuid",

      "createdAt": "2024-03-20T00:00:00Z",

      "updatedBy": null,

      "updatedAt": "2024-03-20T00:00:00Z"

    }

  \]

}

### Get Lessons by Course ID 📋

- **Endpoint**: `GET /lessons/course/:courseId`  
- **Description**: Retrieves all lessons belonging to a specific course  
- **Response**:

{

  "statusCode": 200,

  "data": \[

    {

      "lessonId": "uuid",

      "title": "Lesson Title",

      "description": "Lesson description",

      "content": "Lesson content",

      "ordering": 1,

      "moduleId": "module-uuid",

      "courseId": "course-uuid",

      "alias": "lesson-alias",

      "status": "published",

      "shortDesc": "Short description",

      "image": "path/to/image",

      "startDate": "2024-03-20T00:00:00Z",

      "endDate": "2024-12-31T23:59:59Z",

      "storage": "local",

      "freeLesson": "yes",

      "noOfAttempts": "3",

      "attemptsGrade": "highest",

      "considerMarks": "yes",

      "format": "video",

      "mediaId": "media-uuid",

      "eligibilityCriteria": "Complete previous lesson",

      "idealTime": 45,

      "resume": true,

      "totalMarks": 100,

      "passingMarks": 60,

      "inLib": false,

      "params": "{}",  
    
      "mediaContent": {  
        "url": "path/to/media",  
        "format": "video",  
        "sub\_format": "video.youtube.url",  
        "source": "https://youtube.com/watch?v=example",  
        "params": {}  
      },

      "createdBy": "user-uuid",

      "createdAt": "2024-03-20T00:00:00Z",

      "updatedBy": null,

      "updatedAt": "2024-03-20T00:00:00Z"

    }

  \]

}

### Update Lesson ✏️

- **Endpoint**: `PUT /lessons/:id`  
- **Description**: Updates an existing lesson  
- **Content-Type**: `multipart/form-data`  
- **Request Body**:

title: Updated Title

description: Updated description

content: Updated content

ordering: 2

moduleId: module-uuid

courseId: course-uuid

status: unpublished

shortDesc: Updated short description

isPublished: false

duration: 60

type: document

videoUrl: https://example.com/updated-video

resourcesUrl: https://example.com/updated-resources

thumbnailUrl: https://example.com/updated-thumbnail

startDate: 2024-03-20T00:00:00Z

endDate: 2024-12-31T23:59:59Z

storage: cloud

freeLesson: no

noOfAttempts: 5

attemptsGrade: average

considerMarks: no

format: document

mediaId: new-media-uuid

eligibilityCriteria: Updated criteria

idealTime: 60

resume: false

totalMarks: 200

passingMarks: 120

inLib: true

params: {}

image: \[file\]

mediaContent: {  
  format: string  video  
  sub\_format: video.youtube.url  
  source: https://youtube.com/wQdsmn  
  params: {}  
}

- **Response**:

{

  "id": "api.lesson.update",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": {

    "lessonId": "uuid",

    "title": "Updated Title",

    "description": "Updated description",

    "content": "Updated content",

    "ordering": 2,

    "moduleId": "module-uuid",

    "courseId": "course-uuid",

    "status": "unpublished",

    "shortDesc": "Updated short description",

    "image": "updated/image/path",

    "startDate": "2024-03-20T00:00:00Z",

    "endDate": "2024-12-31T23:59:59Z",

    "storage": "cloud",

    "freeLesson": "no",

    "noOfAttempts": "5",

    "attemptsGrade": "average",

    "considerMarks": "no",

    "format": "document",

    "mediaId": "new-media-uuid",

    "eligibilityCriteria": "Updated criteria",

    "idealTime": 60,

    "resume": false,

    "totalMarks": 200,

    "passingMarks": 120,

    "inLib": true,

    "params": "{}",

    "mediaContent": {  
        "url": "path/to/media",  
        "format": "video",  
        "sub\_format": "video.youtube.url",  
        "source": "https://youtube.com/watch?v=example",  
        "params": {}  
      },

    "createdBy": "user-uuid",

    "createdAt": "2024-03-20T00:00:00Z",

    "updatedBy": "user-uuid",

    "updatedAt": "2024-03-20T00:00:00Z"

  }

}

### Delete Lesson 🗑️

- **Endpoint**: `DELETE /lessons/:id`  
- **Description**: Deletes a lesson  
- **Response**:

{

  "id": "api.lesson.delete",

  "ver": "1.0",

  "ts": "2024-03-20T00:00:00Z",

  "params": {

    "resmsgid": "uuid",

    "status": "successful",

    "err": null,

    "errmsg": null,

  },

  "responseCode": 200,

  "result": null

}

## User Enrollment {#user-enrollment} 👥

### Enroll User in Course ➕

- **Endpoint**: `POST /enrollments`  
- **Description**: Enrolls a user in a course  
- **Content-Type**: `application/json`  
- **Request Body**:

course\_id\*: UUID

user\_id\*: UUID

unlimited\_plan: false

before\_expiry\_mail: false

after\_expiry\_mail: false

params: {}

- **Response**:

{

"id": "api.enrollment.create",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,

},

"responseCode": 201,

"result": {

"id": "uuid",

"course\_id": "uuid",

"user\_id": "uuid",

"tenentId": "uuid",

"enrolled\_on\_time": "2024-03-20T00:00:00Z",

"end\_time": "2024-12-31T23:59:59Z",

"state": 0,

"unlimited\_plan": false,

"before\_expiry\_mail": false,

"after\_expiry\_mail": false,

"params": {},

"enrolled\_by": "uuid",

"enrolled\_at": "2024-03-20T00:00:00Z"

}

}

- **On user enrollment add entry into track\_course with below details**   
  { 

  course\_id: uuid  
    
  user\_id: uuid  
    
  timestart: 2024-03-20T00:00:00Z


  no\_of\_lessons: 10 

}

### Get Enrollments with Course Details 📋

- **Endpoint**: `GET /enrollments`  
- **Description**: Retrieves enrollments with course details. Can be filtered by user\_id or course\_id  
- **Query Parameters**:  
  - user\_id: UUID (optional) \- Filter enrollments by user ID  
  - course\_id: UUID (optional) \- Filter enrollments by course ID  
  - page: number (optional) \- Page number for pagination  
  - limit: number (optional) \- Number of items per page  
- **Response**:

{

"id": "api.enrollment.list",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,

},

"responseCode": 200,

"result": {

"count": 1,

"enrollments": \\\[

  {

    "id": "uuid",

    "course\_id": "uuid",

    "user\_id": "uuid",

    "enrolled\_on\_time": "2024-03-20T00:00:00Z",

    "end\_time": "2024-12-31T23:59:59Z",

    "state": 0,

    "unlimited\_plan": false,

    "before\_expiry\_mail": false,

    "after\_expiry\_mail": false,

    "params": {},

    "enrolled\_by": "uuid",

    "enrolled\_at": "2024-03-20T00:00:00Z",

    "title": "Course Title",

    "shortDescription": "Short course description",

    "description": "Detailed course description",

    "image": "path/to/image",

  }

\\\]

}

}

### Update Enrollment ✏️

- **Endpoint**: `PUT /enrollments/:id`  
- **Description**: Updates an existing enrollment  
- **Content-Type**: `application/json`  
- **Request Body**:

course\_id: uuid

user\_id: uuid

end\_time: 2024-12-31T23:59:59Z

state: 1

unlimited\_plan: true

before\_expiry\_mail: true

after\_expiry\_mail: true

params: {}

enrolled\_by: uuid

- **Response**:

{

"id": "api.enrollment.update",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,  
},

"responseCode": 200,

"result": {

"id": "uuid",

"course\_id": "uuid",

"user\_id": "uuid",

"enrolled\_on\_time": "2024-03-20T00:00:00Z",

"end\_time": "2024-12-31T23:59:59Z",

"state": 1,

"unlimited\_plan": true,

"before\_expiry\_mail": true,

"after\_expiry\_mail": true,

"params": {},

"enrolled\_by": "uuid",

"enrolled\_at": "2024-03-20T00:00:00Z"

}

}

### Delete Enrollment 🗑️

- **Endpoint**: `DELETE /enrollments/:id`  
- **Description**: Deletes an enrollment  
- **Response**:

{

"id": "api.enrollment.delete",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,

},

"responseCode": 200,

"result": null

}

## Lesson Tracking {#lesson-tracking} 📊

### Start Lesson Tracking ▶️

- **Endpoint**: `POST /lessons/tracking`  
- **Description**: Starts tracking a user's progress in a lesson  
- **Content-Type**: `application/json`  
- **Request Body**:

lesson\_id\*: UUID

user\_id\*: UUID

attempt: 1

timestart: 2024-03-20T00:00:00Z

score: 0

status: started

total\_content: 0

current\_position: 0

time\_spent: 0

updatedBy\*: UUID

- **Response**:

{

"id": "api.lesson.tracking.start",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,  
},

"responseCode": 201,

"result": {

"id": "uuid",

"lesson\_id": "uuid"

}

}

### Update Lesson Tracking ✏️

- **Endpoint**: `PUT /lessons/tracking/:id`  
- **Description**: Updates a user's progress in a lesson  
- **Content-Type**: `application/json`  
- **Request Body**:

lesson\_id: uuid

user\_id: uuid

attempt: 2

timestart: 2024-03-20T00:00:00Z

timeend: 2024-03-20T01:00:00Z

score: 85

status: completed

total\_content: 100

current\_position: 100

time\_spent: 3600

updatedBy: uuid

- **Response**:

{

"id": "api.lesson.tracking.update",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null  
},

"responseCode": 200,

"result": {

"id": "uuid",

"lesson\_id": "uuid"

}

}

### Get Lesson Tracking 📋

- **Endpoint**: `GET /lessons/tracking`  
- **Description**: Retrieves lesson tracking records with optional filters  
- **Query Parameters**:  
  - lesson\_id: UUID (optional) \- Filter by lesson ID  
  - user\_id: UUID (optional) \- Filter by user ID  
  - status: string (optional) \- Filter by status (started, completed, etc.)  
  - page: number (optional) \- Page number for pagination  
  - limit: number (optional) \- Number of items per page  
- **Response**:

{

"id": "api.lesson.tracking.list",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,

},

"responseCode": 200,

"result": {

"count": 1,

"tracking": \\\[

  {

    "id": "uuid",

    "lesson\_id": "uuid",

    "user\_id": "uuid",

    "attempt": 2,

    "timestart": "2024-03-20T00:00:00Z",

    "timeend": "2024-03-20T01:00:00Z",

    "score": 85,

    "status": "completed",

    "total\_content": 100,

    "current\_position": 100,

    "time\_spent": 3600,

    "updatedBy": "uuid",

    "updatedAt": "2024-03-20T00:00:00Z",

    "lesson": {

      "lessonId": "uuid",

      "title": "Lesson Title",

      "description": "Lesson description",

      "content": "Lesson content",

      "ordering": 1,

      "moduleId": "module-uuid",

      "courseId": "course-uuid",

      "status": "published",

      "shortDesc": "Short description",

      "image": "path/to/image",

      "startDate": "2024-03-20T00:00:00Z",

      "endDate": "2024-12-31T23:59:59Z",

      "storage": "local",

      "freeLesson": "yes",

      "noOfAttempts": "3",

      "attemptsGrade": "highest",

      "considerMarks": "yes",

      "format": "video",

      "mediaId": "media-uuid",

      "eligibilityCriteria": "Complete previous lesson",

      "idealTime": 45,

      "resume": true,

      "totalMarks": 100,

      "passingMarks": 60,

      "inLib": false,

      "params": "{}"

    }

  }

\\\]

}

}

## Course Tracking {#course-tracking} 📈

### Update Course Tracking ✏️

- **Endpoint**: `PUT /courses/tracking/:id`  
- **Description**: Updates a user's progress in a course  
- **Content-Type**: `application/json`  
- **Request Body**:

course\_id: uuid

user\_id: uuid

timestart: 2024-03-20T00:00:00Z

timeend: 2024-12-31T23:59:59Z

no\_of\_lessons: 10

completed\_lessons: 5

status: in\_progress

last\_accessed\_date: 2024-03-20T01:00:00Z

cert\_gen\_date: 2024-03-20T01:00:00Z

- **Response**:

{

"id": "api.course.tracking.update",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,

},

"responseCode": 200,

"result": {

"id": "uuid",

"course\_id": "uuid",

"user\_id": "uuid",

"timestart": "2024-03-20T00:00:00Z",

"timeend": "2024-12-31T23:59:59Z",

"no\_of\_lessons": 10,

"completed\_lessons": 5,

"status": "in\_progress",

"last\_accessed\_date": "2024-03-20T01:00:00Z",

"cert\_gen\_date": "2024-03-20T01:00:00Z"

}

}

- **On lesson complete add entry into track\_course to update completed\_lessons and if no\_of\_lessons==completed\_lessons then update status \= 'completed'**   
  {   
  course\_id: uuid

  user\_id: uuid


  completed\_lessons: 10


  "last\_accessed\_date": "2024-03-20T01:00:00Z",

  }

### Get Course Tracking 📋

- **Endpoint**: `GET /courses/tracking`  
- **Description**: Retrieves course tracking records with optional filters  
- **Query Parameters**:  
  - course\_id: UUID (optional) \- Filter by course ID  
  - user\_id: UUID (optional) \- Filter by user ID  
  - status: string (optional) \- Filter by status (incomplete, in\_progress )  
- **Response**:

{

"id": "api.course.tracking.list",

"ver": "1.0",

"ts": "2024-03-20T00:00:00Z",

"params": {

"resmsgid": "uuid",

"status": "successful",

"err": null,

"errmsg": null,

},

"responseCode": 200,

"result": {

"count": 1,

"tracking": \\\[

  {

    "id": "uuid",

    "course\_id": "uuid",

    "user\_id": "uuid",

    "timestart": "2024-03-20T00:00:00Z",

    "timeend": "2024-12-31T23:59:59Z",

    "no\_of\_lessons": 10,

    "completed\_lessons": 5,

    "status": "in\_progress",

    "last\_accessed\_date": "2024-03-20T01:00:00Z",

    "cert\_gen\_date": "2024-03-20T01:00:00Z",

    "course": {

      "courseId": "uuid",

      "title": "Course Title",

      "shortDescription": "Short course description",

      "description": "Detailed course description",

      "image": "path/to/image",

      "total\_modules": 5,

      "total\_lessons": 10,

      "total\_duration": 3600,

      "certificate\_eligible": true

    }

  }

\\\]

}

}

## Common Response Structure {#common-response-structure} 🔄

All API responses follow this general structure:

{

  "id": "string",        // API ID

  "ver": "1.0",         // API version

  "ts": "2024-03-20T00:00:00Z", // Timestamp

  "params": {

    "resmsgid": "uuid",  // Response message ID

    "status": "successful", // 'successful' or 'failed'

    "err": null,         // Error code (if any)

    "errmsg": null,      // Error message (if any)

  },

  "responseCode": number, // HTTP status code

  "result": object | array // Response data

}

### Status Codes {#status-codes} ⚠️

- 200: Success ✅  
- 201: Created ✅  
- 400: Bad Request ❌  
- 401: Unauthorized 🔒  
- 403: Forbidden ⛔  
- 404: Not Found 🔍  
- 500: Internal Server Error 💥
