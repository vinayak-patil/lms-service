import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CommonQueryDto {
  @ApiProperty({
    description: 'User ID',
    format: 'uuid',
    required: true
  })
  @IsNotEmpty({ message: "User ID is required field" })
  @IsUUID('4', { message: "User ID must be a valid UUID" })
  userId: string;

  @ApiProperty({
    description: 'Tenant ID',
    format: 'uuid',
    required: true
  })
  @IsNotEmpty({ message: "Tenant ID is required field" })
  @IsUUID('4', { message: "Tenant ID must be a valid UUID" })
  tenantId: string;

  @ApiProperty({
    description: 'Organisation ID',
    format: 'uuid',
    required: true
  })
  @IsNotEmpty({ message: "Organisation ID is required field" })
  @IsUUID('4', { message: "Organisation ID must be a valid UUID" })
  organisationId: string;
} 