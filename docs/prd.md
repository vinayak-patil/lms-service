# Product Requirements Document (PRD)

**Version**: 1.0  
**Last Updated**: April 30, 2025  

---

## 1. Objective

Develop a scalable, multi-tenant Learning Management System (LMS) that enables organizations to create and manage structured learning content (courses, modules, and lessons), allow learners to consume content, track progress, and issue certificates. User management (authentication, registration, roles) is handled by an external User Service.

---

## 2. Scope

### 2.1 In-Scope

- Course and module management
- Lesson management (video, document, event, quiz)
- Enrollment workflows (manual and admin-approved)
- Learner progress tracking
- Certification logic and issuance
- Multi-tenancy support with per-organization isolation
- Role-based access (via JWT claims)
- Integration with:
  - YouTube/Vimeo/direct URLs
  - External quiz tools
  - Live event platforms (e.g., Zoom, Google Meet)

### 2.2 Out-of-Scope

- User registration, login, and profile management
- Payment/billing integration
- Gamification (badges, points, leaderboards)
- Messaging or internal communication tools
- Offline mobile content
- Content moderation or user reporting

---

## 3. Key Features

### 3.1 Multi-Tenancy Support

- Organization-level data isolation
- Tenant ID resolved from JWT or headers
- Shared backend infrastructure
- Role and access boundaries enforced per tenant

### 3.2 Course and Content Structure

- Course > Module > Lesson hierarchy
- Reusable lessons across multiple courses
- Support for standalone lessons

### 3.3 Lesson Types

| Type     | Description                                |
|----------|--------------------------------------------|
| Video    | Embed via YouTube, Vimeo, or direct URL    |
| Document | Upload and render PDF, PPT            |
| Event    | Link to live sessions (Zoom, Google Meet)  |
| Quiz     | Embed via external tool or iframe/API      |

### 3.4 Course Configuration

- Featured flag  
- Access type: Free or Paid  
- Certificate eligibility criteria  
- Start and end schedule  
- Admin approval for enrollment

### 3.5 Lesson Configuration

- Availability window (start/end)
- Max attempts (e.g., for quizzes)
- Resume functionality
- Prerequisite lessons
- Ideal completion time
- Grading logic: highest, first, last, average
- Total and passing marks

### 3.6 Enrollment and Tracking

- Manual or admin-approved enrollment
- Track course and lesson completion
- Separate tracking for standalone lessons
- Quiz scoring and history
- Certificate eligibility based on rules

### 3.7 Eligibility and Prerequisites:
 - Module-Level Prerequisite: Users must complete at least 2 lessons from Module 1 Or selected prerequisite lessons must be completed.
 - Lesson-Level Prerequisite: Similar to module-level, users must complete at least 2 specified lessons from Module 1  Ors selected lessons must be completed before proceeding.
       
### 3.8 Badges and Certificates:
 - Module-level badges on module completion, Module completion rules (including prerequisites) will apply for badge generation in the image format.
 - Certificate eligibility can be considered as both Module-Level and Lesson-Level prerequisites or An configurable criteria can be defined, such as completion of Module 1 being mandatory.

---

## 4. Functional Requirements

### 4.1 Course & Module Management

- CRUD operations on courses and modules
- Assign lessons to modules
- Reorder modules/lessons

### 4.2 Lesson Management

- CRUD operations for lessons
- Upload/Embed/Link based on type
- Configure all lesson parameters

### 4.3 Enrollment Management

- Manual and approval-based enrollment
- View and manage enrollment per course

### 4.4 Progress Tracking

- Track per-lesson and per-course completion
- Log quiz scores and attempts
- Determine certificate eligibility

---

## 5. Technical Requirements

### 5.1 Architecture

- Node.js (NestJS) microservice architecture
- PostgreSQL as the primary database
- Redis for caching
- Kafka or RabbitMQ for async events
- REST APIs with Swagger (OpenAPI) documentation

### 5.2 Multi-Tenancy

- Row-level or schema-based data segregation
- Tenant resolution via JWT/header
- Shared services, isolated data

### 5.3 Frontend

- React.js frontend (web)
- Multilingual support using i18next
- Responsive design
- Role-based content display

### 5.4 Security & Access Control

- JWT-based authentication (via external user service)
- Role-based access enforcement
- HTTPS only, input validation and sanitation

### 5.5 DevOps & Monitoring

- Docker + Kubernetes (Helm for config)
- CI/CD with GitHub Actions or GitLab CI
- Logging: Fluentd or ELK stack
- Monitoring: Prometheus + Grafana
- Alerts via Slack/email integrations

---

## 6. Non-Functional Requirements

| Requirement     | Details                                     |
|------------------|---------------------------------------------|
| Performance      | Support for 100K concurrent learners         |
| Scalability      | Horizontally scalable microservices          |
| Localization     | i18next for translations                    |
| Availability     | 99.9% uptime SLA                            |
| Backup/Recovery  | Daily tenant-level backups, RTO < 2hr       |
| Security         | JWT, RBAC, HTTPS secure coding       |

---

## 7. Integration Points

| System           | Purpose                                     |
|------------------|---------------------------------------------|
| User Service     | Auth, role, and identity resolution         |
| Quiz Engine      | Embed quizzes, submit results               |
| Meeting Tools    | External event links                        |
| Certificate Engine| PDF generation, rules evaluation          |

---
