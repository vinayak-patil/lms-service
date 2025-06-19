# Database Transaction and Error Handling for Save Order Endpoint

## Overview

The save order endpoint has been enhanced with comprehensive database transaction management and robust error handling to ensure data consistency and provide meaningful error responses. The implementation uses TypeORM's Repository Manager transaction approach for cleaner, more maintainable code.

## Database Transaction Implementation

### Transaction Flow

1. **Transaction Start**: Each order saving operation begins with a Repository Manager transaction
2. **Validation Phase**: All entities are validated within the transaction
3. **Update Phase**: Ordering updates are performed atomically
4. **Commit/Rollback**: Transaction is automatically committed on success or rolled back on error

### Key Features

- **Atomic Operations**: All ordering updates are performed as a single atomic transaction
- **Data Consistency**: Ensures partial updates don't leave the database in an inconsistent state
- **Automatic Rollback**: Automatic rollback if any operation fails
- **Resource Management**: Automatic cleanup of database connections
- **Clean Code**: Simplified transaction management using Repository Manager

## Error Handling Improvements

### Validation Errors

#### Input Validation
- **Missing Required Fields**: Validates courseId for modules, moduleId for lessons
- **Invalid UUID Format**: Ensures all IDs are valid UUIDs
- **Duplicate IDs**: Prevents duplicate IDs in the ordering array
- **Empty Arrays**: Validates that the IDs array is not empty

#### Business Logic Validation
- **Entity Existence**: Validates that all entities exist and belong to the correct context
- **Course Validation**: Ensures the course exists and is not archived
- **Module Validation**: For lesson ordering, validates the module exists and belongs to the course
- **Submodule Restriction**: Prevents saving order for submodules at course level

### Error Response Types

#### 400 Bad Request
- Invalid request data
- Missing required fields
- Duplicate IDs in array
- Invalid UUID format
- Business logic violations

#### 404 Not Found
- Course not found
- Module not found
- Lessons not found
- Entities don't belong to specified context

#### 500 Internal Server Error
- Database connection issues
- Unexpected system errors

## Implementation Details

### Service Layer Enhancements

```typescript
async saveOrder(
  saveOrderDto: SaveOrderDto,
  userId: string,
  tenantId: string,
  organisationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Use Repository Manager transaction approach
    const result = await this.moduleRepository.manager.transaction(async (transactionalEntityManager) => {
      if (saveOrderDto.moduleType === ModuleType.MODULE) {
        await this.saveModuleOrder(/* params */, transactionalEntityManager);
      } else {
        await this.saveLessonOrder(/* params */, transactionalEntityManager);
      }

      return { success: true, message: 'Order saved successfully' };
    });

    // Handle cache invalidation after successful transaction
    await this.invalidateCaches(/* params */);

    return result;
  } catch (error) {
    // Automatic rollback on error
    throw error;
  }
}
```

### Validation Enhancements

#### DTO Validation
```typescript
export class SaveOrderDto {
  @IsEnum(ModuleType)
  moduleType: ModuleType;

  @IsUUID('4')
  courseId: string;

  @ValidateIf((o) => o.moduleType === ModuleType.LESSON)
  @IsUUID('4')
  moduleId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  @Validate(validateUniqueIds)
  ids: string[];
}
```

#### Business Logic Validation
```typescript
// Validate course exists
const course = await transactionalEntityManager.findOne(Course, {
  where: { courseId, status: Not(CourseStatus.ARCHIVED) }
});

if (!course) {
  throw new NotFoundException('Course not found');
}

// Validate all entities exist
const entities = await transactionalEntityManager.find(Entity, {
  where: { id: In(ids) }
});

if (entities.length !== ids.length) {
  const missingIds = ids.filter(id => !entities.find(e => e.id === id));
  throw new BadRequestException(`Missing entities: ${missingIds.join(', ')}`);
}
```

## Repository Manager vs QueryRunner Approach

### Repository Manager Approach (Current Implementation)
✅ **Advantages:**
- Cleaner, more concise code
- Automatic resource management
- Built-in error handling and rollback
- Less prone to resource leaks
- Easier to read and maintain
- Consistent with other service methods (like cloneCourse)

❌ **Disadvantages:**
- Less control over transaction lifecycle
- Cannot perform operations outside transaction
- Limited to repository operations

### QueryRunner Approach (Previous Implementation)
✅ **Advantages:**
- Full control over transaction lifecycle
- Explicit resource management
- Custom error handling and logging
- Can perform operations outside transaction if needed

❌ **Disadvantages:**
- More verbose code
- Manual resource cleanup required
- Higher chance of resource leaks if not handled properly

## Cache Management

### Cache Invalidation Strategy
- **Selective Invalidation**: Only invalidates relevant caches
- **Error Isolation**: Cache invalidation failures don't affect the main operation
- **Async Processing**: Cache operations are performed asynchronously after transaction commit

### Cache Keys Invalidated
- Course module cache: `module:course:{courseId}:{tenantId}:{organisationId}`
- Course hierarchy cache: `course:hierarchy:{courseId}:{tenantId}:{organisationId}`

## Logging and Monitoring

### Structured Logging
- **Operation Start**: Logs the beginning of order saving operations
- **Success Logging**: Logs successful completion with entity counts
- **Error Logging**: Comprehensive error logging with stack traces
- **Performance Monitoring**: Tracks operation duration

### Log Levels
- **INFO**: Successful operations and general flow
- **WARN**: Non-critical issues (e.g., cache invalidation failures)
- **ERROR**: Critical errors requiring attention

## Testing Considerations

### Transaction Testing
- **Rollback Testing**: Verify that failed operations don't persist changes
- **Concurrent Access**: Test behavior under concurrent order saving operations
- **Database Failures**: Test behavior when database connections fail

### Error Scenario Testing
- **Invalid Input**: Test with malformed request data
- **Missing Entities**: Test with non-existent IDs
- **Permission Issues**: Test with unauthorized access
- **Network Issues**: Test with database connectivity problems

## Performance Optimizations

### Database Operations
- **Batch Updates**: Uses Promise.all for concurrent updates
- **Minimal Queries**: Optimized queries to reduce database load
- **Connection Pooling**: Efficient use of database connections

### Memory Management
- **Automatic Cleanup**: Repository Manager handles resource disposal
- **Memory Leak Prevention**: No manual resource management required

## Security Considerations

### Input Sanitization
- **UUID Validation**: Ensures all IDs are valid UUIDs
- **Array Validation**: Prevents injection attacks through array manipulation
- **Tenant Isolation**: Maintains proper tenant and organization isolation

### Access Control
- **Entity Ownership**: Validates that entities belong to the requesting tenant/organization
- **Permission Checks**: Ensures users can only save order for entities they have access to

## Best Practices Implemented

1. **ACID Compliance**: Full transaction support for data consistency
2. **Defensive Programming**: Comprehensive validation at multiple levels
3. **Graceful Degradation**: System continues to function even if non-critical components fail
4. **Comprehensive Logging**: Detailed logging for debugging and monitoring
5. **Automatic Resource Management**: Repository Manager handles cleanup automatically
6. **Error Propagation**: Clear error messages that help identify and resolve issues
7. **Code Consistency**: Uses the same transaction pattern as other service methods 