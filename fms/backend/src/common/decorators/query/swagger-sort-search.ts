import { applyDecorators } from '@nestjs/common';
import { ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { SwaggerEnumType } from '@nestjs/swagger/dist/types/swagger-enum.type';

export const ApiQuerySortOptions = (sortKeyEnum: SwaggerEnumType) =>
  applyDecorators(
    ApiQuery({
      name: 'sortKey',
      required: false,
      enum: sortKeyEnum,
      description: 'The key to sort the results by (default: id)',
    }),
    ApiQuery({
      name: 'sortOrder',
      type: String,
      required: false,
      enum: ['ASC', 'DESC'],
      description:
        'Sort order: ASC for ascending, DESC for descending (default: ASC)',
    }),
  );

export const ApiSearchQueryParam = () =>
  applyDecorators(
    ApiQuery({
      name: 'search',
      type: String,
      required: false,
    }),
  );
