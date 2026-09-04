import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { APIStatus } from '../classes/BaseResponse';

@Injectable()
export class ExceptionLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExceptionLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const body = request.body;

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (data && data.status === APIStatus.Failure) {
            // Log URL and body if the status is failure
            this.logger.debug(`Request URL: ${url}`);
            this.logger.debug(`Body: ${JSON.stringify(body)}`);
            this.logger.debug(`Response: ${JSON.stringify(data)}`);
          }
        },
        error: (err) => {
          // Log URL and body if an exception occurs
          this.logger.debug(`Request URL: ${url}`);
          this.logger.debug(`Body: ${JSON.stringify(body)}`);
          this.logger.debug(`Error: ${err.message}`, err.stack);
        },
      }),
    );
  }
}
