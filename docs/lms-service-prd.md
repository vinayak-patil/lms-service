# 📚 Learning Management System (LMS) - Product Requirements Document

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

### 🎯 Product Vision
To create a flexible, scalable LMS that empowers educators to deliver high-quality learning experiences while providing learners with intuitive access to educational content.

### 👥 Target Users
- **Administrators**: Manage the overall system, users, and content
- **Instructors**: Create and manage courses and lessons
- **Learners**: Consume educational content and track progress

## 🔐 User Management

### 👥 User Roles and Permissions

#### 🛠️ Administrator
- System-wide access and configuration
- Content approval and quality control
- Analytics and reporting access

#### 👨‍🏫 Instructor
- Course and lesson creation
- Student enrollment management
- Progress tracking and grading
- Limited analytics access (for their courses only)

#### 👨‍🎓 Learner
- Course browsing and enrollment
- Content consumption
- Progress tracking
- Certificate acquisition

### 🔒 Authentication & Access Control
- All requests will be authenticated using JWT headers
- JWT will include claims like user_id, role, and company_id
- Role-Based Access Control (RBAC) enforced at route/method level

## 📝 Content Creation

### 📚 Course and Module Structure

#### 🎯 Course Creation
- Title, description, objectives, and outcomes
- Cover image and promotional materials
- Categorization and tagging
- Course parameters (as detailed in section 6.1)

#### 📑 Module Management
- Module creation within courses
- Ordering and sequencing capabilities
- Module-level learning objectives
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
- Time limits for timed assessments

#### 📈 Progress Control
- Resume capability configuration
- Progress persistence settings

#### 📝 Assessment Configuration
- Total marks definition
- Passing threshold configuration

## 👥 User Enrollment and Tracking

### 📝 Enrollment Management
- Self-enrollment capabilities
- Bulk enrollment by administrators
- Enrollment approval workflows

### 📊 Progress Tracking

#### 📈 Course-Level Tracking
- Overall completion percentage
- Time spent in course
- Engagement analytics

#### 📊 Lesson-Level Tracking
- Completion status
- Time spent per lesson
- Scores

#### 📊 Standalone Lesson Tracking
- Independent progress tracking
- Completion certificates for individual lessons
- Performance metrics outside of course context

### 📊 Reporting and Analytics
- Individual learner reports
- Course performance analytics
- Exportable data for external analysis

