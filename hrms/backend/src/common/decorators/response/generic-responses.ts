import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { APIBaseResponse } from '../../classes/BaseResponse';

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
