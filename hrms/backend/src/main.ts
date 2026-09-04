import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import multiPart from '@fastify/multipart';
import { patchNestJsSwagger } from 'nestjs-zod';
import { APIBaseResponse } from './common/classes/BaseResponse';
import { ExceptionLoggingInterceptor } from './common/interceptors/exception-logger';
import { FailureExceptionFilter } from './common/exception-filters/failure-exception';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true, bodyLimit: 40 * 1024 * 1024 }),
  );

  patchNestJsSwagger();
  const options = new DocumentBuilder()
    .setTitle('CB-HRMS API')
    .setDescription('CB_HRMS API description')
    .setVersion('1.0')
    .addServer('http://localhost:3000/', 'Local environment')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    extraModels: [APIBaseResponse],
  });
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalInterceptors(new ExceptionLoggingInterceptor());
  app.useGlobalFilters(new FailureExceptionFilter());

  await app.register(multiPart);

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`, 'unpkg.com'],
        styleSrc: [
          `'self'`,
          `'unsafe-inline'`,
          'cdn.jsdelivr.net',
          'fonts.googleapis.com',
          'unpkg.com',
        ],
        fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
        imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
        scriptSrc: [
          `'self'`,
          `https: 'unsafe-inline'`,
          `cdn.jsdelivr.net`,
          `'unsafe-eval'`,
        ],
      },
    },
  });
  app.enableCors();

  await app.listen(3000);
}
bootstrap();
