# Save Order Endpoint for Modules and Lessons

## Overview

This document describes the implementation of a save order endpoint for modules and lessons in the Learning Management System (LMS). The endpoint allows saving the order of modules within a course and lessons within a module using a flexible, transaction-safe approach.

## Endpoint Details

- **Method**: POST
- **Route**: `/modules/order`
- **Authentication**: Required
- **Authorization**: User must have access to the course/module

## Request Body Structure

```json
{
  "moduleType": "MODULE" | "LESSON",
  "courseId": "uuid",
  "moduleId": "uuid", // Required only for lesson ordering
  "ids": ["uuid1", "uuid2", "uuid3", ...]
}
```

### Field Descriptions

- **moduleType**: Type of entities to save order for (`MODULE` or `LESSON`)
- **courseId**: UUID of the course containing the modules/lessons
- **moduleId**: UUID of the module containing lessons (required only for lesson ordering)
- **ids**: Array of entity UUIDs in the desired order

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Order saved successfully"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Order Saving Logic

### Module Order Saving
- Updates the `ordering` field of modules based on their position in the `ids` array
- Validates that all modules belong to the specified course
- Ensures course is not archived
- Prevents saving order for submodules at course level

### Lesson Order Saving
- Updates the `ordering` field of lessons based on their position in the `ids` array
- Validates that all lessons belong to the specified module
- Ensures module belongs to the specified course
- Validates course is not archived

## Implementation Details

### Database Transaction Management
The order saving operation uses TypeORM's Repository Manager transaction approach for:
- **Atomic Operations**: All ordering updates are performed as a single transaction
- **Data Consistency**: Automatic rollback on any failure
- **Resource Management**: Automatic cleanup of database connections
- **Clean Code**: Simplified transaction management

### Service Layer Implementation
```typescript
async saveOrder(
  saveOrderDto: SaveOrderDto,
  userId: string,
  tenantId: string,
  organisationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await this.moduleRepository.manager.transaction(async (transactionalEntityManager) => {
      if (saveOrderDto.moduleType === ModuleType.MODULE) {
        await this.saveModuleOrder(/* params */, transactionalEntityManager);
      } else {
        await this.saveLessonOrder(/* params */, transactionalEntityManager);
      }
      return { success: true, message: 'Order saved successfully' };
    });

    await this.invalidateCaches(/* params */);
    return result;
  } catch (error) {
    throw error; // Automatic rollback on error
  }
}
```

### Validation and Error Handling
- **Input Validation**: Comprehensive DTO validation with custom validators
- **Business Logic Validation**: Entity existence and context validation
- **Error Propagation**: Clear error messages with appropriate HTTP status codes
- **Cache Management**: Automatic cache invalidation after successful operations

## Related Endpoints

- `GET /modules/course/{courseId}` - Retrieve modules for a course (ordered by `ordering`)
- `GET /lessons/module/{moduleId}` - Retrieve lessons for a module (ordered by `ordering`)
- `POST /modules` - Create new modules
- `POST /lessons` - Create new lessons

## Usage Examples

### Save Module Order in a Course
```bash
curl -X POST /modules/order \
  -H "Content-Type: application/json" \
  -d '{
    "moduleType": "MODULE",
    "courseId": "123e4567-e89b-12d3-a456-426614174000",
    "ids": [
      "456e7890-e89b-12d3-a456-426614174001",
      "789e0123-e89b-12d3-a456-426614174002",
      "012e3456-e89b-12d3-a456-426614174003"
    ]
  }'
```

### Save Lesson Order in a Module
```bash
curl -X POST /modules/order \
  -H "Content-Type: application/json" \
  -d '{
    "moduleType": "LESSON",
    "courseId": "123e4567-e89b-12d3-a456-426614174000",
    "moduleId": "456e7890-e89b-12d3-a456-426614174001",
    "ids": [
      "789e0123-e89b-12d3-a456-426614174002",
      "012e3456-e89b-12d3-a456-426614174003",
      "345e6789-e89b-12d3-a456-426614174004"
    ]
  }'
```

## Key Features

- **Flexible Order Saving**: Supports both module and lesson order saving
- **Data Validation**: Comprehensive input and business logic validation
- **Cache Management**: Automatic cache invalidation for performance
- **Error Handling**: Robust error handling with meaningful messages
- **Type Safety**: Full TypeScript support with proper DTOs
- **Transaction Safety**: Database transaction management for data consistency
- **Complete Documentation**: Comprehensive API documentation with Swagger 