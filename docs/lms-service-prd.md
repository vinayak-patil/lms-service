# 📚 Product Requirements Document

## 📝 Introduction

### 🎯 Purpose
This Product Requirements Document (PRD) outlines the specifications for a comprehensive Learning Management System (LMS) designed to facilitate effective online education through robust user management, content creation, and content consumption capabilities.

### 📌 Scope
The LMS will provide a complete platform for creating, managing, and delivering educational content to learners with flexible course structures, diverse lesson types, and comprehensive tracking mechanisms.

### 📖 Definitions
- **Course**: A collection of modules organized around a specific subject or learning objective
- **Module**: A grouping of related lessons within a course
- **Lesson**: An individual learning unit that can exist independently or as part of a course
- **Enrollment**: The process of a user registering for a course

## 🚀 Product Overview

To create a flexible, scalable LMS that empowers educators to deliver high-quality learning experiences while providing learners with intuitive access to educational content.

### 👥 Target Users

#### 🛠️ Administrator
- System-wide access and configuration
- Content control
- Analytics and reporting access

#### 👨‍🏫 Instructor
- Course and lesson creation
- Student enrollment management
- Progress tracking and grading
- Limited report access (for their courses only)

#### 👨‍🎓 Learner
- Course browsing and enrollment
- Content consumption
- Progress tracking

### 🔒 Authentication & Access Control
- All requests will be authenticated using JWT headers
- JWT will include claims like user_id, role, and tenentId
- Role-Based Access Control (RBAC) enforced at route/method level

## 🏢 Multi-Tenancy Support
### 🧱 Multi-Tenant Architecture
 - The LMS will support row-level multi-tenancy to allow multiple organizations to use the system securely and independently.

 - Each data entity that is tenant-specific will include a tenant_id field.

 - JWT tokens include a tenantId claim to identify and restrict access.

## 📝 Content Creation

### 📚 Course and Module Structure

#### 🎯 Course Creation
- Title, description, objectives, and outcomes
- Cover image and promotional materials
- Categorization
- Course parameters (as detailed in section 6.1)

#### 📑 Module Management
- Module creation within courses
- Ordering and sequencing capabilities
- Prerequisite relationships between modules

#### 📖 Lesson Management
- Creation of standalone lessons
- Mapping lessons to courses/modules
- Lesson sequencing and prerequisites
- Lesson parameters (as detailed in section 6.2)

### 📺 Supported Lesson Types

#### 🎥 Video Lessons
- Support for YouTube, Vimeo, and direct video URL embedding
- Viewing progress tracking

#### 📄 Document Lessons
- PDF upload and viewing capabilities
- In-browser document reader

#### 📅 Event Lessons
- Integration with external event services

#### 📝 Quiz Lessons
- Integration with external quiz / exercise services (assessment)

## 📱 Content Consumption

### 🔍 Course Discovery
- Search functionality with filters
- Course catalog with categories
- Featured courses section
- Recommendation engine based on user interests and history

### 📚 Learning Experience
- Responsive design for multi-device access
- Intuitive navigation between lessons and modules
- Progress indicators and breadcrumbs
- Note-taking capabilities

## ⚙️ Course and Lesson Management

### 📊 Course Parameters

#### 🏷️ Featured Flag
- Toggle to mark courses as featured
- Featured courses appear prominently in the catalog
- Featured status can be time-limited

#### 💰 Type
- Free/Paid Subscription-based access

#### 🎓 Certificate Criteria
- Complete all lessons
- Pass lessons

#### 📅 Course Scheduling
- Start and end dates configuration

#### ✅ Enrollment Approval
- Toggle for admin approval requirement

### 📝 Lesson Parameters

#### ⏰ Availability Window
- Lesson start and end dates
- Time-based access restrictions
- Prerequisite-based availability

#### 🔄 Attempt Management
- Configuration for number of allowed attempts

#### 📊 Grading Configuration
- Grading method selection:
  - Highest score
  - Last attempt
  - First attempt
  - Average score
- Grade weighting within course

#### 🔗 Prerequisites
- Lesson dependency configuration

#### ⏱️ Time Management
- Estimated completion time display
- Actual time tracking

#### 📈 Progress Control
- Resume capability configuration
- Progress persistence settings


### 3.6 Enrollment and Tracking

- Manual or admin-approved enrollment
- Track course and lesson completion
- Separate tracking for standalone lessons
- Quiz scoring and history
- Certificate eligibility based on rules

### Eligibility and Prerequisites

- **Module-Level Prerequisite**  
  check **set of configured prerequisite lessons** before accessing the module.

- **Lesson-Level Prerequisite**  
  Similar to module-level, check  **configured prerequisite lessons** before accessing the lesson.

- **API Enforcement**  
  All **Module and Lesson access APIs** for learner/student must enforce eligibility checks based on defined prerequisites.  
  If the prerequisites are not satisfied, the API should return a **403 Forbidden** or a configurable error response indicating unmet requirements.

---

### Badges and Certificates

- **Badges (Module-Level Only)**  
  - Upon successful completion of a module (with prerequisites met), the system should emit a **`module.badge.eligible`** event.  
  - This event will include relevant user and module metadata.  
  - Badge generation (e.g., image creation) is handled externally and is **not part of this system**.

- **Certificates**  
  - Certificate eligibility can be based on **Module-Level prerequisites**, **Lesson-Level prerequisites**, or **custom-defined criteria** (e.g., "Completion of Module 1 is mandatory").  
  - When the criteria are met, emit a **`certificate.eligible`** event with relevant user, module, and progress data.  
  - Certificate generation and distribution will be managed by an external service.


## 👥 User Enrollment and Tracking

### 📝 Enrollment Management
- Self-enrollment capabilities
- Bulk enrollment by administrators
- Enrollment approval workflows

### 📊 Progress Tracking

#### 📈 Course-Level Tracking
- Overall completion percentage
- Time spent in course
- Last accessed date
- Certificate generation tracking
- Course status (incomplete/complete)

#### 📊 Module-Level Tracking
- Module completion status
- Badge generation tracking
- Module-level prerequisites enforcement

#### 📊 Lesson-Level Tracking
- Completion status
- Time spent per lesson
- Scores and attempts
- Progress position tracking
- Total content length tracking
- Current position tracking
- Attempt history

#### 📊 Standalone Lesson Tracking
- Independent progress tracking
- Attempt management
- Score tracking
- Time spent tracking

### 📊 Reporting
- Individual learner reports
- Course level reports
- Lesson level reports
- Exportable data
- Certificate eligibility reports
- Badge eligibility reports

### 📱 Content Management
- Media file management
- Associated files support
- Multiple media formats support
- Storage type configuration
- Media source tracking

### 🔒 Access Control
- Lesson checkout system
- Content access restrictions
- Time-based access control
- Prerequisite-based access control
- Attempt-based access control
