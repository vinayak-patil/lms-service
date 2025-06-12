import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/response.interface';
import { HelperUtil } from '../utils/helper.util';
import { Reflector } from '@nestjs/core';
import { API_ID } from '../decorators/api-id.decorator';

@Catch(HttpException, Error)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private reflector: Reflector) {}
  
  catch(exception: HttpException | Error, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      
      // Handle both HttpException and regular Error
      const status = exception instanceof HttpException 
        ? exception.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
      
      const errorResponse = exception instanceof HttpException 
        ? exception.getResponse() 
        : exception.message;

      // Get the apiId from the handler metadata
      const apiId = this.reflector.get<string>(API_ID, request.route?.stack[0]?.handle) || 'api.error';

      // Enhanced logging with request context
      this.logger.error(
        `HTTP Exception: ${status} - ${request.method} ${request.url}`,
        {
          error: errorResponse,
          timestamp: new Date().toISOString(),
          path: request.path,
          method: request.method,
          ip: request.ip,
          userAgent: request.get('user-agent'),
        },
      );

      const responseBody: ApiResponse = {
        id: apiId,
        ver: '1.0',
        ts: new Date().toISOString(),
        params: {
          resmsgid: HelperUtil.generateMessageId(),
          status: 'failed',
          err: this.getErrorCode(status),
          errmsg: this.extractErrorMessage(errorResponse),
        },
        responseCode: status,
      };

      response.status(status).json(responseBody);
    } catch (error) {
      this.logger.error('Error in HttpExceptionFilter:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      const response = host.switchToHttp().getResponse<Response>();
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        id: 'api.error',
        ver: '1.0',
        ts: new Date().toISOString(),
        params: {
          resmsgid: HelperUtil.generateMessageId(),
          status: 'failed',
          err: 'ERR_INTERNAL_SERVER',
          errmsg: 'An unexpected error occurred while processing the API request',
        },
        responseCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  private getErrorCode(status: number): string {
    const errorCodes = {
      [HttpStatus.BAD_REQUEST]: 'ERR_BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'ERR_UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'ERR_FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'ERR_NOT_FOUND',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'ERR_METHOD_NOT_ALLOWED',
      [HttpStatus.REQUEST_TIMEOUT]: 'ERR_REQUEST_TIMEOUT',
      [HttpStatus.CONFLICT]: 'ERR_CONFLICT',
      [HttpStatus.GONE]: 'ERR_GONE',
      [HttpStatus.PAYLOAD_TOO_LARGE]: 'ERR_PAYLOAD_TOO_LARGE',
      [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'ERR_UNSUPPORTED_MEDIA_TYPE',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'ERR_UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'ERR_TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'ERR_INTERNAL_SERVER',
      [HttpStatus.NOT_IMPLEMENTED]: 'ERR_NOT_IMPLEMENTED',
      [HttpStatus.BAD_GATEWAY]: 'ERR_BAD_GATEWAY',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'ERR_SERVICE_UNAVAILABLE',
      [HttpStatus.GATEWAY_TIMEOUT]: 'ERR_GATEWAY_TIMEOUT',
    };

    return errorCodes[status] || 'ERR_UNKNOWN';
  }

  private extractErrorMessage(errorResponse: any): string {
    if (!errorResponse) {
      return 'An unexpected error occurred';
    }

    if (typeof errorResponse === 'string') {
      return errorResponse;
    }

    if (typeof errorResponse === 'object') {
      // Handle array of messages
      if (Array.isArray(errorResponse.message)) {
        return errorResponse.message[0];
      }
      
      // Handle single message
      if (errorResponse.message) {
        return errorResponse.message;
      }
      
      // Handle error property
      if (errorResponse.error) {
        return errorResponse.error;
      }
      
      // Handle validation errors
      if (errorResponse.errors) {
        const firstError = Object.values(errorResponse.errors)[0];
        if (typeof firstError === 'string') {
          return firstError;
        }
        if (Array.isArray(firstError)) {
          return typeof firstError[0] === 'string' ? firstError[0] : 'Validation error';
        }
        return 'Validation error';
      }
    }

    return 'An unexpected error occurred';
  }
}