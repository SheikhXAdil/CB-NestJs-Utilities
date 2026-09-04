import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  APIBaseResponse,
  APIPaginatedResponse,
} from '../../classes/BaseResponse';

export const ApiOkResponseGeneric = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(APIBaseResponse) },
          {
            type: 'object',
            properties: { data: { $ref: getSchemaPath(dataDto) } },
          },
        ],
      },
    }),
  );

export const ApiOkResponseGenericArray = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(APIBaseResponse) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
    }),
  );

export const ApiOkResponseGenericPaginated = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(APIPaginatedResponse) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
    }),
  );

export const ApiOkResponseCsv = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Returns a CSV file',
      content: {
        'text/csv': {
          schema: {
            type: 'string',
            format: 'binary', // Indicates a file response
          },
        },
      },
    }),
  );

export const ApiOkResponseExcel = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Returns a Excel file',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: {
            type: 'string',
            format: 'binary', // Indicates a file response
          },
        },
      },
    }),
  );

export const ApiOkResponsePdf = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Returns a Pdf file',
      content: {
        'application/pdf': {
          schema: {
            type: 'string',
            format: 'binary', // Indicates a file response
          },
        },
      },
    }),
  );
