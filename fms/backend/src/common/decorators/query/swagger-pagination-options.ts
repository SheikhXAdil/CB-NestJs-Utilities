import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const ApiPaginatedQueryOptions = () =>
  applyDecorators(
    ApiQuery({
      name: 'page',
      type: String,
      required: false,
      description: 'default 1',
    }),
    ApiQuery({
      name: 'limit',
      type: String,
      required: false,
      description: 'default 10',
    }),
  );
