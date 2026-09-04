import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { APIFailureResponse } from '../classes/BaseResponse';
import { ZodError } from 'zod';
import { ZodValidationException } from 'nestjs-zod';

@Catch(HttpException)
export class FailureExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger(FailureExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();

    if (status === 400 && exception.message === 'Validation failed') {
      let error: ZodError;
      let message: string;
      if (exception instanceof ZodValidationException) {
        const zodException: ZodValidationException = exception;
        error = zodException.getZodError();
        this.logger.error(error);
        message =
          (error.errors[0].path.length > 0
            ? `Error in ${error.errors[0].path[1] ? error.errors[0].path[1] : error.errors[0].path[0]}. `
            : '') + error.errors[0].message;
      } else {
        error = exception.getResponse() as ZodError;
        this.logger.error(error);
        message = 'Error in Validation';
      }
      // console.log(message);
      this.logger.fatal(`Status Code: ${status}`);
      this.logger.error(message);
      response.statusCode = 200;
      response.send(new APIFailureResponse(status, message));
    } else {
      this.logger.fatal(`Status Code: ${status}`);
      this.logger.error(exception.message);
      response.statusCode = 200;
      response.send(new APIFailureResponse(status, exception.message));
    }
  }
}
